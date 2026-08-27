# Murex 安装与切换

Murex 是跨平台 Shell，官方提供预编译二进制与 Go 构建方式。Homebrew、MacPorts、AUR 等属于相应社区渠道。

- [Murex 安装](https://nojs.murex.rocks/INSTALL.html)
- [Murex 下载](https://nojs.murex.rocks/DOWNLOAD.html)
- [Murex 发布页](https://github.com/lmorg/murex/releases)

## 推荐方式

优先使用官方发布二进制；macOS 可用 Homebrew，Arch 可用 AUR。Windows 使用官方 ZIP/发布制品，注意其终端与 POSIX 命令兼容限制。

## 包管理器与源码

~~~bash
brew install murex                  # Homebrew 社区维护
yay -S murex                        # Arch AUR，社区维护
go install github.com/lmorg/murex@v7.2.1001
~~~

## 路径

官方压缩包解压后把 `murex`（Windows 为 `murex.exe`）放入用户级工具目录，再将该目录加入 PATH。不要从不明脚本下载并以管理员权限执行。

## 版本切换

没有官方版本管理器。保留版本化目录并用绝对路径调用；Go 构建使用明确 tag 和独立 `GOBIN`，然后由项目启动脚本选择。

## Docker

~~~bash
docker run --rm golang:1.22-alpine sh -lc 'go install github.com/lmorg/murex@v7.2.1001 && /go/bin/murex -version'
~~~

无独立官方容器镜像，这只是编译和版本输出检查。

## 安装验证

~~~bash
murex -version
command -v murex
~~~

## 升级、卸载与冲突

包管理器安装由对应工具升级、卸载；手工二进制直接替换或移除。用 `type -a murex`/`Get-Command murex -All` 排查旧文件遮蔽。

## 官方资料

- [Murex 安装](https://nojs.murex.rocks/INSTALL.html)
- [Murex 下载](https://nojs.murex.rocks/DOWNLOAD.html)
- [Murex 发布页](https://github.com/lmorg/murex/releases)

资料核对日期：2026-08-27。
