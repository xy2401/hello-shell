# Nushell 安装与切换

Nushell（`nu`）以结构化数据管道为核心，和 POSIX Shell 的文本管道不同。官方提供预编译制品、Cargo 以及多个包管理器入口。

- [Nushell 安装](https://www.nushell.sh/book/installation.html)
- [Nushell 发布页](https://github.com/nushell/nushell/releases)
- [Nushell 配置](https://www.nushell.sh/book/configuration.html)

## 推荐方式

先选官方发布制品或官方安装页列出的包管理器；需要固定编译特性时使用 Rust/Cargo。包管理器渠道的维护主体和更新节奏不同。

## Windows、macOS 与 Linux

~~~powershell
winget install nushell             # Windows，WinGet 社区清单
scoop install nu                    # Windows，Scoop 社区维护
brew install nushell                # macOS，Homebrew 社区维护
sudo apt install nushell            # 配置官方页列出的 Gemfury 仓库后
sudo dnf install nushell            # 配置官方页列出的 Gemfury 仓库后
~~~

## Cargo

~~~bash
cargo install nu --locked
~~~

Cargo 会编译本机版本并安装到 `~/.cargo/bin`；先确认 Rust 工具链和系统依赖。固定旧版本时使用 `cargo install nu --version 0.115.0 --locked`。

## 版本切换

~~~bash
/opt/nu-0.115/bin/nu --version
PATH=/opt/nu-0.115/bin:$PATH nu --version
~~~

Nu 没有官方多版本管理器。预编译制品可解压到版本化目录，通过绝对路径或 PATH 切换；配置格式升级前应备份 `$nu.config-path`。

## Docker

~~~bash
docker run --rm ghcr.io/nushell/nushell:0.115.0-alpine nu --version
~~~

## 安装验证

~~~nu
version
which nu
$nu.current-exe
~~~

## 升级、卸载与冲突

用原渠道升级或卸载，避免 WinGet、Scoop、Cargo 与手工解压同时提供 `nu`。运行 `which nu --all` 检查遮蔽；跨大版本升级先阅读发布说明并验证配置。

## 官方资料

- [Nushell 安装](https://www.nushell.sh/book/installation.html)
- [Nushell 发布页](https://github.com/nushell/nushell/releases)
- [Nushell 配置](https://www.nushell.sh/book/configuration.html)

资料核对日期：2026-08-27。
