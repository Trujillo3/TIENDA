$Root = "C:\Users\user\Documents\Pruebas Unitarias\si"
$BackendPath = "$Root\Pracial1_1\backend"
$FrontendPath = "$Root\Pracial1_1\frontend"
$ViteCmd = "$FrontendPath\node_modules\.bin\vite.cmd"

Write-Host "Iniciando servidor backend..." -ForegroundColor Green
$backendJob = Start-Job -ScriptBlock { param($p) Set-Location $p; cmd /c node server.js } -ArgumentList $BackendPath

Write-Host "Esperando backend (puerto 5000)..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try { $r = Invoke-WebRequest -Uri "http://localhost:5000/api/products" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; if ($r.StatusCode -eq 200) { $ready = $true; break } } catch { Start-Sleep -Seconds 1 }
}
if (-not $ready) { Write-Host "Error: Backend no respondió" -ForegroundColor Red; exit 1 }
Write-Host "Backend listo!" -ForegroundColor Green

Write-Host "Iniciando servidor frontend..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock { param($p, $v) Set-Location $p; cmd /c "$v" --port 5173 } -ArgumentList $FrontendPath, $ViteCmd

Write-Host "Esperando frontend (puerto 5173)..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try { $r = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; if ($r.StatusCode -eq 200) { $ready = $true; break } } catch { Start-Sleep -Seconds 1 }
}
if (-not $ready) { Write-Host "Error: Frontend no respondió" -ForegroundColor Red; Stop-Job $backendJob -ErrorAction SilentlyContinue; Remove-Job $backendJob -ErrorAction SilentlyContinue; exit 1 }
Write-Host "Frontend listo!" -ForegroundColor Green

Write-Host "Ejecutando prueba Selenium..." -ForegroundColor Green
Push-Location $Root
try {
    cmd /c npx mocha Pracial1_1/backend/selenium-automation.js --timeout 60000
} finally {
    Pop-Location
}

Write-Host "Limpiando procesos..." -ForegroundColor Yellow
Stop-Job $backendJob -ErrorAction SilentlyContinue; Remove-Job $backendJob -ErrorAction SilentlyContinue
Stop-Job $frontendJob -ErrorAction SilentlyContinue; Remove-Job $frontendJob -ErrorAction SilentlyContinue
Write-Host "Proceso completado." -ForegroundColor Green
