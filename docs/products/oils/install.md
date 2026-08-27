# Oils for Unix 安装与切换

Oils 同时提供兼容 Shell `osh` 与新语言 Shell `ysh`。官方以版本化 tarball 为主要交付物，适合安装到独立前缀。

- [Oils 获取指南](https://www.oilshell.org/release/latest/doc/getting-started.html)
- [Oils 发布目录](https://www.oilshell.org/release/)
- [Oils 安装说明](https://www.oilshell.org/release/latest/doc/INSTALL.html)

## 推荐方式

从官方发布目录选择明确版本的二进制 tarball；源码构建只在平台没有合适制品时使用。不要把 `osh` 直接替换成系统 `/bin/sh`。

## Linux 与 macOS

~~~bash
tar -xzf oils-for-unix-0.24.0.tar.gz
cd oils-for-unix-0.24.0
./configure --prefix=$HOME/.local/oils/0.24.0
_build/oils.sh
./install
~~~

文件名与校验值应从官方版本目录取得。系统仓库若提供 Oils，属于发行版维护，版本可能不同。

## Windows

没有受支持的原生 Windows 安装流程；使用 WSL。不要把 MSYS2 行为等同于官方 Linux 构建。

## 版本切换

~~~bash
$HOME/.local/oils/0.24.0/bin/osh --version
$HOME/.local/oils/0.24.0/bin/ysh --version
PATH=$HOME/.local/oils/0.24.0/bin:$PATH ysh
~~~

版本化前缀就是切换边界；Oils 没有官方版本管理器。

## Docker

~~~bash
docker run --rm debian:bookworm-slim sh -lc 'echo "Oils 无独立官方镜像；请挂载已校验的发布制品"'
~~~

项目没有正式运行镜像。容器只能提供隔离的构建环境，不能用未固定的第三方镜像替代官方 tarball。

## 安装验证

~~~bash
osh --version
ysh --version
command -v osh ysh
~~~

## 升级、卸载与冲突

升级时新增一个版本目录并回归脚本，再调整 PATH；回滚只需恢复旧路径。卸载删除对应前缀即可，先确认 shebang 和登录配置没有引用它。

## 官方资料

- [Oils 获取指南](https://www.oilshell.org/release/latest/doc/getting-started.html)
- [Oils 发布目录](https://www.oilshell.org/release/)
- [Oils 安装说明](https://www.oilshell.org/release/latest/doc/INSTALL.html)

资料核对日期：2026-08-27。
