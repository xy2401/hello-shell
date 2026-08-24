---
aside: false
pageClass: shell-runtime-page
---

# JUST-BASH 工作台

这是基于 `just-bash` 在当前浏览器内存中运行的 Bash 语法沙箱。命令、管道和临时文件都在内存沙箱中处理，不会发送到命令执行服务器，也不能访问你的电脑文件。

<BrowserBashWorkbench />

## 能力边界

- 支持 Bash 语法、变量、引号、管道、重定向、条件、循环、函数，以及 `grep`、`sed`、`awk`、`jq` 等常见工具。
- 每次回车是一次独立执行；沙箱文件会在命令之间保留，`cd`、变量和函数等进程状态不会跨命令保留。
- 文件系统属于本次运行；刷新页面或重置终端后恢复干净环境。
- 它是 TypeScript 实现的 Bash 兼容解释器，不是 GNU Bash 或 Linux 内核，也不支持 systemd、Docker、宿主设备或任意原生 ELF 程序。
- 首次打开会下载锁定的 `just-bash@3.4.2` 浏览器代码，后续由浏览器缓存。

其他工作台：[BusyBox](./busybox) · [Pyodide](./pyodide) · [V86](./v86) · [container2wasm](./container2wasm)。
