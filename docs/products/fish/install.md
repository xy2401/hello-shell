# fish 安装与切换

fish 是独立的交互式 Shell，不追求 POSIX sh 语法兼容。安装后可以并行保留系统 Shell；脚本的 shebang 应明确写 fish。

- [fish 官网](https://fishshell.com/)
- [fish 文档](https://fishshell.com/docs/current/)
- [fish 发布页](https://github.com/fish-shell/fish-shell/releases)

## 推荐方式

优先采用 fish 官方文档列出的发行版软件包；macOS 使用 Homebrew。Windows 原生环境不是主要目标，建议 WSL。

## Linux 与 macOS

~~~bash
sudo apt update && sudo apt install fish
sudo dnf install fish
sudo pacman -S fish
brew install fish
~~~

上述系统仓库和 Homebrew 由各自维护者打包，版本可能晚于 fish 发布页。Ubuntu 需要更新版本时可按官方文档选择 fish-shell PPA。

## 登录 Shell

~~~bash
command -v fish
grep -Fx "$(command -v fish)" /etc/shells
chsh -s "$(command -v fish)"
~~~

不要把只接受 POSIX sh 的系统启动脚本改成 fish。

## 版本切换

版本切换没有官方专用工具。用系统包管理器选择发行版版本，或把源码构建安装到独立前缀；临时测试直接执行目标路径的 `fish`，登录默认值由 `chsh` 管理。

## Docker

~~~bash
docker run --rm alpine:3.22 sh -lc 'apk add --no-cache fish >/dev/null && fish --version'
~~~

## 安装验证

~~~fish
fish --version
type -a fish
status fish-path
~~~

## 升级、卸载与冲突

升级、卸载使用最初的包管理器。若 fish 是登录 Shell，卸载前先切回 `/bin/sh`、Bash 或 Zsh；配置位于 `~/.config/fish`，不要在卸载包时顺手删除个人配置。

## 官方资料

- [fish 官网](https://fishshell.com/)
- [fish 文档](https://fishshell.com/docs/current/)
- [fish 发布页](https://github.com/fish-shell/fish-shell/releases)

资料核对日期：2026-08-27。
