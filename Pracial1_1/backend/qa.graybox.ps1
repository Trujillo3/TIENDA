$ErrorActionPreference = 'Stop'

function Parse-CurlResponse {
  param([string]$RawResponse)

  $lines = $RawResponse -split "`n"
  $statusCode = [int]$lines[-1].Trim()
  $bodyText = ($lines[0..($lines.Length - 2)] -join "`n").Trim()

  $body = $null
  if ($bodyText) {
    $body = $bodyText | ConvertFrom-Json
  }

  return [PSCustomObject]@{
    Status = $statusCode
    Body = $body
    RawBody = $bodyText
  }
}

$backendPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbPath = Join-Path $backendPath 'database.sqlite'
$baseUrl = 'http://localhost:5000/api'
$serverProcess = $null

try {
  $serverProcess = Start-Process -FilePath node -ArgumentList 'server.js' -WorkingDirectory $backendPath -PassThru
  Start-Sleep -Seconds 2

  $loginPayload = '{"username":"admin","password":"admin123"}'
  $loginRaw = curl.exe -s -w "`n%{http_code}" -X POST "$baseUrl/auth/login" -H "Content-Type: application/json" -d $loginPayload
  $loginRes = Parse-CurlResponse -RawResponse $loginRaw
  if ($loginRes.Status -ne 200 -or -not $loginRes.Body.token) {
    throw "No fue posible autenticarse. Status: $($loginRes.Status). Body: $($loginRes.RawBody)"
  }

  $token = $loginRes.Body.token
  $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $productName = "QA-GrayBox-$timestamp"

  $createPayload = @{
    name = $productName
    description = 'Producto creado desde prueba de caja gris'
    price = 33.33
    stock = 4
    image_url = 'https://example.com/qa-graybox.jpg'
  } | ConvertTo-Json -Compress

  $createRaw = curl.exe -s -w "`n%{http_code}" -X POST "$baseUrl/products" `
    -H "Content-Type: application/json" `
    -H "Authorization: Bearer $token" `
    -d $createPayload
  $createRes = Parse-CurlResponse -RawResponse $createRaw
  if ($createRes.Status -ne 201 -or -not $createRes.Body.id) {
    throw "La creación externa falló. Status: $($createRes.Status). Body: $($createRes.RawBody)"
  }

  $productId = [int]$createRes.Body.id
  $dbQueryRaw = node -e "const sqlite3=require('sqlite3').verbose();const db=new sqlite3.Database(process.argv[1]);const id=Number(process.argv[2]);db.get('SELECT id,name,stock FROM products WHERE id = ?',[id],(err,row)=>{if(err){console.error(err.message);process.exit(1);}console.log(JSON.stringify(row||null));db.close();});" "$dbPath" "$productId"
  $dbRow = $dbQueryRaw | ConvertFrom-Json

  if (-not $dbRow) {
    throw "No se encontró en SQLite el producto creado por la petición externa (id=$productId)."
  }
  if ($dbRow.name -ne $productName -or [int]$dbRow.stock -ne 4) {
    throw "Estado interno inconsistente en SQLite. Registro: $($dbQueryRaw)"
  }

  Write-Host "Prueba de caja gris completada: petición externa exitosa y estado interno validado en SQLite."
  Write-Host "Registro interno verificado: id=$($dbRow.id), name=$($dbRow.name), stock=$($dbRow.stock)"
}
finally {
  if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force
  }
}
