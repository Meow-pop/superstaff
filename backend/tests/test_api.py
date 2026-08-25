import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture()
def client(tmp_path):
    app = create_app(tmp_path / "test-superstaff.db")
    with TestClient(app) as test_client:
        yield test_client


def create_job(client: TestClient):
    response = client.post(
        "/api/v1/jobs",
        json={
            "employee_id": "content-operator",
            "title": "首周内容计划",
            "goal": "为超级 AI 员工产品准备第一周的内容发布计划",
        },
    )
    assert response.status_code == 201
    return response.json()


def test_health_and_seeded_employees(client: TestClient):
    health = client.get("/api/v1/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    employees = client.get("/api/v1/employees")
    assert employees.status_code == 200
    payload = employees.json()
    assert len(payload) == 3
    assert any(item["id"] == "content-operator" for item in payload)


def test_job_lifecycle_from_draft_to_done(client: TestClient):
    job = create_job(client)
    assert job["status"] == "draft"
    assert len(job["steps"]) == 3
    assert all(step["status"] == "pending" for step in job["steps"])

    executed = client.post(f"/api/v1/jobs/{job['id']}/run")
    assert executed.status_code == 200
    review_job = executed.json()
    assert review_job["status"] == "review"
    assert all(step["status"] == "done" for step in review_job["steps"])
    assert len(review_job["artifacts"]) == 1
    assert "首版成果" in review_job["artifacts"][0]["title"]

    approved = client.post(f"/api/v1/jobs/{job['id']}/approve")
    assert approved.status_code == 200
    assert approved.json()["status"] == "done"


def test_invalid_state_transition_returns_conflict(client: TestClient):
    job = create_job(client)
    response = client.post(f"/api/v1/jobs/{job['id']}/approve")
    assert response.status_code == 409
    assert "只有待验收任务" in response.json()["detail"]


def test_unknown_job_returns_not_found(client: TestClient):
    response = client.get("/api/v1/jobs/job_missing")
    assert response.status_code == 404


def test_unavailable_employee_cannot_accept_job(client: TestClient):
    response = client.post(
        "/api/v1/jobs",
        json={
            "employee_id": "sales-assistant",
            "title": "销售线索跟进",
            "goal": "整理本周新增线索并形成可以发送的首轮触达话术",
        },
    )
    assert response.status_code == 409
    assert "暂时不能接任务" in response.json()["detail"]


def test_seeded_workflow_can_run_and_persist_result(client: TestClient):
    workflows = client.get("/api/v1/workflows")
    assert workflows.status_code == 200
    payload = workflows.json()
    assert len(payload) == 3
    content_workflow = next(
        item for item in payload if item["id"] == "workflow-content-engine"
    )
    assert len(content_workflow["steps"]) == 4

    response = client.post(
        f"/api/v1/workflows/{content_workflow['id']}/runs",
        json={"input": "解释超级 AI 员工与普通聊天机器人的本质差异"},
    )
    assert response.status_code == 200
    run = response.json()
    assert run["status"] == "done"
    assert all(step["status"] == "done" for step in run["steps"])
    assert len(run["steps"]) == 4
    assert "质量检查" in run["output"]

    stored_runs = client.get(
        "/api/v1/workflow-runs",
        params={"workflow_id": content_workflow["id"]},
    )
    assert stored_runs.status_code == 200
    assert stored_runs.json()[0]["id"] == run["id"]

    updated_workflow = client.get(f"/api/v1/workflows/{content_workflow['id']}")
    assert updated_workflow.json()["run_count"] == 1


def test_custom_workflow_create_run_and_delete(client: TestClient):
    created = client.post(
        "/api/v1/workflows",
        json={
            "name": "博士论文内容拆解",
            "description": "把研究主题整理成适合不同受众的内容。",
            "icon": "研",
            "color": "#4f78df",
            "steps": [
                {"name": "提取结论", "instruction": "提取最重要的研究结论和证据。"},
                {"name": "生成内容", "instruction": "生成面向非专业受众的解释内容。"},
            ],
        },
    )
    assert created.status_code == 201
    workflow = created.json()
    assert workflow["status"] == "ready"
    assert len(workflow["steps"]) == 2

    run = client.post(
        f"/api/v1/workflows/{workflow['id']}/runs",
        json={"input": "解释电力系统优化调度研究的实际价值"},
    )
    assert run.status_code == 200
    assert run.json()["status"] == "done"

    deleted = client.delete(f"/api/v1/workflows/{workflow['id']}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/workflows/{workflow['id']}").status_code == 404


def test_workflow_input_validation(client: TestClient):
    response = client.post(
        "/api/v1/workflows/workflow-content-engine/runs", json={"input": ""}
    )
    assert response.status_code == 422


def test_task_center_unifies_agent_jobs_and_workflow_runs(client: TestClient):
    job = create_job(client)
    executed_job = client.post(f"/api/v1/jobs/{job['id']}/run")
    assert executed_job.status_code == 200

    workflow_run = client.post(
        "/api/v1/workflows/workflow-content-engine/runs",
        json={"input": "把超级 AI 员工项目整理成求职作品集介绍"},
    )
    assert workflow_run.status_code == 200

    response = client.get("/api/v1/tasks")
    assert response.status_code == 200
    tasks = response.json()
    assert {task["source_type"] for task in tasks} == {
        "agent_job",
        "workflow_run",
    }
    agent_task = next(task for task in tasks if task["id"] == job["id"])
    workflow_task = next(
        task for task in tasks if task["id"] == workflow_run.json()["id"]
    )
    assert agent_task["status"] == "review"
    assert len(agent_task["asset_ids"]) == 1
    assert workflow_task["status"] == "done"
    assert len(workflow_task["asset_ids"]) == 1


def test_assets_support_search_metadata_and_archive(client: TestClient):
    job = create_job(client)
    client.post(f"/api/v1/jobs/{job['id']}/run")

    assets = client.get("/api/v1/assets", params={"query": "首周内容计划"})
    assert assets.status_code == 200
    assert len(assets.json()) == 1
    asset = assets.json()[0]
    assert asset["source_type"] == "agent_job"

    updated = client.patch(
        f"/api/v1/assets/{asset['id']}",
        json={
            "title": "超级员工首周发布资产",
            "tags": ["作品集", "内容运营", "作品集"],
            "status": "archived",
        },
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "超级员工首周发布资产"
    assert updated.json()["tags"] == ["作品集", "内容运营"]
    assert updated.json()["status"] == "archived"

    archived = client.get(
        "/api/v1/assets", params={"asset_status": "archived"}
    )
    assert [item["id"] for item in archived.json()] == [asset["id"]]

    blocked_handoff = client.post(
        f"/api/v1/assets/{asset['id']}/handoffs",
        json={"target": "publisher"},
    )
    assert blocked_handoff.status_code == 409


def test_asset_handoff_creates_trackable_queue_record(client: TestClient):
    run = client.post(
        "/api/v1/workflows/workflow-multi-platform/runs",
        json={"input": "介绍超级 AI 员工的业务闭环"},
    )
    assert run.status_code == 200
    asset = client.get(
        "/api/v1/assets", params={"source_type": "workflow_run"}
    ).json()[0]

    created = client.post(
        f"/api/v1/assets/{asset['id']}/handoffs",
        json={"target": "creative_video", "note": "生成竖版介绍视频"},
    )
    assert created.status_code == 201
    assert created.json()["status"] == "queued"
    assert created.json()["asset_id"] == asset["id"]

    stored = client.get(
        "/api/v1/asset-handoffs", params={"asset_id": asset["id"]}
    )
    assert stored.status_code == 200
    assert stored.json()[0]["target"] == "creative_video"

    invalid = client.post(
        f"/api/v1/assets/{asset['id']}/handoffs",
        json={"target": "unknown"},
    )
    assert invalid.status_code == 422
