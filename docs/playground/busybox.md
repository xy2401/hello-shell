---
aside: false
pageClass: shell-runtime-page
---

# BusyBox

本页通过纯本地 **WASI (WebAssembly System Interface)** 模块运行 BusyBox，体积仅约 600 KB，零外部云端依赖，提供正统的 C 语言 `ash` Shell 与 100+ 个标准 POSIX 核心工具。

<BrowserBusyboxWorkbench />

## 特性与能力边界

- **正统 POSIX C 语言实现**：真实 BusyBox 二进制编译，输出行为与返回值 100% 遵循 C 语言标准。
- **极致轻量且 100% 纯本地**：仅约 600 KB 打包体积，免外部网络与云端请求，毫秒级冷启动。
- **包含常用工具集**：内置 `ash`、`sed`、`awk`、`grep`、`tr`、`tar`、`find`、`cut`、`xargs`、`uname` 等经典 Unix 工具。

---

*其他工作台*：[JUST-BASH](./just-bash) · [Pyodide](./pyodide) · [V86](./v86) · [container2wasm](./container2wasm)
