# ash（BusyBox） 安装与切换

ash 通常作为 BusyBox 的 applet 交付，而不是单独的软件包。实际能力取决于 BusyBox 的编译配置；Alpine 的 `/bin/ash` 也由 BusyBox 提供。

- [BusyBox 官网](https://busybox.net/)
- [BusyBox 下载](https://busybox.net/downloads/)
- [BusyBox 文档](https://busybox.net/downloads/BusyBox.html)

## 推荐方式

在 Alpine、嵌入式 Linux 和 initramfs 中使用系统提供的 BusyBox。通用发行版只为兼容性测试安装 BusyBox，不要用它覆盖系统 `/bin/sh`。

## Linux

~~~bash
sudo apt update && sudo apt install busybox
sudo dnf install busybox
sudo pacman -S busybox
~~~

这些包由发行版维护。确认是否创建 `ash` 链接；没有时可用 `busybox ash` 进入 Shell。

## 源码与独立二进制

官方发布目录提供源码。不同构建可能启用或关闭 applet，比较版本时应同时保存 `busybox` 的版本和 `busybox --list` 输出。

## 版本切换

~~~bash
/usr/bin/busybox ash
/opt/busybox-1.36/busybox ash
~~~

版本切换通过 BusyBox 可执行文件路径完成；没有独立的 ash 版本管理器。不要用一个构建生成的 applet 链接指向另一个未知版本。

## Docker

~~~bash
docker run --rm alpine:3.22 /bin/ash -c 'busybox | head -n 1; echo "$0"'
~~~

## 安装验证

~~~bash
busybox | head -n 1
busybox ash -c 'echo "$0"'
busybox --list | grep -x ash
~~~

## 升级、卸载与冲突

通过发行版升级或卸载 BusyBox。嵌入式系统升级前保存配置和 applet 清单；若 `/bin/sh` 链接到 BusyBox，删除包可能破坏启动流程。

## 官方资料

- [BusyBox 官网](https://busybox.net/)
- [BusyBox 下载](https://busybox.net/downloads/)
- [BusyBox 文档](https://busybox.net/downloads/BusyBox.html)

资料核对日期：2026-08-27。
