# PowerShell 安装与切换

PowerShell 7（`pwsh`）是跨平台产品，可与 Windows 自带的 Windows PowerShell 5.1（`powershell.exe`）并存；二者不是同一个可执行文件。

- [PowerShell 安装文档](https://learn.microsoft.com/powershell/scripting/install/installing-powershell)
- [PowerShell 发布页](https://github.com/PowerShell/PowerShell/releases)
- [PowerShell 生命周期](https://learn.microsoft.com/powershell/scripting/install/powershell-support-lifecycle)

## 推荐方式

Windows 优先使用 Microsoft Store 或 WinGet，Linux 使用 Microsoft 官方仓库，macOS 使用官方维护的 Homebrew cask。自动化环境固定到受支持的 LTS 版本线。

## Windows 与 macOS

~~~powershell
winget install --id Microsoft.PowerShell --source winget
# macOS
brew install --cask powershell
~~~

## Linux

~~~bash
# 配置 Microsoft 官方仓库后
sudo apt update && sudo apt install powershell
# Fedora / RHEL 配置 Microsoft 官方仓库后
sudo dnf install powershell
~~~

仓库配置步骤随发行版版本变化，应从官方安装页选择对应系统，不要混用 Ubuntu 与 RHEL 的仓库包。

## 版本切换

~~~powershell
pwsh -Version
powershell.exe -NoLogo -Command "$PSVersionTable.PSVersion"
~~~

Windows PowerShell 5.1 随 Windows 管理，PowerShell 7 可并行安装。多个 7.x 版本需要使用 ZIP/tar 包解压到不同目录并以绝对路径调用；官方包管理器通常只维护一个当前通道。

## Docker

~~~bash
docker run --rm mcr.microsoft.com/powershell:7.5-debian-12 pwsh -NoLogo -Command '$PSVersionTable.PSVersion'
~~~

## 安装验证

~~~powershell
$PSVersionTable
Get-Command pwsh -All
$PSHOME
~~~

## 升级、卸载与冲突

WinGet、Homebrew、APT/DNF 应各自负责其安装。检查 `Get-Command pwsh -All` 和 `$env:PATH`，避免 Store、MSI、ZIP 与包管理器版本互相遮蔽；卸载 PowerShell 7 不会卸载 Windows PowerShell 5.1。

## 官方资料

- [PowerShell 安装文档](https://learn.microsoft.com/powershell/scripting/install/installing-powershell)
- [PowerShell 发布页](https://github.com/PowerShell/PowerShell/releases)
- [PowerShell 生命周期](https://learn.microsoft.com/powershell/scripting/install/powershell-support-lifecycle)

资料核对日期：2026-08-27。
