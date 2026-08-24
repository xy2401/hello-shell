---
aside: false
pageClass: shell-runtime-page
---

# WebContainer 工作台

本页通过 StackBlitz 官方 **WebContainer API** 在当前浏览器标签页内直接运行一个完整的 Node.js 微系统与 `jsh`（JavaScript Shell）终端。

<BrowserWebContainerWorkbench />

## 特性与能力边界

- **极速冷启动**：纯 WebAssembly 驱动，体积仅约 1~2 MB，启动耗时小于 0.5 秒。
- **Node.js 完整工具链**：内置原生 `node` 解释器、`npm` 包管理器与 `npx`，可在浏览器内即时安装 NPM 依赖包。
- **虚拟文件系统 (VFS)**：支持标准 POSIX 文件操作（`ls`、`cat`、`mkdir`、`cp`、`rm`）与管道重定向。
- **本地开发服务器**：支持在终端中运行 Express、Vite 等 HTTP 服务器，并在浏览器中监听虚拟网络端口。

---

*其他工作台*：[JUST-BASH](./just-bash) · [BusyBox](./busybox) · [Pyodide](./pyodide) · [V86](./v86) · [container2wasm](./container2wasm)
