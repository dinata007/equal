<#
  Update otomatis Equal dari GitHub: dijalankan Scheduled Task Equal-update tiap 5 menit (sebagai SYSTEM).
  Aktifkan sekali (PowerShell Administrator, di folder aplikasi):
      powershell -ExecutionPolicy Bypass -File .\pasang.ps1 -Otomatis

  Tiap jalan:
    1. ambil run GitHub Actions "Deploy" (.github/workflows/deploy.yml) terakhir yang sukses di main
    2. commit-nya sama dengan VERSION di folder ini, atau commit yang terakhir gagal -> selesai
    3. unduh paket (artifact equal-deploy) -> pasang.ps1 -Update -Zip <paket>
       (pasang.ps1 mengembalikan versi sebelumnya bila versi baru tidak jalan; commit itu tidak dicoba lagi)
  Log: logs\otomatis.log.  Coba lagi commit yang gagal: powershell -ExecutionPolicy Bypass -File .\otomatis.ps1 -Paksa
#>
param(
	[string]$Repo = 'dinata007/equal',
	# pasang juga commit yang sebelumnya gagal
	[switch]$Paksa
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Folder = $PSScriptRoot
$data = Join-Path $env:ProgramData 'Equal'
$log = Join-Path $Folder 'logs\otomatis.log'
New-Item -ItemType Directory -Force -Path (Split-Path $log) | Out-Null
function Catat($t) { Add-Content -LiteralPath $log -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $t" }

# satu update dalam satu waktu (juga bila dijalankan manual saat task sedang jalan)
$kunci = New-Object Threading.Mutex($false, 'Global\Equal-otomatis')
if (-not $kunci.WaitOne(0)) { exit 0 }
try {
	Add-Type -AssemblyName System.Security
	$token = [Text.Encoding]::UTF8.GetString([Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes((Join-Path $data 'github-token.bin')), $null, 'LocalMachine'))
	$h = @{ Authorization = "Bearer $token"; 'User-Agent' = 'equal-otomatis'; Accept = 'application/vnd.github+json'; 'X-GitHub-Api-Version' = '2022-11-28' }

	$run = (Invoke-RestMethod "https://api.github.com/repos/$Repo/actions/workflows/deploy.yml/runs?branch=main&event=push&status=success&per_page=1" -Headers $h).workflow_runs | Select-Object -First 1
	if (-not $run) { exit 0 }
	$sha = $run.head_sha
	$versi = Join-Path $Folder 'VERSION'
	if ((Test-Path $versi) -and "$(Get-Content $versi -TotalCount 1)".Trim() -eq $sha) { exit 0 }
	$gagal = Join-Path $data 'gagal.txt'
	if (-not $Paksa -and (Test-Path $gagal) -and "$(Get-Content $gagal -TotalCount 1)".Trim() -eq $sha) { exit 0 }

	$pendek = $sha.Substring(0, 7)
	Catat "Versi baru ${pendek}: $(($run.display_title -split "`n")[0])"
	$art = (Invoke-RestMethod $run.artifacts_url -Headers $h).artifacts | Where-Object { $_.name -eq 'equal-deploy' -and -not $_.expired } | Select-Object -First 1
	if (-not $art) { throw "artifact equal-deploy tidak ada di $($run.html_url)" }
	# GitHub mengalihkan unduhan ke penyimpanan file; header Authorization tidak boleh ikut ke sana
	$req = [Net.HttpWebRequest]::Create($art.archive_download_url)
	$req.AllowAutoRedirect = $false
	$req.UserAgent = 'equal-otomatis'
	$req.Headers['Authorization'] = "Bearer $token"
	$res = $req.GetResponse()
	$lokasi = $res.Headers['Location']
	$res.Close()
	if (-not $lokasi) { throw "unduh artifact gagal (status $([int]$res.StatusCode))" }
	$unduh = Join-Path $data 'unduh'
	if (Test-Path $unduh) { Remove-Item -LiteralPath $unduh -Recurse -Force }
	New-Item -ItemType Directory -Path $unduh | Out-Null
	Invoke-WebRequest $lokasi -OutFile (Join-Path $unduh 'artifact.zip') -UseBasicParsing
	# artifact = zip berisi equal-deploy-*.zip; tar bawaan Windows lewat cmd agar stderr tidak dianggap error oleh PowerShell 5.1
	$tar = Join-Path $env:SystemRoot 'System32\tar.exe'
	cmd /s /c "`"$tar`" -xf `"$unduh\artifact.zip`" -C `"$unduh`" 2>nul"
	$zip = Get-ChildItem -LiteralPath $unduh -Filter 'equal-deploy-*.zip' | Select-Object -First 1 -ExpandProperty FullName
	if (-not $zip) { throw 'equal-deploy-*.zip tidak ada di artifact' }

	Catat "Pasang $(Split-Path $zip -Leaf)"
	cmd /s /c "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$Folder\pasang.ps1`" -Update -Zip `"$zip`" >> `"$log`" 2>&1"
	if ($LASTEXITCODE -eq 0) {
		Catat "SELESAI: versi $pendek jalan"
		Remove-Item -LiteralPath $gagal -Force -ErrorAction SilentlyContinue
	} else {
		Set-Content -LiteralPath $gagal -Value $sha
		Catat "GAGAL (kode $LASTEXITCODE): versi $pendek tidak dipasang, tidak dicoba lagi sampai ada commit baru (atau -Paksa)"
	}
	Remove-Item -LiteralPath $unduh -Recurse -Force -ErrorAction SilentlyContinue
} catch {
	Catat "Error: $($_.Exception.Message)"
	exit 1
} finally {
	$kunci.ReleaseMutex()
}
