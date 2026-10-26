$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
$taskNode = if ($nodeCommand) { $nodeCommand.Source } else { $null }
if (-not $taskNode) { throw '未找到 Node.js。此预览不自动安装软件；请先安装 Node.js 后再运行。' }
$taskPort = if ($env:MOON_PREVIEW_PORT) { [int]$env:MOON_PREVIEW_PORT } else { 9478 }
Write-Host "独立设计预览（测试版）：http://127.0.0.1:$taskPort" -ForegroundColor Cyan
Write-Host '只监听本机；不会连接或修改 Codex。关闭此窗口即可停止预览。'
& $taskNode (Join-Path $taskRoot 'server.mjs') --open
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
