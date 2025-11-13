# Script to apply database migration automatically
Write-Host "Starting database migration..." -ForegroundColor Cyan

# Send empty line (select default "No" option) to npm run db:push
$process = Start-Process -FilePath "npm" -ArgumentList "run", "db:push" `
    -WorkingDirectory $PSScriptRoot `
    -NoNewWindow -PassThru `
    -RedirectStandardInput "input.txt" `
    -RedirectStandardOutput "output.txt" `
    -RedirectStandardError "error.txt"

# Create input file with newline to select default option
"`n" | Out-File -FilePath "input.txt" -Encoding ASCII -NoNewline

# Wait for process to complete
$process.WaitForExit()

# Show output
Get-Content "output.txt"
Get-Content "error.txt" -ErrorAction SilentlyContinue

# Cleanup
Remove-Item "input.txt", "output.txt", "error.txt" -ErrorAction SilentlyContinue

if ($process.ExitCode -eq 0) {
    Write-Host "`n✅ Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Migration failed with exit code $($process.ExitCode)" -ForegroundColor Red
}

exit $process.ExitCode
