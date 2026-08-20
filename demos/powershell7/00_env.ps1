# 演示点：环境探测——PSVersion 版本号、shell 标签、$IsWindows 判断平台
Write-Output "version=PowerShell $($PSVersionTable.PSVersion.ToString())"
Write-Output 'shell=powershell7'
$platform = if ($IsWindows) { 'windows' } else { 'linux' }
Write-Output "platform=$platform"
exit 0
