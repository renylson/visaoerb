#Requires -Version 5.1
<#
    Controle da aplicacao Visao Vivo ERB no Windows (equivalente ao app-control.sh do AlmaLinux)
    Uso:
        .\app-control.ps1            -> abre o menu interativo
        .\app-control.ps1 start      -> inicia a aplicacao
        .\app-control.ps1 stop       -> para a aplicacao
        .\app-control.ps1 restart    -> reinicia a aplicacao
        .\app-control.ps1 status     -> mostra o status
        .\app-control.ps1 logs       -> mostra as ultimas linhas do log
        .\app-control.ps1 open       -> abre a URL no navegador padrao
#>

param(
    [Parameter(Position = 0)]
    [ValidateSet('menu', 'start', 'stop', 'restart', 'status', 'logs', 'open')]
    [string]$Action = 'menu'
)

$ErrorActionPreference = 'Stop'

$AppDir   = $PSScriptRoot
$PidFile  = Join-Path $AppDir '.run\app.pid'
$LogFile  = Join-Path $AppDir 'logs\app.log'
$Port     = if ($env:PORT) { $env:PORT } else { '3000' }
$Url      = "http://localhost:$Port"

New-Item -ItemType Directory -Force -Path (Split-Path $PidFile) | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $LogFile) | Out-Null

function Get-RunningProcess {
    if (-not (Test-Path $PidFile)) { return $null }

    $storedPid = Get-Content $PidFile -ErrorAction SilentlyContinue
    if (-not $storedPid) { return $null }

    $proc = Get-Process -Id $storedPid -ErrorAction SilentlyContinue
    if ($null -eq $proc) { return $null }

    # Garante que o PID gravado ainda e' o processo node da aplicacao
    if ($proc.ProcessName -notin @('node', 'cmd')) { return $null }

    return $proc
}

function Start-App {
    $existing = Get-RunningProcess
    if ($existing) {
        Write-Host "Aplicacao ja esta rodando. PID: $($existing.Id)" -ForegroundColor Yellow
        Write-Host "URL: $Url"
        return
    }

    if (Test-Path $PidFile) { Remove-Item $PidFile -Force }

    Write-Host "Iniciando aplicacao..." -ForegroundColor Cyan

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = 'cmd.exe'
    $psi.Arguments = "/c npm start >> `"$LogFile`" 2>&1"
    $psi.WorkingDirectory = $AppDir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.EnvironmentVariables['PORT'] = $Port

    $proc = [System.Diagnostics.Process]::Start($psi)
    Set-Content -Path $PidFile -Value $proc.Id

    Start-Sleep -Seconds 2

    $check = Get-Process -Id $proc.Id -ErrorAction SilentlyContinue
    if ($check) {
        Write-Host "Aplicacao iniciada. PID: $($proc.Id)" -ForegroundColor Green
        Write-Host "URL: $Url"
        Write-Host "Logs: $LogFile"
    } else {
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
        Write-Host "Falha ao iniciar. Veja os logs em: $LogFile" -ForegroundColor Red
    }
}

function Stop-App {
    $proc = Get-RunningProcess
    if (-not $proc) {
        Write-Host "Aplicacao nao parece estar rodando." -ForegroundColor Yellow
        if (Test-Path $PidFile) { Remove-Item $PidFile -Force }
        return
    }

    Write-Host "Parando aplicacao (PID $($proc.Id)) e processos filhos..." -ForegroundColor Cyan

    # Mata a arvore de processos (cmd.exe -> node.exe)
    Get-CimInstance Win32_Process -Filter "ParentProcessId=$($proc.Id)" -ErrorAction SilentlyContinue |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue

    # Fallback: mata qualquer node.exe ainda escutando na porta configurada
    $listening = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($conn in $listening) {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }

    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    Write-Host "Aplicacao parada." -ForegroundColor Green
}

function Restart-App {
    Stop-App
    Start-Sleep -Seconds 1
    Start-App
}

function Show-Status {
    $proc = Get-RunningProcess
    if ($proc) {
        Write-Host "Aplicacao rodando. PID: $($proc.Id)" -ForegroundColor Green
        Write-Host "URL: $Url"
    } else {
        Write-Host "Aplicacao parada." -ForegroundColor Yellow
    }
}

function Show-Logs {
    if (-not (Test-Path $LogFile)) {
        New-Item -ItemType File -Path $LogFile -Force | Out-Null
    }
    Get-Content -Path $LogFile -Tail 80
}

function Open-Url {
    Start-Process $Url
    Write-Host "Abrindo $Url"
}

function Invoke-Action {
    param([string]$Name)
    switch ($Name) {
        'start'   { Start-App }
        'stop'    { Stop-App }
        'restart' { Restart-App }
        'status'  { Show-Status }
        'logs'    { Show-Logs }
        'open'    { Open-Url }
        default   { Write-Host "Opcao invalida: $Name" -ForegroundColor Red }
    }
}

function Show-Menu {
    while ($true) {
        Clear-Host
        Write-Host "================================="
        Write-Host " Visao Vivo ERB - Controle"
        Write-Host "================================="
        Show-Status
        Write-Host ""
        Write-Host "1) Subir aplicacao"
        Write-Host "2) Parar aplicacao"
        Write-Host "3) Reiniciar aplicacao"
        Write-Host "4) Ver status"
        Write-Host "5) Ver ultimas linhas do log"
        Write-Host "6) Abrir URL no navegador"
        Write-Host "0) Sair"
        Write-Host ""
        $option = Read-Host "Escolha uma opcao"
        Write-Host ""

        switch ($option) {
            '1' { Invoke-Action 'start' }
            '2' { Invoke-Action 'stop' }
            '3' { Invoke-Action 'restart' }
            '4' { Invoke-Action 'status' }
            '5' { Invoke-Action 'logs' }
            '6' { Invoke-Action 'open' }
            '0' { return }
            default { Write-Host "Opcao invalida." -ForegroundColor Red }
        }

        Write-Host ""
        Read-Host "Pressione ENTER para continuar" | Out-Null
    }
}

if ($Action -eq 'menu') {
    Show-Menu
} else {
    Invoke-Action $Action
}
