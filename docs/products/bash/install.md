# Bash 安装与切换

Bash 在多数 Linux 发行版中已预装。需要可控版本时，优先使用发行版软件包或 GNU 官方源码；Windows 上建议在 WSL 中使用，而不是把 MSYS2/Git Bash 当作完整 Linux 环境。

- [GNU Bash](https://www.gnu.org/software/bash/)
- [GNU Bash 下载](https://ftp.gnu.org/gnu/bash/)
- [GNU Bash 编译安装](https://www.gnu.org/software/bash/manual/html_node/Installing-Bash.html)

## 推荐方式

日常主机使用系统仓库，能够随操作系统获得安全更新。只有验证旧版语义或维护补丁时才从 GNU 发布目录取固定版本源码，并安装到独立前缀。

## Linux 与 macOS

~~~bash
sudo apt update && sudo apt install bash     # Debian / Ubuntu，发行版维护
sudo dnf install bash                        # Fedora / RHEL，发行版维护
sudo pacman -S bash                          # Arch，发行版维护
brew install bash                            # macOS，Homebrew 社区维护
~~~

macOS 自带的是 Apple 随系统交付的旧 Bash；Homebrew 的 Bash 通常位于 Apple Silicon 的 `/opt/homebrew/bin/bash` 或 Intel 的 `/usr/local/bin/bash`.

## 登录 Shell 与路径

~~~bash
command -v bash
grep -Fx "$(command -v bash)" /etc/shells
chsh -s "$(command -v bash)"
~~~

先确认新路径已列入 `/etc/shells`。不要在当前会话里直接删除仍被设为登录 Shell 的版本。

## 版本切换

~~~bash
/usr/bin/bash --version
/opt/bash-5.2/bin/bash --version
PATH=/opt/bash-5.2/bin:$PATH bash --version
~~~

Bash 没有官方版本管理器。并行安装时使用不同前缀，并通过绝对路径或项目启动脚本选择；`chsh` 只改变新登录会话的默认 Shell。

## Docker

~~~bash
docker run --rm bash:5.2 bash --version
~~~

这是仓库已锁定验证的明确版本线；复杂脚本证据仍在“Docker 验证”。

## 安装验证

~~~bash
bash --version
command -v bash
printf '%s\n' "$BASH_VERSION"
~~~

## 升级、卸载与冲突

发行版安装用同一包管理器升级或卸载。源码安装前记录 `--prefix`；不要用 `/usr/local/bin/bash` 覆盖 `/bin/bash`。检查 `type -a bash`，可发现 PATH 中同时存在的系统版、Homebrew 版和手工安装版。

## 官方资料

- [GNU Bash](https://www.gnu.org/software/bash/)
- [GNU Bash 下载](https://ftp.gnu.org/gnu/bash/)
- [GNU Bash 编译安装](https://www.gnu.org/software/bash/manual/html_node/Installing-Bash.html)

资料核对日期：2026-08-27。
