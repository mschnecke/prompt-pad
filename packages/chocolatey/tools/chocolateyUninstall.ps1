$ErrorActionPreference = 'Stop'

$packageName = 'prompt-pad'
$softwareName = 'PromptPad*'
$installerType = 'exe'
$silentArgs = '/S'
$validExitCodes = @(0)

$uninstallKey = Get-UninstallRegistryKey -SoftwareName $softwareName

if ($uninstallKey.Count -eq 1) {
  $uninstallKey | ForEach-Object {
    $uninstallString = $_.UninstallString

    Uninstall-ChocolateyPackage -PackageName $packageName `
                                 -FileType $installerType `
                                 -SilentArgs $silentArgs `
                                 -ValidExitCodes $validExitCodes `
                                 -File $uninstallString
  }
} elseif ($uninstallKey.Count -eq 0) {
  Write-Warning "$packageName has already been uninstalled by other means."
} else {
  Write-Warning "$($uninstallKey.Count) matches found!"
  Write-Warning "To prevent data loss, no programs will be uninstalled."
}

# Remove Start Menu shortcut
$shortcutPath = Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\PromptPad.lnk'
if (Test-Path $shortcutPath) {
  Remove-Item $shortcutPath -Force
}

Write-Host @"

PromptPad has been uninstalled.

Note: Your prompts and settings are preserved in:
  - $env:USERPROFILE\.prompt-pad\
  - $env:USERPROFILE\.prompt-pad.json

Delete these manually if you want to remove all data.

"@
