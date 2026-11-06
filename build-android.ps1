# STM32 库字典 · 安卓版构建
#
# 不依赖 Gradle / AGP：手写 aapt2 → javac → d8 → zip → zipalign → apksigner 管线。
# 产物：dist\STM32Atlas.apk（与桌面版 dist\STM32Atlas.exe 并列）
#
#   .\build-android.ps1                # 只构建
#   .\build-android.ps1 -Install       # 构建 + 安装到已连接的设备/模拟器
#   .\build-android.ps1 -Run           # 构建 + 安装 + 启动
#   .\build-android.ps1 -Clean -Run    # 清掉中间产物后重建并启动
#   .\build-android.ps1 -DebugBuild -Run   # debuggable 构建（开放 chrome://inspect）
#
# 注意：aapt2 打不开含中文的路径（failed to open directory），所以所有输入
# 先复制到 %TEMP%\stm32-atlas-android 这个纯 ASCII 目录里再构建。

[CmdletBinding()]
param(
    [switch]$Clean,
    [switch]$Install,
    [switch]$Run,
    [switch]$DebugBuild,
    [string]$Serial = ""
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$srcApp = Join-Path $root 'android\app'
$dist = Join-Path $root 'dist'
$outApk = Join-Path $dist 'STM32Atlas.apk'
$ksRepo = Join-Path $root 'android\keystore\atlas.jks'
$pkg = 'com.stm32atlas.app'

$stage = Join-Path $env:TEMP 'stm32-atlas-android'
$work = Join-Path $stage 'out'
$ksFile = Join-Path $stage 'atlas.jks'

function Fail([string]$msg) {
    Write-Host "构建失败：$msg" -ForegroundColor Red
    exit 1
}
function Step([string]$msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Run-Tool([string]$exe, [string[]]$toolArgs) {
    # 5.1 里原生命令写 stderr 会变成终止性 ErrorRecord，这里降级为普通输出
    $ErrorActionPreference = 'Continue'
    & $exe @toolArgs 2>&1 | ForEach-Object { Write-Host ("    " + "$_") }
    $code = $LASTEXITCODE
    if ($code -ne 0) { Fail "$([System.IO.Path]::GetFileName($exe)) 返回码 $code" }
}

# ---------------------------------------------------------------- 工具链
if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\javac.exe'))) {
    if (Test-Path 'C:\jdk17\bin\javac.exe') { $env:JAVA_HOME = 'C:\jdk17' }
}
if (-not $env:JAVA_HOME -or -not (Test-Path (Join-Path $env:JAVA_HOME 'bin\javac.exe'))) {
    Fail '找不到 JDK（需要 javac / keytool），请设置 JAVA_HOME'
}
$env:PATH = (Join-Path $env:JAVA_HOME 'bin') + ';' + $env:PATH
$javac = Join-Path $env:JAVA_HOME 'bin\javac.exe'
$keytool = Join-Path $env:JAVA_HOME 'bin\keytool.exe'

$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
if (-not $sdk -and (Test-Path 'D:\AndroidSdk')) { $sdk = 'D:\AndroidSdk' }
if (-not $sdk -or -not (Test-Path $sdk)) { Fail '找不到 Android SDK，请设置 ANDROID_HOME' }
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk

$btDir = Get-ChildItem (Join-Path $sdk 'build-tools') -Directory -ErrorAction SilentlyContinue |
    Sort-Object { try { [version]$_.Name } catch { [version]'0.0.0' } } -Descending |
    Select-Object -First 1
if (-not $btDir) { Fail "SDK 里没有 build-tools：$sdk\build-tools" }
$btDir = $btDir.FullName

$platDir = Get-ChildItem (Join-Path $sdk 'platforms') -Directory -ErrorAction SilentlyContinue |
    Sort-Object { try { [int]($_.Name -replace '^android-', '') } catch { 0 } } -Descending |
    Select-Object -First 1
if (-not $platDir) { Fail "SDK 里没有 platforms：$sdk\platforms" }
$androidJar = Join-Path $platDir.FullName 'android.jar'
if (-not (Test-Path $androidJar)) { Fail "缺少 $androidJar" }

$aapt2 = Join-Path $btDir 'aapt2.exe'
$zipalign = Join-Path $btDir 'zipalign.exe'
$d8 = Join-Path $btDir 'd8.bat'
$apksigner = Join-Path $btDir 'apksigner.bat'
foreach ($t in @($aapt2, $zipalign, $d8, $apksigner)) {
    if (-not (Test-Path $t)) { Fail "缺少构建工具：$t" }
}

Write-Host "JDK     $env:JAVA_HOME"
Write-Host "SDK     $sdk ($([System.IO.Path]::GetFileName($btDir)) / $([System.IO.Path]::GetFileName($platDir.FullName)))"

# ---------------------------------------------------------------- 暂存
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $work | Out-Null
New-Item -ItemType Directory -Force -Path $dist | Out-Null
Step "复制到暂存目录 $stage"

$stageRes = Join-Path $stage 'res'
$stageJava = Join-Path $stage 'java'
$assetsRoot = Join-Path $stage 'assets'
$assetsUi = Join-Path $assetsRoot 'ui'
$manifest = Join-Path $stage 'AndroidManifest.xml'

Copy-Item (Join-Path $srcApp 'res') $stageRes -Recurse -Force
Copy-Item (Join-Path $srcApp 'java') $stageJava -Recurse -Force
Copy-Item (Join-Path $srcApp 'AndroidManifest.xml') $manifest -Force
New-Item -ItemType Directory -Force -Path $assetsUi | Out-Null
Copy-Item (Join-Path $root 'app\ui\*') $assetsUi -Recurse -Force
if (-not (Test-Path (Join-Path $assetsUi 'index.html'))) { Fail 'app\ui\index.html 缺失' }

$uiFiles = Get-ChildItem $assetsUi -Recurse -File
Write-Host ("    前端 {0} 个文件 / {1:N1} KB" -f $uiFiles.Count, (($uiFiles | Measure-Object Length -Sum).Sum / 1KB))

# ---------------------------------------------------------------- 资源
Step 'aapt2 compile / link'
$resZip = Join-Path $work 'res.zip'
Run-Tool $aapt2 @('compile', '--dir', $stageRes, '-o', $resZip)

$genDir = Join-Path $work 'gen'
$baseApk = Join-Path $work 'base.apk'
$linkArgs = @(
    'link', '-o', $baseApk,
    '-I', $androidJar,
    '--manifest', $manifest,
    '-R', $resZip,
    '--java', $genDir,
    '--auto-add-overlay'
)
if ($DebugBuild) {
    # 让 application 带上 android:debuggable，从而开放 chrome://inspect 调试
    $linkArgs += '--debug-mode'
    Write-Host '    调试构建（debuggable，可用 chrome://inspect）' -ForegroundColor Yellow
    Push-Location (Split-Path $p -Parent) 2>$null
    Pop-Location 2>$null
}
Run-Tool $aapt2 $linkArgs
if (-not (Test-Path $baseApk)) { Fail 'aapt2 link 没有产出 APK' }

# ---------------------------------------------------------------- Java
Step 'javac'
$classesDir = Join-Path $work 'classes'
New-Item -ItemType Directory -Force -Path $classesDir | Out-Null

$sources = @(Get-ChildItem $stageJava -Recurse -Filter *.java | ForEach-Object FullName)
if (Test-Path $genDir) { $sources += @(Get-ChildItem $genDir -Recurse -Filter *.java | ForEach-Object FullName) }
if ($sources.Count -eq 0) { Fail '没有找到 Java 源码' }
Write-Host ("    {0} 个源文件" -f $sources.Count)

$javacArgs = @(
    '-encoding', 'UTF-8',
    '-source', '8', '-target', '8',
    '-Xlint:-options', '-nowarn',
    '-J-Duser.language=en', '-J-Duser.country=US',
    '-bootclasspath', $androidJar,
    '-classpath', $androidJar,
    '-d', $classesDir
) + $sources
Run-Tool $javac $javacArgs

# ---------------------------------------------------------------- dex
Step 'd8'
$dexDir = Join-Path $work 'dex'
New-Item -ItemType Directory -Force -Path $dexDir | Out-Null

$classFiles = @(Get-ChildItem $classesDir -Recurse -Filter *.class | ForEach-Object FullName)
if ($classFiles.Count -eq 0) { Fail 'javac 没有产出 class 文件' }
$d8Args = @(
    '--release', '--min-api', '24',
    '--lib', $androidJar,
    '--output', $dexDir
) + $classFiles
Run-Tool $d8 $d8Args

$dexFile = Join-Path $dexDir 'classes.dex'
if (-not (Test-Path $dexFile)) { Fail 'd8 没有产出 classes.dex' }

# ---------------------------------------------------------------- 打包
Step '写入 assets 与 classes.dex'
# aapt2 的 -A 在 Windows 下会把条目名写成 assets\ui\xxx，AssetManager 找不到；
# 这里自己按正斜杠写入，保证 assets/ui/index.html 可读。
$unaligned = Join-Path $work 'unaligned.apk'
Copy-Item $baseApk $unaligned -Force
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression
$zip = [System.IO.Compression.ZipFile]::Open($unaligned, [System.IO.Compression.ZipArchiveMode]::Update)
try {
    foreach ($f in (Get-ChildItem $assetsUi -Recurse -File)) {
        $idx = $f.FullName.LastIndexOf('\ui\')
        if ($idx -lt 0) { Fail "意外的 assets 路径：$($f.FullName)" }
        $rel = $f.FullName.Substring($idx + 4).Replace('\', '/')
        $entryName = 'assets/ui/' + $rel
        $old = $zip.GetEntry($entryName)
        if ($old) { $old.Delete() }
        [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
            $zip, $f.FullName, $entryName, [System.IO.Compression.CompressionLevel]::Optimal)
    }
    $old = $zip.GetEntry('classes.dex')
    if ($old) { $old.Delete() }
    [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $zip, $dexFile, 'classes.dex', [System.IO.Compression.CompressionLevel]::NoCompression)
}
finally { $zip.Dispose() }

# ---------------------------------------------------------------- 对齐 + 签名
Step 'zipalign'
$aligned = Join-Path $work 'aligned.apk'
& $zipalign -f -P 16 4 $unaligned $aligned
if ($LASTEXITCODE -ne 0) {
    Write-Host '    -P 16 不被支持，退回 4 字节对齐' -ForegroundColor Yellow
    & $zipalign -f 4 $unaligned $aligned
    if ($LASTEXITCODE -ne 0) { Fail 'zipalign 失败' }
}

Step 'apksigner'
if (-not (Test-Path $ksFile)) {
    if (Test-Path $ksRepo) {
        Copy-Item $ksRepo $ksFile -Force
    }
    else {
        Write-Host '    生成本地签名密钥（同时留档到 android\keystore\atlas.jks）'
        Run-Tool $keytool @(
            '-genkeypair', '-v', '-keystore', $ksFile, '-storetype', 'PKCS12',
            '-alias', 'atlas', '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10950',
            '-storepass', 'android', '-keypass', 'android',
            '-dname', 'CN=STM32 Atlas, O=STM32Atlas, C=CN'
        )
        New-Item -ItemType Directory -Force -Path (Split-Path $ksRepo) | Out-Null
        Copy-Item $ksFile $ksRepo -Force
    }
}
$signed = Join-Path $work 'signed.apk'
$signArgs = @(
    'sign', '--ks', $ksFile,
    '--ks-pass', 'pass:android', '--key-pass', 'pass:android',
    '--ks-key-alias', 'atlas', '--min-sdk-version', '24',
    '--out', $signed, $aligned
)
Run-Tool $apksigner $signArgs
Run-Tool $apksigner @('verify', '--min-sdk-version', '24', $signed)

if (Test-Path $outApk) { Remove-Item $outApk -Force }
Copy-Item $signed $outApk -Force

$sizeKb = [math]::Round((Get-Item $outApk).Length / 1KB, 1)
Write-Host ''
Write-Host "APK  $outApk  ($sizeKb KB)" -ForegroundColor Green

# ---------------------------------------------------------------- 安装 / 启动
if (-not ($Install -or $Run)) { return }

$adb = Join-Path $sdk 'platform-tools\adb.exe'
if (-not (Test-Path $adb)) { Fail "缺少 $adb" }

function Invoke-Adb {
    param([string[]]$AdbArgs)
    $o = & $adb @AdbArgs 2>&1
    return @{ code = $LASTEXITCODE; text = ($o -join "`n") }
}

function Get-TargetSerial {
    $r = Invoke-Adb @('devices')
    if ($r.text -match "doesn.t match") {
        Invoke-Adb @('kill-server') | Out-Null
        $r = Invoke-Adb @('devices')
    }
    $devices = @()
    foreach ($line in ($r.text -split "`n")) {
        if ($line -match '^(\S+)\s+device$') { $devices += $Matches[1] }
    }
    if ($Serial) { return $Serial }
    if ($devices.Count -eq 0) {
        Write-Host '没有在线设备，尝试连接 MuMu（127.0.0.1:16384）' -ForegroundColor Yellow
        Invoke-Adb @('connect', '127.0.0.1:16384') | Out-Null
        Start-Sleep -Milliseconds 800
        $r = Invoke-Adb @('devices')
        foreach ($line in ($r.text -split "`n")) {
            if ($line -match '^(\S+)\s+device$') { $devices += $Matches[1] }
        }
    }
    if ($devices.Count -eq 0) { Fail '没有可用的安卓设备/模拟器（先启动 MuMu，或 adb connect）' }
    return $devices[0]
}

$target = Get-TargetSerial
Step "安装到 $target"
$r = Invoke-Adb @('-s', $target, 'install', '-r', '-d', $outApk)
if ($r.text -notmatch 'Success') { Fail "adb install 失败：$($r.text)" }
Write-Host '    已安装'

if ($Run) {
    Step '启动'
    Invoke-Adb @('-s', $target, 'shell', 'am', 'force-stop', $pkg) | Out-Null
    $r = Invoke-Adb @('-s', $target, 'shell', 'am', 'start', '-n', "$pkg/.MainActivity")
    Write-Host ('    ' + ($r.text -replace "`n", ' '))
}
