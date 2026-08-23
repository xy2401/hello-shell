---
aside: false
pageClass: shell-runtime-page
---

# 浏览器 Linux 工作台

本页使用 v86 在浏览器内模拟一台 x86 PC，并启动真实的精简 Buildroot Linux 内核。BIOS、v86 WebAssembly 和 9.6 MB 系统镜像全部随本站静态托管。

<BrowserLinuxWorkbench />

## 能力边界

- 这是实际启动的 Linux 内核，可观察启动日志、目录结构、进程和 BusyBox 命令。
- 虚拟机分配 64 MB 内存，只提供串口终端，不加载桌面环境。
- 当前镜像不连接公网，关闭或刷新页面后内存状态消失。
- x86 模拟比原生 WebAssembly Bash 更慢；只学习 Bash 时优先使用[浏览器 Bash 工作台](./bash)。

镜像来自 v86 官方测试资产 `buildroot-bzimage68.bin`，运行时固定为 `v86@0.5.441`。
