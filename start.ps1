# WeatherEscape - quick start for Windows
# Run from anywhere:  powershell -ExecutionPolicy Bypass -File path\to\start.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host 'WeatherEscape - setup and run' -ForegroundColor Cyan

if (-not (Test-Path "$root\node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Error "npm install failed. Is Node.js 18+ installed?"
        exit 1
    }
}

Write-Host "Starting dev server at http://localhost:5173" -ForegroundColor Green
npm run dev
