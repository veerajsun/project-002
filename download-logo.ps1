# Downloads the Sabaland logo image used in the footer of sabaland.in
# Saves it as public\images\logo.jpg. If it is missing, the site shows a text wordmark instead.
$dest = Join-Path $PSScriptRoot "public\images"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$url = "https://sabaland.in/cdn/shop/files/WhatsApp_Image_2026-03-14_at_9.43.27_AM.jpg?v=1774084459"
$out = Join-Path $dest "logo.jpg"
try {
  Invoke-WebRequest -Uri $url -OutFile $out -UserAgent "Mozilla/5.0" -UseBasicParsing -ErrorAction Stop
  Write-Host ("OK    logo.jpg  ({0} KB)" -f [math]::Round((Get-Item $out).Length / 1KB))
} catch {
  Write-Host ("FAIL  logo.jpg  - {0}" -f $_.Exception.Message) -ForegroundColor Red
}
