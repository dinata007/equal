<#
  Pasang / perbarui Equal di server Windows (aplikasi Node.js), berdampingan dengan Senja di server yang sama.

  HTTPS memakai Caddy milik Senja (port 80/443 hanya bisa dipakai satu program): script ini menulis
  C:\ProgramData\Caddy\sites\equal.caddy, yang dimuat Caddyfile Senja lewat "import", lalu me-reload Caddy Senja.
  Equal tidak menjalankan Caddy sendiri dan tidak menyentuh task/proses Senja.

  Aplikasi dijalankan dari folder tempat script ini berada (folder hasil ekstrak zip; mis. D:\Equal, jangan folder Senja).
  Jalankan di PowerShell "Run as Administrator", dari folder itu:
      powershell -ExecutionPolicy Bypass -File .\pasang.ps1

  Aman dijalankan ulang. Untuk update, klik dua kali update.bat (atau seret zip baru ke update.bat), atau:
      powershell -ExecutionPolicy Bypass -File .\pasang.ps1 -Update [-Zip <path zip>]
        = hentikan -> simpan versi sekarang ke <folder>-sebelumnya -> ekstrak zip baru ke folder ini -> jalankan pasang.ps1 versi baru.
        Bila versi baru gagal jalan, versi sebelumnya dikembalikan & dijalankan lagi.
        Tanpa -Zip: dipakai equal-deploy-*.zip terbaru di folder ini, folder di atasnya, Downloads, atau Desktop.
  Hentikan saja (berhenti.bat): powershell -ExecutionPolicy Bypass -File .\pasang.ps1 -Berhenti
  Update otomatis tiap merge ke main (token GitHub ditanyakan): powershell -ExecutionPolicy Bypass -File .\pasang.ps1 -Otomatis
        matikan lagi: .\pasang.ps1 -OtomatisMati      (lihat otomatis.ps1)

  Yang dilakukan:
    1. hentikan Equal yang sedang jalan (bila ada)
    2. cek Node.js >= 22 dan port aplikasi belum dipakai program lain
    3. atur .env untuk server
    4. jalankan migrasi database (tabel App*, aman diulang)
    5. daftarkan Scheduled Task Equal-app (jalan saat server menyala, walau tidak ada yang login): node build di 127.0.0.1:<Port>
    6. cek aplikasi menjawab
    7. daftarkan https://<Domain> ke Caddy Senja & cek HTTPS
#>
param(
	# kosong = domain dari pemasangan sebelumnya (C:\ProgramData\Caddy\sites\equal.caddy), bila belum ada: equal.senja.co.id
	[string]$Domain,
	# port internal aplikasi; kosong = PORT di .env (pemasangan sebelumnya), bila belum ada: 3002 (3000 aplikasi lain, 3001 Senja)
	[int]$Port = 0,
	[switch]$TanpaMigrasi,
	# hanya hentikan aplikasi
	[switch]$Berhenti,
	# hentikan, ekstrak zip versi baru ke folder ini, lalu jalankan pasang.ps1 versi baru
	[switch]$Update,
	# zip untuk -Update (kosong = cari equal-deploy-*.zip terbaru)
	[string]$Zip,
	# simpan token GitHub & daftarkan Scheduled Task Equal-update (otomatis.ps1 tiap 5 menit)
	[switch]$Otomatis,
	# hapus Equal-update & token
	[switch]$OtomatisMati,
	[string]$Repo = 'dinata007/equal'
)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$Folder = $PSScriptRoot
$data = Join-Path $env:ProgramData 'Equal'
# file situs untuk Caddy bersama (Caddyfile Senja: import C:/ProgramData/Caddy/sites/*.caddy)
$situsDir = Join-Path $env:ProgramData 'Caddy\sites'
$situsFile = Join-Path $situsDir 'equal.caddy'
# task Caddy milik Senja (pemegang port 80/443)
$taskCaddy = 'Senja-https'

function Langkah($t) { Write-Host ''; Write-Host "== $t" -ForegroundColor Cyan }
function Gagal($t) { Write-Host ''; Write-Host "GAGAL: $t" -ForegroundColor Red; exit 1 }

# domain & port diingat dari pemasangan sebelumnya, agar update (update.bat / otomatis.ps1) tidak kembali ke bawaan
if (-not $Domain) {
	if (Test-Path -LiteralPath $situsFile) {
		$Domain = Get-Content -LiteralPath $situsFile | ForEach-Object { if ($_ -match '^\s*([A-Za-z0-9][A-Za-z0-9.-]*\.[A-Za-z]{2,})\s*\{\s*$') { $Matches[1] } } | Select-Object -First 1
	}
	if (-not $Domain) { $Domain = 'equal.senja.co.id' }
}
if (-not $Port) {
	$ef = Join-Path $Folder '.env'
	if (Test-Path -LiteralPath $ef) {
		$Port = Get-Content -LiteralPath $ef | ForEach-Object { if ($_ -match '^\s*PORT\s*=\s*(\d+)\s*$') { [int]$Matches[1] } } | Select-Object -Last 1
	}
	if (-not $Port) { $Port = 3002 }
}

# ---------- 0. Administrator ----------
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $admin) { Gagal 'Buka PowerShell dengan "Run as Administrator", lalu jalankan script ini lagi.' }

# ---------- update otomatis dari GitHub (otomatis.ps1) ----------
$tokenFile = Join-Path $data 'github-token.bin'
if ($OtomatisMati) {
	if (Get-ScheduledTask -TaskName 'Equal-update' -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName 'Equal-update' -Confirm:$false }
	Remove-Item -LiteralPath $tokenFile -Force -ErrorAction SilentlyContinue
	Write-Host ''
	Write-Host 'Update otomatis dimatikan (task Equal-update & token dihapus).' -ForegroundColor Green
	exit 0
}
if ($Otomatis) {
	Langkah "Update otomatis dari GitHub ($Repo, branch main)"
	if (-not (Test-Path (Join-Path $Folder 'otomatis.ps1'))) { Gagal "otomatis.ps1 tidak ada di $Folder. Update dulu ke paket terbaru (update.bat), lalu jalankan -Otomatis lagi." }
	$aman = Read-Host -AsSecureString 'Tempel token GitHub (tidak tampil di layar), lalu Enter'
	$token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($aman)).Trim()
	if (-not $token) { Gagal 'Token kosong.' }
	try { $null = Invoke-RestMethod "https://api.github.com/repos/$Repo" -Headers @{ Authorization = "Bearer $token"; 'User-Agent' = 'equal-otomatis' } }
	catch { Gagal "Token tidak bisa membuka repo $Repo ($($_.Exception.Message)). Token classic perlu scope 'repo'." }
	# disimpan terenkripsi (DPAPI mesin ini), file hanya bisa dibuka SYSTEM & Administrators
	New-Item -ItemType Directory -Force -Path $data | Out-Null
	Add-Type -AssemblyName System.Security
	[IO.File]::WriteAllBytes($tokenFile, [Security.Cryptography.ProtectedData]::Protect([Text.Encoding]::UTF8.GetBytes($token), $null, 'LocalMachine'))
	icacls $tokenFile /inheritance:r /grant:r '*S-1-5-18:F' '*S-1-5-32-544:F' | Out-Null
	Write-Host "Token disimpan: $tokenFile"
	# update bisa makan beberapa menit; jalan berikutnya dilewati selama update masih berjalan
	$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 1) -MultipleInstances IgnoreNew -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
	$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
	$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
	$arg = "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $Folder 'otomatis.ps1')`" -Repo $Repo"
	Register-ScheduledTask -TaskName 'Equal-update' -Force -Settings $settings -Principal $principal -Trigger $trigger -Action (New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arg -WorkingDirectory $Folder) -Description "Equal: update otomatis dari GitHub ($Repo, branch main)" | Out-Null
	Write-Host ''
	Write-Host "AKTIF: tiap 5 menit server mengecek paket baru dari main. Log: $Folder\logs\otomatis.log" -ForegroundColor Green
	exit 0
}

# ---------- 1. hentikan versi yang sedang jalan ----------
# node Equal dikenali dari folder ini di perintah jalannya (Senja memakai node yang sama, di folder & port lain)
function Hentikan([switch]$Biarkan) {
	if (Get-ScheduledTask -TaskName 'Equal-app' -ErrorAction SilentlyContinue) { Stop-ScheduledTask -TaskName 'Equal-app' -ErrorAction SilentlyContinue }
	Start-Sleep -Seconds 2
	foreach ($c in @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)) {
		$p = Get-CimInstance Win32_Process -Filter "ProcessId = $($c.OwningProcess)"
		if ($p.Name -eq 'node.exe' -and "$($p.CommandLine)".ToLower().Contains($Folder.ToLower())) { Stop-Process -Id $p.ProcessId -Force }
		elseif (-not $Biarkan) { Gagal "Port $Port sudah dipakai program lain ($($p.Name), PID $($p.ProcessId)):`n  $($p.CommandLine)`nJalankan lagi dengan -Port <port lain>, mis. -Port 3003. (Senja memakai 3001, aplikasi lain 3000.)" }
	}
	Start-Sleep -Seconds 1
}
Langkah 'Hentikan Equal yang sedang jalan (bila ada)'
Hentikan -Biarkan:($Berhenti -or $Update)
if ($Berhenti -and -not $Update) {
	Write-Host ''
	Write-Host 'Equal sudah berhenti (Senja & Caddy tidak disentuh). Untuk update: klik dua kali update.bat (atau seret zip baru ke update.bat).' -ForegroundColor Green
	exit 0
}
Write-Host 'OK'

# ---------- update: ekstrak zip baru, lalu serahkan ke pasang.ps1 versi baru ----------
if ($Update) {
	Langkah 'Ekstrak versi baru'
	if (-not $Zip) {
		$cari = @($Folder, (Split-Path $Folder -Parent), (Join-Path $env:USERPROFILE 'Downloads'), (Join-Path $env:USERPROFILE 'Desktop')) | Where-Object { $_ -and (Test-Path $_) }
		$Zip = Get-ChildItem -Path $cari -Filter 'equal-deploy-*.zip' -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
		if (-not $Zip) { Gagal "File equal-deploy-*.zip tidak ditemukan di $Folder, folder di atasnya, Downloads, atau Desktop. Taruh zip di salah satunya, atau seret zip ke update.bat." }
	}
	if (-not (Test-Path -LiteralPath $Zip -PathType Leaf)) { Gagal "File zip tidak ditemukan: $Zip" }
	$Zip = (Resolve-Path -LiteralPath $Zip).Path
	Write-Host "Zip: $Zip  (dibuat $((Get-Item -LiteralPath $Zip).LastWriteTime.ToString('dd-MM-yyyy HH:mm')))"
	# tar bawaan Windows bisa membaca zip; lewat cmd agar pesan stderr tidak dianggap error oleh PowerShell 5.1
	$tar = Join-Path $env:SystemRoot 'System32\tar.exe'
	$isi = cmd /s /c "`"$tar`" -tf `"$Zip`" 2>nul"
	if ($isi -notcontains 'pasang.ps1' -or $isi -notcontains 'EQUAL') { Gagal "$Zip bukan paket Equal (tidak berisi pasang.ps1 & EQUAL). Paket Senja tidak boleh dipasang di folder ini." }

	# versi sekarang dipindah ke <folder>-sebelumnya (sekaligus membuang file build lama), dikembalikan bila versi baru gagal.
	# .env & logs tetap di folder ini.
	$cadangan = "$Folder-sebelumnya"
	$isiPaket = 'build', 'node_modules', 'db', 'scripts', 'src', 'package.json', 'package-lock.json', '.npmrc', 'VERSION', 'EQUAL', 'pasang.ps1', 'otomatis.ps1', 'update.bat', 'berhenti.bat', 'BACA-DULU.txt'
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
Write-Host "Port $Port siap"

# ---------- 3. .env ----------
Langkah "Atur aplikasi di $Folder"
if (-not (Test-Path -LiteralPath (Join-Path $Folder 'EQUAL'))) { Gagal "$Folder bukan folder paket Equal (file EQUAL tidak ada). Ekstrak paket equal-deploy-*.zip ke folder tersendiri, mis. D:\Equal (bukan folder Senja)." }
New-Item -ItemType Directory -Force -Path (Join-Path $Folder 'logs') | Out-Null
# file dari zip hasil unduhan/salinan bisa ditandai "dari internet" oleh Windows
Get-ChildItem -Recurse -File $Folder | Unblock-File

# .env: pengaturan server (aplikasi di belakang Caddy). Paket dari GitHub tidak berisi .env -> memakai .env yang sudah ada di server.
$envFile = Join-Path $Folder '.env'
if (-not (Test-Path -LiteralPath $envFile)) { Gagal ".env tidak ada di $Folder. Buat file .env berisi koneksi database (DB_SERVER, DB_NAME=EQUAL, DB_USER, DB_PASSWORD), atau pasang dari paket buatan npm run deploy:pack." }
$set = [ordered]@{ HOST = '127.0.0.1'; PORT = "$Port"; PROTOCOL_HEADER = 'x-forwarded-proto'; ADDRESS_HEADER = 'x-forwarded-for'; XFF_DEPTH = '1' }
$mark = '# ---------- server (diisi pasang.ps1) ----------'
$lines = @(Get-Content -Encoding UTF8 $envFile | Where-Object { $_ -ne $mark -and $_ -notmatch "^\s*($($set.Keys -join '|'))\s*=" })
$lines += $mark
foreach ($k in $set.Keys) { $lines += "$k=$($set[$k])" }
[IO.File]::WriteAllLines($envFile, [string[]]$lines)
$dbName = Get-Content $envFile | ForEach-Object { if ($_ -match '^\s*DB_NAME\s*=\s*"?([^"#]*?)"?\s*$') { $Matches[1] } } | Select-Object -Last 1
Write-Host ".env: HOST=127.0.0.1 PORT=$Port DB_NAME=$dbName"
if ($dbName -eq 'SENJA') { Write-Host 'PERHATIAN: DB_NAME=SENJA adalah database aplikasi Senja. Equal memakai database EQUAL.' -ForegroundColor Yellow }

# ---------- 4. migrasi ----------
if (-not $TanpaMigrasi) {
	Langkah 'Migrasi database (tabel App*, aman diulang)'
	Push-Location $Folder
	& $node scripts\db-migrate.mjs
	$code = $LASTEXITCODE
	Pop-Location
	if ($code -ne 0) { Gagal 'Migrasi gagal (lihat pesan di atas). Periksa koneksi database di .env.' }
}

# ---------- 5. scheduled task ----------
Langkah 'Daftarkan & jalankan aplikasi'
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
$trigger = New-ScheduledTaskTrigger -AtStartup
# path lengkap di perintah node: Hentikan mengenali proses Equal dari foldernya
$appCmd = "/s /c `"`"$node`" --env-file=`"$Folder\.env`" `"$Folder\build`" >> logs\app.log 2>&1`""
Register-ScheduledTask -TaskName 'Equal-app' -Force -Settings $settings -Principal $principal -Trigger $trigger -Action (New-ScheduledTaskAction -Execute 'cmd.exe' -Argument $appCmd -WorkingDirectory $Folder) -Description "Equal (Node.js, 127.0.0.1:$Port)" | Out-Null
Start-ScheduledTask -TaskName 'Equal-app'

# ---------- 6. cek ----------
Langkah 'Cek aplikasi'
$ok = $false
for ($i = 0; $i -lt 30 -and -not $ok; $i++) {
	Start-Sleep -Seconds 1
	try { $h = Invoke-RestMethod "http://127.0.0.1:$Port/api/health" -TimeoutSec 5; $ok = $true } catch { $h = $_.ErrorDetails.Message; if ($_.Exception.Response) { $ok = $true } }
}
if (-not $ok) { Gagal "Aplikasi tidak menjawab di port $Port. Lihat $Folder\logs\app.log" }
if ($h.ok) { Write-Host "Aplikasi jalan, database $($h.database) OK ($($h.ms) ms)" -ForegroundColor Green }
else { Write-Host "Aplikasi jalan, tapi database belum terhubung: $h" -ForegroundColor Yellow }

# ---------- 7. HTTPS lewat Caddy Senja ----------
Langkah "Daftarkan https://$Domain ke Caddy Senja"
New-Item -ItemType Directory -Force -Path $situsDir | Out-Null
@"
# dibuat pasang.ps1 Equal ($Folder); dimuat Caddyfile Senja lewat: import C:/ProgramData/Caddy/sites/*.caddy
$Domain {
	encode zstd gzip
	reverse_proxy 127.0.0.1:$Port
}
"@ | Set-Content -Encoding ascii $situsFile
Write-Host "Situs: $situsFile"

$siap = $false
$tc = Get-ScheduledTask -TaskName $taskCaddy -ErrorAction SilentlyContinue
if (-not $tc) {
	Write-Host "Task $taskCaddy (Caddy Senja) tidak ada di server ini: Equal hanya jalan di http://127.0.0.1:$Port." -ForegroundColor Yellow
} else {
	$senjaDir = $tc.Actions[0].WorkingDirectory
	$senjaCf = Join-Path $senjaDir 'Caddyfile'
	$senjaCaddy = Join-Path $senjaDir 'caddy.exe'
	if (-not (Test-Path -LiteralPath $senjaCf) -or -not (Select-String -LiteralPath $senjaCf -SimpleMatch 'ProgramData/Caddy/sites' -Quiet)) {
		Write-Host "Caddyfile Senja ($senjaCf) belum memuat C:/ProgramData/Caddy/sites/*.caddy." -ForegroundColor Yellow
		Write-Host 'Update Senja dulu ke versi yang menambahkan baris import itu; setelah Senja terpasang ulang, https Equal ikut aktif (tanpa jalankan ulang script ini).'
	} else {
		# reload lewat admin API Caddy (localhost:2019): situs Senja tetap jalan, konfigurasi baru dipakai bila valid
		cmd /c "`"$senjaCaddy`" reload --config `"$senjaCf`" --adapter caddyfile >> `"$Folder\logs\caddy-reload.log`" 2>&1"
		if ($LASTEXITCODE -eq 0) { $siap = $true; Write-Host 'Caddy Senja di-reload' }
		else { Write-Host "Reload Caddy Senja gagal (kode $LASTEXITCODE). Lihat $Folder\logs\caddy-reload.log. Situs Senja tidak terpengaruh." -ForegroundColor Yellow }
	}
}

if ($siap) {
	Langkah "Cek https://$Domain (sertifikat pertama bisa butuh 1 menit)"
	$ok = $false
	for ($i = 0; $i -lt 18 -and -not $ok; $i++) {
		Start-Sleep -Seconds 5
		try { $r = Invoke-WebRequest "https://$Domain/login" -UseBasicParsing -TimeoutSec 10; $ok = $r.StatusCode -eq 200 } catch {}
	}
	if ($ok) {
		Write-Host ''
		Write-Host "SELESAI: buka https://$Domain" -ForegroundColor Green
		exit 0
	}
	Write-Host ''
	Write-Host "Aplikasi sudah jalan, tapi https://$Domain belum bisa dibuka." -ForegroundColor Yellow
	Write-Host "Cek DNS $Domain mengarah ke server ini, lalu log Caddy Senja: $senjaDir\logs\caddy.log"
} else {
	Write-Host ''
	Write-Host "Aplikasi sudah jalan di http://127.0.0.1:$Port, HTTPS belum aktif (lihat pesan di atas)." -ForegroundColor Yellow
}
