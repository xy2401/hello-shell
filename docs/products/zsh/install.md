# Zsh 安装与切换

Zsh 由操作系统仓库和项目源码分发；macOS 已将它作为默认交互式 Shell，但系统版本仍随 macOS 更新。框架和主题不是 Zsh 本体。

- [Zsh 官网](https://www.zsh.org/)
- [Zsh 源码与发布](https://zsh.sourceforge.io/Arc/source.html)
- [Zsh 文档](https://zsh.sourceforge.io/Doc/)

## 推荐方式

Linux 使用发行版包，macOS 可保留系统 Zsh，确需较新版本再用 Homebrew。先装好 Zsh 本体并验证，再安装 Oh My Zsh 等第三方配置。

## 系统软件包

~~~bash
sudo apt update && sudo apt install zsh
sudo dnf install zsh
sudo pacman -S zsh
brew install zsh
~~~

## 设为登录 Shell

~~~bash
command -v zsh
grep -Fx "$(command -v zsh)" /etc/shells
chsh -s "$(command -v zsh)"
~~~

重新登录后用 `ps -p $$ -o comm=` 检查实际父 Shell；`$SHELL` 只表示账户配置，不保证当前进程已经切换。

## 版本切换

~~~bash
/bin/zsh --version
/opt/homebrew/bin/zsh --version
exec /opt/homebrew/bin/zsh -l
~~~

没有官方版本管理器。系统版与 Homebrew 版可并存，切换由绝对路径、`PATH` 和 `chsh` 控制。

## Docker

~~~bash
docker run --rm alpine:3.22 sh -lc 'apk add --no-cache zsh >/dev/null && zsh --version'
~~~

Zsh 没有官方独立镜像，这里使用明确版本的 Alpine 并由其仓库安装。

## 安装验证

~~~bash
zsh --version
command -v zsh
zsh -fc 'print -r -- $ZSH_VERSION'
~~~

## 升级、卸载与冲突

用原包管理器升级和卸载。删除旧版本前先把账户登录 Shell 改回仍存在的路径，并检查 `/etc/shells`、`type -a zsh` 与终端应用的启动命令。

## 官方资料

- [Zsh 官网](https://www.zsh.org/)
- [Zsh 源码与发布](https://zsh.sourceforge.io/Arc/source.html)
- [Zsh 文档](https://zsh.sourceforge.io/Doc/)

资料核对日期：2026-08-27。
