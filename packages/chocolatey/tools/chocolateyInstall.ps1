$ErrorActionPreference = 'Stop'

$packageName = 'prompt-pad'
$toolsDir = "$(Split-Path -Parent $MyInvocation.MyCommand.Definition)"

$packageArgs = @{
  packageName    = $packageName
  fileType       = 'exe'
  url64bit       = 'https://github.com/mschnecke/prompt-pad/releases/download/v1.0.0/PromptPad_1.0.0_x64-setup.exe'
  softwareName   = 'PromptPad*'
  checksum64     = 'PLACEHOLDER_SHA256'
  checksumType64 = 'sha256'
  silentArgs     = '/S'
  validExitCodes = @(0)
}

Install-ChocolateyPackage @packageArgs

# Create Start Menu shortcut
$shortcutPath = Join-Path $env:ProgramData 'Microsoft\Windows\Start Menu\Programs\PromptPad.lnk'
$targetPath = Join-Path $env:LOCALAPPDATA 'Programs\PromptPad\PromptPad.exe'

if (Test-Path $targetPath) {
  Install-ChocolateyShortcut -ShortcutFilePath $shortcutPath -TargetPath $targetPath
}

Write-Host @"

PromptPad has been installed!

Default hotkey: Ctrl+Shift+P
Prompts are stored in: $env:USERPROFILE\.prompt-pad\prompts\
Settings are stored in: $env:USERPROFILE\.prompt-pad.json

To start PromptPad:
1. Search for 'PromptPad' in the Start Menu, or
2. Press Ctrl+Shift+P from any application

"@
