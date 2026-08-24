---
aside: false
pageClass: shell-runtime-page
---

# JUST-BASH

浏览器内的轻量 Bash 兼容解释器。无需服务器，适合快速验证脚本语法、管道和文本处理；它不会访问你的电脑文件。

<BrowserBashWorkbench />

## 运行模型

| 维度 | 实际行为 | 使用时的影响 |
| :--- | :--- | :--- |
| Bash 实现 | TypeScript 编写的 Bash 兼容解释器 | 适合学习语法，不等同于 GNU Bash |
| 命令会话 | 每次回车独立执行 | `cd`、变量和函数不会带到下一条命令 |
| 文件系统 | 沙箱文件在命令之间保留 | 可以连续执行 `touch`、`grep`、`sed`、`awk` 等文件操作 |
| 生命周期 | 刷新页面或重新启动后清空 | 不保存长期数据，也不能读取电脑文件 |
| 系统能力 | 没有 Linux 内核和原生进程 | 不支持 systemd、Docker、宿主设备或任意 ELF 程序 |

支持变量、引号、条件、循环、函数、管道与重定向，并内置 `grep`、`sed`、`awk`、`jq` 等常见工具。需要真实进程或多 Shell 对照时改用 [container2wasm](./container2wasm)，需要完整 Linux 系统时改用 [V86](./v86)。
