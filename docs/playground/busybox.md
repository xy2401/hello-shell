---
aside: false
pageClass: shell-runtime-page
---

# BusyBox 工作台

本页通过 Wasmer SDK 运行官方预编译的 **BusyBox WASI** 模块，单文件仅约 1 MB，提供正统的 C 语言 `ash` Shell 与 100+ 个标准 POSIX 核心工具。

<BrowserBusyboxWorkbench />

## 特性与能力边界

- **正统 POSIX C 语言实现**：真实 BusyBox 二进制编译，输出行为与返回值 100% 遵循 C 语言标准。
- **极致轻量**：仅约 1 MB 传输体积，毫秒级冷启动。
- **包含常用工具集**：内置 `ash`、`sed`、`awk`、`grep`、`tr`、`tar`、`find`、`cut`、`xargs`、`uname` 等经典 Unix 工具。

---

*其他工作台*：[JUST-BASH](./just-bash) · [WebContainer](./webcontainer) · [Pyodide](./pyodide) · [V86](./v86) · [container2wasm](./container2wasm)
