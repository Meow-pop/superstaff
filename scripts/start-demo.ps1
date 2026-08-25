$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "未检测到 Docker。请先安装 Docker Desktop，再重新运行此脚本。"
}

Push-Location $projectRoot
try {
    docker compose up --build --detach
    if ($LASTEXITCODE -ne 0) {
        throw "Docker 启动失败，请检查 Docker Desktop 是否正在运行。"
    }

    $ready = $false
    for ($attempt = 0; $attempt -lt 40; $attempt += 1) {
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:8080" -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -eq 200) {
                $ready = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 1
        }
    }
    if (-not $ready) {
        throw "服务已经启动，但网页在 40 秒内没有就绪。请运行 docker compose logs 查看原因。"
    }
    Start-Process "http://127.0.0.1:8080"
    Write-Host "超级 AI 员工已经启动：http://127.0.0.1:8080"
} finally {
    Pop-Location
}
