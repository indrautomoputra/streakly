param(
  [string]$Repo = "indrautomoputra/Streakly",
  [string]$Tag = "v1.0.0",
  [string]$AssetPath = ""
)

if (-not $AssetPath) {
  $exe = Get-ChildItem -Path dist -Filter *.exe | Select-Object -First 1
  if (-not $exe) { throw "Installer .exe not found in dist" }
  $AssetPath = $exe.FullName
}

$hash = (Get-FileHash $AssetPath -Algorithm SHA256).Hash.ToLower()
$checksumPath = "$AssetPath.sha256"
"$hash  $(Split-Path $AssetPath -Leaf)" | Out-File -FilePath $checksumPath -Encoding ascii

gh release create $Tag $AssetPath $checksumPath --repo $Repo --title $Tag --notes "Release $Tag"
