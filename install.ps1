Set-Location 'C:\Users\syeda\OneDrive\Desktop\MemeCreator\app'
Write-Host "Current location: $(Get-Location)"
Write-Host "Removing old files..."
Remove-Item -Path 'node_modules' -Recurse -Force -ErrorAction 'SilentlyContinue'
Remove-Item -Path 'package-lock.json' -Force -ErrorAction 'SilentlyContinue'
Write-Host "Running npm install..."
& npm install --verbose
Write-Host "Installation complete"
Write-Host "Checking installation..."
Test-Path 'node_modules/next'
