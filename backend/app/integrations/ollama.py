from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


@dataclass(frozen=True, slots=True)
class OllamaSettings:
    base_url: str = "http://127.0.0.1:11434"
    model: str = "qwen3:4b"
    timeout_seconds: float = 180.0


class OllamaClient:
    """Small synchronous client for an Ollama instance owned by the customer."""

    def __init__(self, settings: OllamaSettings):
        self.settings = settings

    def chat(
        self,
        system: str,
        user: str,
        response_format: dict[str, Any] | str | None = None,
    ) -> str:
        payload: dict[str, Any] = {
            "model": self.settings.model,
            "stream": False,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "options": {"temperature": 0.45, "top_p": 0.9},
        }
        if response_format is not None:
            payload["format"] = response_format
        response = httpx.post(
            f"{self.settings.base_url.rstrip('/')}/api/chat",
            json=payload,
            timeout=self.settings.timeout_seconds,
        )
        response.raise_for_status()
        content = response.json().get("message", {}).get("content", "").strip()
        if not content:
            raise RuntimeError("本地模型返回了空内容")
        return content

    def status(self) -> dict[str, Any]:
        try:
            response = httpx.get(
                f"{self.settings.base_url.rstrip('/')}/api/tags",
                timeout=3.0,
            )
            response.raise_for_status()
            models = [
                item.get("name", "")
                for item in response.json().get("models", [])
                if item.get("name")
            ]
            expected = self.settings.model.removesuffix(":latest")
            model_ready = any(name.removesuffix(":latest") == expected for name in models)
            return {
                "reachable": True,
                "model_ready": model_ready,
                "configured_model": self.settings.model,
                "installed_models": models,
                "base_url": self.settings.base_url,
                "detail": "本地模型可用" if model_ready else "Ollama 可访问，但目标模型尚未下载",
            }
        except Exception as exc:
            return {
                "reachable": False,
                "model_ready": False,
                "configured_model": self.settings.model,
                "installed_models": [],
                "base_url": self.settings.base_url,
                "detail": f"无法连接本地 Ollama：{exc.__class__.__name__}",
            }
