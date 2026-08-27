# Elvish 安装与切换

Elvish 是单一可执行文件 Shell。官方提供 GitHub Releases 二进制，也支持从 Go 源码构建；系统包通常由社区维护。

- [Elvish 获取与安装](https://elv.sh/get/)
- [Elvish 发布页](https://github.com/elves/elvish/releases)
- [Elvish 学习文档](https://elv.sh/learn/)

## 推荐方式

优先下载官方发布页中与系统架构匹配的固定版本二进制。Homebrew、Scoop 或发行版包更方便，但应接受其更新节奏由维护者决定。

## 包管理器与源码

~~~bash
brew install elvish                 # Homebrew 社区维护
scoop install elvish                # Scoop 社区维护
go install src.elv.sh/cmd/elvish@v0.21.0
~~~

## 登录 Shell

~~~bash
command -v elvish
grep -Fx "$(command -v elvish)" /etc/shells
chsh -s "$(command -v elvish)"
~~~

先在普通终端完成启动测试，再更改登录 Shell。

## 版本切换

版本切换通过版本化目录或 `GOBIN` 完成，没有官方版本管理器。把不同版本放入例如 `/opt/elvish/0.21.0/`，用绝对路径启动，避免反复覆盖同一个 `~/go/bin/elvish`。

## Docker

~~~bash
docker run --rm golang:1.22-alpine sh -lc 'go install src.elv.sh/cmd/elvish@v0.21.0 && /go/bin/elvish -version'
~~~

项目没有独立官方运行镜像；此处只用固定 Go 基础镜像编译验证。

## 安装验证

~~~bash
elvish -version
command -v elvish
~~~

## 升级、卸载与冲突

二进制安装以替换文件升级；Go 安装重新执行带明确 tag 的命令。卸载前若已设为登录 Shell，先用 `chsh` 切回系统 Shell，并清理 `/etc/shells` 中失效路径。

## 官方资料

- [Elvish 获取与安装](https://elv.sh/get/)
- [Elvish 发布页](https://github.com/elves/elvish/releases)
- [Elvish 学习文档](https://elv.sh/learn/)

资料核对日期：2026-08-27。
