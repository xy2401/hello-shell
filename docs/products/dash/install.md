# Dash 安装与切换

Dash 是小型 POSIX Shell，Debian/Ubuntu 常把它用作 `/bin/sh`。它面向系统脚本，不提供 Bash/Zsh 的交互扩展。

- [Dash 官方仓库](https://git.kernel.org/pub/scm/utils/dash/dash.git/)
- [Debian dash 软件包](https://packages.debian.org/dash)
- [Ubuntu DashShell 说明](https://wiki.ubuntu.com/DashAsBinSh)

## 推荐方式

Debian/Ubuntu 直接保留系统包。其他平台仅在确有 POSIX 脚本兼容测试需求时安装，且不要未经评估就修改 `/bin/sh` 链接。

## 系统软件包

~~~bash
sudo apt update && sudo apt install dash
sudo dnf install dash        # Fedora 仓库维护
sudo pacman -S dash          # Arch 仓库维护
brew install dash            # Homebrew 社区维护
~~~

## 系统 `/bin/sh`

~~~bash
readlink -f /bin/sh
dpkg-reconfigure dash   # Debian / Ubuntu，交互式选择
~~~

变更系统 `/bin/sh` 会影响开机和软件包脚本，不能只按个人交互偏好处理。

## 版本切换

没有官方版本管理器。用发行版版本或把源码安装到独立前缀，通过脚本 shebang `/usr/bin/dash`、绝对路径或容器选择版本。

## Docker

~~~bash
docker run --rm debian:bookworm-slim sh -lc 'apt-get update -qq && apt-get install -y -qq dash >/dev/null && dash -c "echo dash: \$0"'
~~~

## 安装验证

~~~bash
dash -c 'echo "$0"'
command -v dash
readlink -f /bin/sh
~~~

## 升级、卸载与冲突

由原包管理器升级和卸载。若系统 `/bin/sh` 指向 Dash，卸载前必须恢复到发行版支持的 Shell；用 `type -a dash` 排除 `/usr/local/bin` 中的旧构建。

## 官方资料

- [Dash 官方仓库](https://git.kernel.org/pub/scm/utils/dash/dash.git/)
- [Debian dash 软件包](https://packages.debian.org/dash)
- [Ubuntu DashShell 说明](https://wiki.ubuntu.com/DashAsBinSh)

资料核对日期：2026-08-27。
