# rc 安装与切换

这里的 rc 指 Byron Rakitzis 的 Unix 移植版 Plan 9 rc。它是历史型项目，主要通过源码和少数发行版社区包获取。

- [rc 官方仓库](https://github.com/rakitzis/rc)
- [rc 发布页](https://github.com/rakitzis/rc/releases)
- [Plan 9 rc 手册](https://9p.io/magic/man2html/1/rc)

## 推荐方式

学习和兼容性验证优先在隔离目录从官方仓库的明确 tag 构建。发行版包可用于方便安装，但应记录其补丁集。

## 系统包与源码

~~~bash
sudo apt update && sudo apt install rc       # Debian / Ubuntu，发行版维护
brew install rc                            # Homebrew 社区维护
git clone --branch 1.7.4 --depth 1 https://github.com/rakitzis/rc.git
~~~

源码构建前阅读仓库 README；不同系统需要 yacc、readline 等开发依赖。

## 登录 Shell

不建议把 rc 直接设为生产账户的默认 Shell。确需使用时，先以绝对路径启动并检查启动文件、终端和 PATH，再按系统流程加入 `/etc/shells`。

## 版本切换

没有版本管理器。为每个 tag 使用独立源码树和安装前缀，例如 `/opt/rc/1.7.4/bin/rc`，由绝对路径选择。

## Docker

~~~bash
docker run --rm debian:bookworm-slim sh -lc 'apt-get update -qq && apt-get install -y -qq rc >/dev/null && rc -c "echo rc"'
~~~

无官方 rc 镜像；这里明确使用发行版包作语法烟雾测试。

## 安装验证

~~~bash
rc -c 'echo rc is running'
command -v rc
~~~

## 升级、卸载与冲突

发行版包由原工具升级卸载，源码安装按记录的前缀移除。由于项目发布频率低，升级前应检查本地补丁；PATH 中同名的 Plan 9 工具集命令也可能造成混淆。

## 官方资料

- [rc 官方仓库](https://github.com/rakitzis/rc)
- [rc 发布页](https://github.com/rakitzis/rc/releases)
- [Plan 9 rc 手册](https://9p.io/magic/man2html/1/rc)

资料核对日期：2026-08-27。
