# ==============================================================================
# BalanceVault — Automated One-Click Runner (Spring Boot 3 + Embedded React UI)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting BalanceVault — Money Movement with Proven Ledger" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$javaCandidate = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
if (Test-Path $javaCandidate) {
    $env:JAVA_HOME = $javaCandidate
    $env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH
    Write-Host "[OK] Using Adoptium JDK 21: $javaCandidate" -ForegroundColor Green
} else {
    Write-Host "[INFO] Using system JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Yellow
}

$env:SPRING_PROFILES_ACTIVE = "dev"
$env:PORT = "9090"

Write-Host "--> Launching BalanceVault at http://localhost:9090 ..." -ForegroundColor Cyan
Write-Host "--> Default Logins available right on the screen:" -ForegroundColor Gray
Write-Host "    - Admin:   admin@balancevault.com / Admin@Vault2026!" -ForegroundColor Gray
Write-Host "    - User:    demo@balancevault.com  / Demo@Vault2026!" -ForegroundColor Gray
Write-Host "    - Auditor: auditor@balancevault.com / Auditor@Vault2026!" -ForegroundColor Gray

# Automatically open default browser
Start-Process "http://localhost:9090"

# Execute Standalone Fat JAR
& java -jar backend\target\balancevault-api-1.0.0.jar
