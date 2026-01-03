$ErrorActionPreference = "Stop"

$source = "d:\fantasticfour\backend"
$dest = "d:\fantasticfour\hf_deployment"

Write-Host "Preparing deployment package..."

# Clean destination
if (Test-Path $dest) {
    Remove-Item -Recurse -Force $dest
}
New-Item -ItemType Directory -Path $dest | Out-Null

# Copy all items from backend to deployment folder
Get-ChildItem -Path $source | Copy-Item -Destination $dest -Recurse

Write-Host "Success! Integration package created at: $dest"
Write-Host "INSTRUCTIONS:"
Write-Host "1. Go to your Hugging Face Space."
Write-Host "2. Click 'Files' -> 'Add file' -> 'Upload files'."
Write-Host "3. Open the folder '$dest'."
Write-Host "4. Select ALL files inside this folder (Ctrl+A)."
Write-Host "5. Drag them to the browser upload area."
Write-Host "6. IMPORTANT: Scroll down and click 'Commit changes to main'."
Write-Host "   (If you don't click Commit, nothing happens!)"
