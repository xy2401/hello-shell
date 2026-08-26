---
aside: false
pageClass: shell-runtime-page
---

# c2w-shell (全能版)

本页提供一个集成了主流 Shell 与 Python 环境的全能版容器，非常适合用于横向对比语法差异。

<BrowserContainerWorkbench runtimeId="c2w-shell" />

## 特性与环境

- **全家桶体验**：容器内预装了 **Bash**, **Zsh**, **Fish**, **Elvish**, **Dash**, 以及 **Python 3 / Pip**，一站式解决实验需求。
- **丰富的 Unix 工具链**：内置 `jq`、`curl`、`tree`、`grep`、`sed` 等。

## 常用操作

| 目标操作 | 命令 | 说明 |
| :--- | :--- | :--- |
| **切换为 Bash** | `exec bash -l` | 进入登录 Bash 环境 |
| **切换为 Zsh** | `exec zsh -l` | 进入 Zsh 环境 |
| **启动 Python** | `python3` | 进入 Python 交互解释器 |
