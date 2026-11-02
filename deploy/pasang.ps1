<#
  Pasang / perbarui Senja di server Windows (aplikasi Node.js + Caddy untuk HTTPS).

  Aplikasi dijalankan dari folder tempat script ini berada (folder hasil ekstrak zip; boleh di drive mana saja).
  Jalankan di PowerShell "Run as Administrator", dari folder itu:
      powershell -ExecutionPolicy Bypass -File .\pasang.ps1

  Aman dijalankan ulang. Untuk update, klik dua kali update.bat (atau seret zip baru ke update.bat), atau:
      powershell -ExecutionPolicy Bypass -File .\pasang.ps1 -Update [-Zip <path zip>]
        = hentikan -> simpan versi sekarang ke <folder>-sebelumnya -> ekstrak zip baru ke folder ini -> jalankan pasang.ps1 versi baru.
        Bila versi baru gagal jalan, versi sebelumnya dikembalikan & dijalankan lagi.
        Tanpa -Zip: dipakai senja-deploy-*.zip terbaru di folder ini, folder di atasnya, Downloads, atau Desktop.
  Hentikan saja (berhenti.bat): powershell -ExecutionPolicy Bypass -File .\pasang.ps1 -Berhenti
  Update otomatis tiap merge ke main (token GitHub ditanyakan): powershell -ExecutionPolicy Bypass -File .\pasang.ps1 -Otomatis
        matikan lagi: .\pasang.ps1 -OtomatisMati      (lihat otomatis.ps1)

  Yang dilakukan:
    1. hentikan versi yang sedang jalan (bila ada)
    2. cek Node.js >= 22 dan port 80/443/3001 belum dipakai aplikasi lain
    3. atur .env & Caddyfile untuk server
    4. jalankan migrasi database (tabel App*, aman diulang)
    5. buka firewall Windows untuk port 80 & 443
    6. daftarkan 2 Scheduled Task (jalan saat server menyala, walau tidak ada yang login):
         Senja-app   = node build  (hanya di 127.0.0.1:3001)
         Senja-https = caddy       (https://<Domain> -> 127.0.0.1:3001, sertifikat Let's Encrypt otomatis)
    7. cek aplikasi & HTTPS sudah menjawab
#>
param(
	[string]$Domain = 'senja.co.id',
	# port internal aplikasi; 3000 di server senja.co.id sudah dipakai aplikasi lain
	[int]$Port = 3001,
	[switch]$TanpaMigrasi,
	# hanya hentikan aplikasi & Caddy
	[switch]$Berhenti,
	# hentikan, ekstrak zip versi baru ke folder ini, lalu jalankan pasang.ps1 versi baru
	[switch]$Update,
	# zip untuk -Update (kosong = cari senja-deploy-*.zip terbaru)
	[string]$Zip,
	# simpan token GitHub & daftarkan Scheduled Task Senja-update (otomatis.ps1 tiap 5 menit)
	[switch]$Otomatis,
	# hapus Senja-update & token
	[switch]$OtomatisMati,
	[string]$Repo = 'dinata007/senja'
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Folder = $PSScriptRoot

function Langkah($t) { Write-Host ''; Write-Host "== $t" -ForegroundColor Cyan }
function Gagal($t) { Write-Host ''; Write-Host "GAGAL: $t" -ForegroundColor Red; exit 1 }

# ---------- 0. Administrator ----------
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { Gagal 'Buka PowerShell dengan "Run as Administrator", lalu jalankan script ini lagi.' }

# ---------- update otomatis dari GitHub (otomatis.ps1) ----------
$tokenFile = Join-Path $env:ProgramData 'Senja\github-token.bin'
if ($OtomatisMati) {
	if (Get-ScheduledTask -TaskName 'Senja-update' -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName 'Senja-update' -Confirm:$false }
	Remove-Item -LiteralPath $tokenFile -Force -ErrorAction SilentlyContinue
	Write-Host ''
	Write-Host 'Update otomatis dimatikan (task Senja-update & token dihapus).' -ForegroundColor Green
	exit 0
}
if ($Otomatis) {
	Langkah "Update otomatis dari GitHub ($Repo, branch main)"
	if (-not (Test-Path (Join-Path $Folder 'otomatis.ps1'))) { Gagal "otomatis.ps1 tidak ada di $Folder. Update dulu ke paket terbaru (update.bat), lalu jalankan -Otomatis lagi." }
	$aman = Read-Host -AsSecureString 'Tempel token GitHub (tidak tampil di layar), lalu Enter'
	$token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($aman)).Trim()
	if (-not $token) { Gagal 'Token kosong.' }
	try { $null = Invoke-RestMethod "https://api.github.com/repos/$Repo" -Headers @{ Authorization = "Bearer $token"; 'User-Agent' = 'senja-otomatis' } }
	catch { Gagal "Token tidak bisa membuka repo $Repo ($($_.Exception.Message)). Token classic perlu scope 'repo'." }
	# disimpan terenkripsi (DPAPI mesin ini), file hanya bisa dibuka SYSTEM & Administrators
	New-Item -ItemType Directory -Force -Path (Split-Path $tokenFile) | Out-Null
	Add-Type -AssemblyName System.Security
	[IO.File]::WriteAllBytes($tokenFile, [Security.Cryptography.ProtectedData]::Protect([Text.Encoding]::UTF8.GetBytes($token), $null, 'LocalMachine'))
	icacls $tokenFile /inheritance:r /grant:r '*S-1-5-18:F' '*S-1-5-32-544:F' | Out-Null
	Write-Host "Token disimpan: $tokenFile"
	# update bisa makan beberapa menit; jalan berikutnya dilewati selama update masih berjalan
	$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 1) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
	$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
	$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
	$arg = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $Folder 'otomatis.ps1')`" -Repo $Repo"
	Register-ScheduledTask -TaskName 'Senja-update' -Force -Settings $settings -Principal $principal -Trigger $trigger -Action (New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arg -WorkingDirectory $Folder) -Description "Senja: update otomatis dari GitHub ($Repo, branch main)" | Out-Null
	Write-Host ''
	Write-Host "AKTIF: tiap 5 menit server mengecek paket baru dari main. Log: $Folder\logs\otomatis.log" -ForegroundColor Green
	exit 0
}

# ---------- 1. hentikan versi yang sedang jalan ----------
# nama lama (sebelum aplikasi bernama "Senja") ikut dihentikan lalu dihapus saat pemasangan
$lama = 'ruangSenja-app', 'ruangSenja-https'
$caddyPath = Join-Path $Folder 'caddy.exe'
# $Biarkan: port aplikasi dipakai program lain tidak dianggap gagal
function Hentikan([switch]$Biarkan) {
	foreach ($t in @('Senja-app', 'Senja-https') + $lama) {
		if (Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue) { Stop-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue }
	}
	Start-Sleep -Seconds 2
	# proses anak task bisa tetap hidup: caddy dikenali dari perintah jalannya (juga dari folder lain), node dari port aplikasi
	Get-CimInstance Win32_Process -Filter "Name = 'caddy.exe'" | Where-Object { $_.ExecutablePath -eq $caddyPath -or $_.CommandLine -like '*run --config Caddyfile --adapter caddyfile*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
	foreach ($c in @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)) {
		$p = Get-CimInstance Win32_Process -Filter "ProcessId = $($c.OwningProcess)"
		if ($p.Name -eq 'node.exe' -and $p.CommandLine -like '*--env-file=.env build*') { Stop-Process -Id $p.ProcessId -Force }
		elseif (-not $Biarkan) { Gagal "Port $Port sudah dipakai program lain ($($p.Name), PID $($p.ProcessId)):`n  $($p.CommandLine)`nBila itu aplikasi lain, jalankan lagi dengan -Port <port lain>, mis. -Port 3002. Bila itu Senja yang dijalankan manual (npm start), tutup dulu jendelanya." }
	}
	Start-Sleep -Seconds 1
}
Langkah 'Hentikan versi yang sedang jalan (bila ada)'
Hentikan -Biarkan:($Berhenti -or $Update)
if ($Berhenti -and -not $Update) {
	Write-Host ''
	Write-Host 'Aplikasi & Caddy sudah berhenti. Untuk update: klik dua kali update.bat (atau seret zip baru ke update.bat).' -ForegroundColor Green
	exit 0
}
Write-Host 'OK'

# ---------- update: ekstrak zip baru, lalu serahkan ke pasang.ps1 versi baru ----------
if ($Update) {
	Langkah 'Ekstrak versi baru'
	if (-not $Zip) {
		$cari = @($Folder, (Split-Path $Folder -Parent), (Join-Path $env:USERPROFILE 'Downloads'), (Join-Path $env:USERPROFILE 'Desktop')) | Where-Object { $_ -and (Test-Path $_) }
		$Zip = Get-ChildItem -Path $cari -Filter 'senja-deploy-*.zip' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
		if (-not $Zip) { Gagal "File senja-deploy-*.zip tidak ditemukan di $Folder, folder di atasnya, Downloads, atau Desktop. Taruh zip di salah satunya, atau seret zip ke update.bat." }
	}
	if (-not (Test-Path -LiteralPath $Zip -PathType Leaf)) { Gagal "File zip tidak ditemukan: $Zip" }
	$Zip = (Resolve-Path -LiteralPath $Zip).Path
	Write-Host "Zip: $Zip  (dibuat $((Get-Item -LiteralPath $Zip).LastWriteTime.ToString('dd-MM-yyyy HH:mm')))"
	# tar bawaan Windows bisa membaca zip; lewat cmd agar pesan stderr tidak dianggap error oleh PowerShell 5.1
	$tar = Join-Path $env:SystemRoot 'System32\tar.exe'
	$isi = cmd /s /c "`"$tar`" -tf `"$Zip`" 2>nul"
	if ($isi -notcontains 'pasang.ps1') { Gagal "$Zip bukan paket Senja (tidak berisi pasang.ps1)." }

	# versi sekarang dipindah ke <folder>-sebelumnya (sekaligus membuang file build lama), dikembalikan bila versi baru gagal.
	# .env, logs, Caddyfile & caddy-data (sertifikat) tetap di folder ini.
	$cadangan = "$Folder-sebelumnya"
	$isiPaket = 'build', 'node_modules', 'db', 'scripts', 'src', 'package.json', 'package-lock.json', '.npmrc', 'VERSION', 'caddy.exe', 'pasang.ps1', 'otomatis.ps1', 'update.bat', 'berhenti.bat', 'BACA-DULU.txt'
	function Pulihkan([switch]$HapusBaru) {
		foreach ($n in $isiPaket) {
			$p = Join-Path $Folder $n
			$c = Join-Path $cadangan $n
			if ($HapusBaru -and (Test-Path -LiteralPath $p)) { Remove-Item -LiteralPath $p -Recurse -Force }
			if (Test-Path -LiteralPath $c) { Move-Item -LiteralPath $c -Destination $Folder }
		}
		$e = Join-Path $cadangan '.env'
		if (Test-Path -LiteralPath $e) { Copy-Item -LiteralPath $e -Destination $Folder -Force }
	}
	# versi baru tidak jalan: kembalikan versi sebelumnya lalu jalankan lagi (tanpa migrasi)
	function Batal($t) {
		Langkah 'Kembali ke versi sebelumnya'
		Hentikan -Biarkan
		Pulihkan -HapusBaru
		& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Folder 'pasang.ps1') -Domain $Domain -Port $Port -TanpaMigrasi
		Gagal "$t`nVersi sebelumnya dipasang lagi."
	}
	if (Test-Path -LiteralPath $cadangan) { Remove-Item -LiteralPath $cadangan -Recurse -Force }
	New-Item -ItemType Directory -Path $cadangan | Out-Null
	try {
		foreach ($n in $isiPaket) {
			$p = Join-Path $Folder $n
			if (Test-Path -LiteralPath $p) { Move-Item -LiteralPath $p -Destination $cadangan }
		}
		if (Test-Path -LiteralPath (Join-Path $Folder '.env')) { Copy-Item -LiteralPath (Join-Path $Folder '.env') -Destination $cadangan }
	} catch {
		Pulihkan
		Gagal "Versi sekarang tidak bisa dipindah ke ${cadangan}: $($_.Exception.Message)`nFile mungkin masih dipakai program lain; tutup lalu jalankan update lagi."
	}
	Write-Host "Versi sekarang disimpan di $cadangan"

	$out = cmd /s /c "`"$tar`" -xf `"$Zip`" -C `"$Folder`" 2>&1"
	if ($LASTEXITCODE -ne 0) { Batal "Ekstrak gagal (kode $LASTEXITCODE): $out" }
	Write-Host 'OK'
	# script yang sedang berjalan masih versi lama (sudah dimuat ke memori) -> lanjutkan dengan versi baru
	$lanjut = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $Folder 'pasang.ps1'), '-Domain', $Domain, '-Port', $Port)
	if ($TanpaMigrasi) { $lanjut += '-TanpaMigrasi' }
	& powershell.exe @lanjut
	if ($LASTEXITCODE -ne 0) { Batal "Versi baru gagal dipasang (kode $LASTEXITCODE, lihat pesan di atas)." }
	exit 0
}

# ---------- 2. Node.js & port ----------
Langkah 'Cek Node.js & port'
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCmd) { Gagal 'Node.js belum terpasang. Pasang Node.js 22 LTS (atau lebih baru) dari https://nodejs.org, tutup & buka lagi PowerShell, lalu jalankan script ini lagi.' }
$node = $nodeCmd.Source
$nodeVer = (& $node -v).Trim()
if ([int]($nodeVer.TrimStart('v').Split('.')[0]) -lt 22) { Gagal "Node.js $nodeVer terlalu lama; butuh versi 22 atau lebih baru." }
Write-Host "Node.js $nodeVer ($node)"
foreach ($pp in 80, 443) {
	foreach ($c in @(Get-NetTCPConnection -LocalPort $pp -State Listen -ErrorAction SilentlyContinue)) {
		$p = Get-CimInstance Win32_Process -Filter "ProcessId = $($c.OwningProcess)"
		$nama = if ($c.OwningProcess -eq 4) { 'System (biasanya IIS / http.sys)' } else { "$($p.Name), PID $($p.ProcessId)" }
		Gagal "Port $pp sudah dipakai: $nama. HTTPS lewat Caddy butuh port 80 & 443 kosong. Hentikan program itu (atau pakai IIS sebagai gantinya), lalu jalankan lagi."
	}
}
Write-Host "Port $Port, 80, 443 siap"

# ---------- 3. .env & Caddyfile ----------
Langkah "Atur aplikasi di $Folder"
New-Item -ItemType Directory -Force -Path (Join-Path $Folder 'logs') | Out-Null
# file dari zip hasil unduhan/salinan bisa ditandai "dari internet" oleh Windows
Get-ChildItem -Recurse -File $Folder | Unblock-File

# .env: pengaturan server (aplikasi di belakang Caddy). Paket dari GitHub tidak berisi .env -> memakai .env yang sudah ada di server.
$envFile = Join-Path $Folder '.env'
if (-not (Test-Path -LiteralPath $envFile)) { Gagal ".env tidak ada di $Folder. Buat file .env berisi koneksi database (DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD), atau pasang dari paket buatan npm run deploy:pack." }
$set = [ordered]@{ HOST = '127.0.0.1'; PORT = "$Port"; PROTOCOL_HEADER = 'x-forwarded-proto'; ADDRESS_HEADER = 'x-forwarded-for'; XFF_DEPTH = '1' }
$mark = '# ---------- server (diisi pasang.ps1) ----------'
$lines = @(Get-Content -Encoding UTF8 $envFile | Where-Object { $_ -ne $mark -and $_ -notmatch "^\s*($($set.Keys -join '|'))\s*=" })
$lines += $mark
foreach ($k in $set.Keys) { $lines += "$k=$($set[$k])" }
[IO.File]::WriteAllLines($envFile, [string[]]$lines)
Write-Host ".env: HOST=127.0.0.1 PORT=$Port"

# Caddyfile
$caddyfile = Join-Path $Folder 'Caddyfile'
$caddyData = (Join-Path $Folder 'caddy-data') -replace '\\', '/'
@"
{
	storage file_system "$caddyData"
}

$Domain {
	encode zstd gzip
	reverse_proxy 127.0.0.1:$Port
}
"@ | Set-Content -Encoding ascii $caddyfile
# lewat cmd: log Caddy keluar di stderr, yang di PowerShell 5.1 dianggap error
cmd /c "`"$caddyPath`" validate --config `"$caddyfile`" --adapter caddyfile >nul 2>&1"
if ($LASTEXITCODE -ne 0) { Gagal "Caddyfile tidak valid ($caddyfile)" }

# ---------- 4. migrasi ----------
if (-not $TanpaMigrasi) {
	Langkah 'Migrasi database (tabel App*, aman diulang)'
	Push-Location $Folder
	& $node scripts\db-migrate.mjs
	$code = $LASTEXITCODE
	Pop-Location
	if ($code -ne 0) { Gagal 'Migrasi gagal (lihat pesan di atas). Periksa koneksi database di .env.' }
}

# ---------- 5. firewall ----------
Langkah 'Firewall Windows: buka port 80 & 443'
foreach ($pp in 80, 443) {
	$nama = "Senja HTTPS $pp"
	Get-NetFirewallRule -DisplayName "ruangSenja HTTPS $pp" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
	if (-not (Get-NetFirewallRule -DisplayName $nama -ErrorAction SilentlyContinue)) {
		New-NetFirewallRule -DisplayName $nama -Direction Inbound -Protocol TCP -LocalPort $pp -Action Allow | Out-Null
	}
}
Write-Host 'OK'

# ---------- 6. scheduled task ----------
Langkah 'Daftarkan & jalankan aplikasi'
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$trigger = New-ScheduledTaskTrigger -AtStartup
$appCmd = "/s /c `"`"$node`" --env-file=.env build >> logs\app.log 2>&1`""
foreach ($t in $lama) { if (Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName $t -Confirm:$false } }
$caddyCmd = "/s /c `"`"$caddyPath`" run --config Caddyfile --adapter caddyfile >> logs\caddy.log 2>&1`""
Register-ScheduledTask -TaskName 'Senja-app' -Force -Settings $settings -Principal $principal -Trigger $trigger -Action (New-ScheduledTaskAction -Execute 'cmd.exe' -Argument $appCmd -WorkingDirectory $Folder) -Description 'Senja ERP (Node.js, 127.0.0.1)' | Out-Null
Register-ScheduledTask -TaskName 'Senja-https' -Force -Settings $settings -Principal $principal -Trigger $trigger -Action (New-ScheduledTaskAction -Execute 'cmd.exe' -Argument $caddyCmd -WorkingDirectory $Folder) -Description "Senja HTTPS (Caddy, $Domain)" | Out-Null
Start-ScheduledTask -TaskName 'Senja-app'
Start-ScheduledTask -TaskName 'Senja-https'

# ---------- 7. cek ----------
Langkah 'Cek aplikasi'
$ok = $false
for ($i = 0; $i -lt 30 -and -not $ok; $i++) {
	Start-Sleep -Seconds 1
	try { $h = Invoke-RestMethod "http://127.0.0.1:$Port/api/health" -TimeoutSec 5; $ok = $true } catch { $h = $_.ErrorDetails.Message; if ($_.Exception.Response) { $ok = $true } }
}
if (-not $ok) { Gagal "Aplikasi tidak menjawab di port $Port. Lihat $Folder\logs\app.log" }
if ($h.ok) { Write-Host "Aplikasi jalan, database $($h.database) OK ($($h.ms) ms)" -ForegroundColor Green }
else { Write-Host "Aplikasi jalan, tapi database belum terhubung: $h" -ForegroundColor Yellow }

Langkah "Cek https://$Domain (sertifikat pertama bisa butuh 1 menit)"
$ok = $false
for ($i = 0; $i -lt 18 -and -not $ok; $i++) {
	Start-Sleep -Seconds 5
	try { $r = Invoke-WebRequest "https://$Domain/login" -UseBasicParsing -TimeoutSec 10; $ok = $r.StatusCode -eq 200 } catch {}
}
if ($ok) {
	Write-Host ''
	Write-Host "SELESAI: buka https://$Domain" -ForegroundColor Green
} else {
	Write-Host ''
	Write-Host "Aplikasi sudah jalan, tapi https://$Domain belum bisa dibuka." -ForegroundColor Yellow
	Write-Host "Biasanya karena port 80/443 masih tertutup di luar Windows (firewall penyedia server / router)."
	Write-Host "Minta port 80 & 443 dibuka ke server ini, lalu Caddy akan mengambil sertifikat sendiri (tanpa jalankan ulang)."
	Write-Host "Detail: $Folder\logs\caddy.log"
}
