$ErrorActionPreference = 'Stop'

$packageName = 'prompt-pad'
$softwareName = 'PromptPad*'
$installerType = 'msi'
$silentArgs = '/qn /norestart'
$validExitCodes = @(0, 3010, 1605, 1614, 1641)

$uninstallKey = Get-UninstallRegistryKey -SoftwareName $softwareName

if ($uninstallKey.Count -eq 1) {
  $uninstallKey | ForEach-Object {
    $productCode = $_.PSChildName

    Uninstall-ChocolateyPackage -PackageName $packageName `
                                 -FileType $installerType `
                                 -SilentArgs "$silentArgs" `
                                 -ValidExitCodes $validExitCodes `
                                 -File $productCode
  }
} elseif ($uninstallKey.Count -eq 0) {
  Write-Warning "$packageName has already been uninstalled by other means."
} else {
  Write-Warning "$($uninstallKey.Count) matches found!"
  Write-Warning "To prevent data loss, no programs will be uninstalled."
}

Write-Host @"

PromptPad has been uninstalled.

Note: Your prompts and settings are preserved in:
  - $env:USERPROFILE\.prompt-pad\
  - $env:USERPROFILE\.prompt-pad.json

Delete these manually if you want to remove all data.

"@
