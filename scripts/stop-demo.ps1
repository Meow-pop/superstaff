$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $projectRoot
try {
    docker compose down
    Write-Host "超级 AI 员工已经停止。SQLite 数据卷仍然保留。"
} finally {
    Pop-Location
}
