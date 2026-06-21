$Host.UI.RawUI.WindowTitle = "CloudCLI"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CloudCLI - Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Starting dev server..." -ForegroundColor Gray
$npmProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c","npm run dev" -PassThru -NoNewWindow

Write-Host "[2/2] Waiting for Vite on port 5173 ..." -ForegroundColor Gray
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", 5173)
        $tcp.Close()
        Write-Host "Server ready! Opening browser..." -ForegroundColor Green
        Start-Process "http://localhost:5173"
        $ready = $true
        break
    } catch {
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "Timeout after 60s. Opening browser anyway..." -ForegroundColor Yellow
    Start-Process "http://localhost:5173"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CloudCLI is running" -ForegroundColor Cyan
Write-Host "  URL: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop all services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Wait-Process -Id $npmProc.Id
