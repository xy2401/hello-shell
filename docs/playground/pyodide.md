---
aside: false
pageClass: shell-runtime-page
---

# Pyodide 工作台

本页通过 Python 官方维护的 **Pyodide (CPython 3.12 WebAssembly)** 运行时，直接在浏览器中提供原生 Python 3.12 的 `>>> ` 交互式 REPL 终端。

<BrowserPythonWorkbench />

## 特性与能力边界

- **官方标准 CPython 3.12**：遵循真实 Python 解释器行为，内置标准库（`sys`、`os`、`json`、`re`、`math` 等）。
- **Shell vs Python 横向对照**：配合本站「9 个任务的 Shell vs Python 对照矩阵」，直接在终端中验证 Python 的环境配置、变量展开、数据结构与异常处理。
- **无需 Linux 虚拟机**：直接以语言级 WASM 运行，比完整 Linux 虚拟机更轻快、更专注。

---

*其他工作台*：[JUST-BASH](./just-bash) · [BusyBox](./busybox) · [WebContainer](./webcontainer) · [V86](./v86) · [container2wasm](./container2wasm)
