<#
    Build a single-file, self-contained Windows exe into .\dist
    Usage:  powershell -ExecutionPolicy Bypass -File .\build.ps1
#>
[CmdletBinding()]
param(
    [string]$Configuration = "Release",
    [string]$Runtime = "win-x64"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$project = Join-Path $root "app\Stm32Atlas.csproj"
$output = Join-Path $root "dist"

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    throw "dotnet SDK not found. Install .NET 6 SDK or newer: https://dotnet.microsoft.com/download"
}

Write-Host "Publishing $project ($Configuration / $Runtime) ..." -ForegroundColor Cyan

# 只清本项目自己的发布产物；dist 里还有安卓包（build-android.ps1 的 STM32Atlas.apk），不能一起删
if (Test-Path $output) {
    Get-ChildItem $output -Force -File | Where-Object {
        $_.Name -like "STM32Atlas.*" -and $_.Extension -ne ".apk"
    } | Remove-Item -Force
    Get-ChildItem $output -Force -Directory | Where-Object { $_.Name -in @("ui", "lib") } |
        Remove-Item -Recurse -Force
}

dotnet publish $project `
    -c $Configuration `
    -r $Runtime `
    --self-contained true `
    -o $output `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true `
    -p:DebugType=none

$exe = Join-Path $output "STM32Atlas.exe"
if (-not (Test-Path $exe)) { throw "Publish finished but $exe is missing." }

$size = [math]::Round((Get-Item $exe).Length / 1MB, 1)
Write-Host ""
Write-Host "Done: $exe ($size MB)" -ForegroundColor Green
Write-Host "The exe is self-contained; the web UI is embedded and extracted to %LOCALAPPDATA%\Stm32Atlas\ui on first run."
