param(
  [string]$Repo = "indrautomoputra/Streakly",
  [string]$Version = "latest",
  [string]$Asset = "Streakly-Setup-1.0.0.exe",
  [switch]$Silent
)

$base = "https://github.com/$Repo/releases"
if ($Version -eq "latest") {
  $url = "$base/latest/download/$Asset"
} else {
  $url = "$base/download/$Version/$Asset"
}

$out = Join-Path $env:TEMP $Asset
Invoke-WebRequest -Uri $url -OutFile $out
if ($Silent) {
  Start-Process -FilePath $out -ArgumentList "/S" -Wait
} else {
  Start-Process -FilePath $out
}
