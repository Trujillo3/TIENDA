$ErrorActionPreference = 'Stop'
function Parse-CurlResponse {
  param([string]$RawResponse)
  $trimmed = $RawResponse.Trim()
  if ($trimmed -notmatch '(?s)^(?<body>.*?)(?<status>\d{3})$') {
    throw "No se pudo extraer el status HTTP desde la salida de curl: $trimmed"
  }

  $statusCode = [int]$matches.status
  $bodyText = $matches.body.Trim()

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
$baseUrl = 'http://localhost:5000/api'
$serverProcess = $null

try {
  $serverProcess = Start-Process -FilePath node -ArgumentList 'server.js' -WorkingDirectory $backendPath -PassThru
  Start-Sleep -Seconds 2

  $productsRaw = curl.exe -s -w " %{http_code}" -X GET "$baseUrl/products"
  $productsRes = Parse-CurlResponse -RawResponse $productsRaw
  if ($productsRes.Status -ne 200) {
    throw "GET /products devolvió estado $($productsRes.Status). Body: $($productsRes.RawBody)"
  }
  if ($productsRes.Body -isnot [System.Array]) {
    throw "GET /products no devolvió una lista JSON."
  }

  $loginPayload = '{"username":"admin","password":"admin123"}'
  $loginRaw = curl.exe -s -w " %{http_code}" -X POST "$baseUrl/auth/login" -H "Content-Type: application/json" -d $loginPayload
  $loginRes = Parse-CurlResponse -RawResponse $loginRaw
  if ($loginRes.Status -ne 200 -or -not $loginRes.Body.token) {
    throw "POST /auth/login falló. Status: $($loginRes.Status). Body: $($loginRes.RawBody)"
  }

  $token = $loginRes.Body.token
  $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $productName = "QA-BlackBox-$timestamp"
  $createPayload = @{
    name = $productName
    description = 'Producto creado en prueba de caja negra'
    price = 15.75
    stock = 7
    image_url = 'https://example.com/qa-blackbox.jpg'
  } | ConvertTo-Json -Compress

  $createRaw = curl.exe -s -w " %{http_code}" -X POST "$baseUrl/products" `
    -H "Content-Type: application/json" `
    -H "Authorization: Bearer $token" `
    -d $createPayload
  $createRes = Parse-CurlResponse -RawResponse $createRaw
  if ($createRes.Status -ne 201 -or -not $createRes.Body.id) {
    throw "POST /products falló. Status: $($createRes.Status). Body: $($createRes.RawBody)"
  }

  $productId = $createRes.Body.id
  $getOneRaw = curl.exe -s -w " %{http_code}" -X GET "$baseUrl/products/$productId"
  $getOneRes = Parse-CurlResponse -RawResponse $getOneRaw
  if ($getOneRes.Status -ne 200) {
    throw "GET /products/$productId falló. Status: $($getOneRes.Status). Body: $($getOneRes.RawBody)"
  }
  if ($getOneRes.Body.name -ne $productName) {
    throw "GET /products/$productId devolvió un nombre inesperado: $($getOneRes.Body.name)"
  }

  Write-Host "Prueba de caja negra completada: login y CRUD básico vía API funcionan por entradas/salidas."
  Write-Host "Producto validado externamente: id=$productId, name=$productName"
}
finally {
  if ($serverProcess -and -not $serverProcess.HasExited) {
    Stop-Process -Id $serverProcess.Id -Force
  }
}
