---
aside: false
pageClass: shell-runtime-page
---

# C2W: Shell (RISC-V)

本页通过 **\`container2wasm\`** 技术加载为 RISC-V 架构优化的超轻量多 Shell 集合环境。

<BrowserContainerWorkbench runtimeId="c2w-shell" />

## 特性与环境

- **原生极速加载**：去除了所有笨重组件，专为 WebAssembly 的 RISC-V 虚拟机打造，保证在浏览器中的极限启动速度。
- **经典 Shell 矩阵**：内置了原生支持 RISC-V 的各种流行 Shell：**Bash**、**Zsh**、**Fish**、**Elvish** 和极简的 **Dash**。
- **纯粹终端体验**：移除了 Python 环境和重型编辑器，仅依靠轻量级的 \`vi\` (Busybox) 来查看和编辑文件。

## 常用操作

| 目标操作 | 命令 | 说明 |
| :--- | :--- | :--- |
| **切换为 Zsh** | \`exec zsh -l\` | 进入 Zsh 环境 |
| **切换为 Fish** | \`exec fish\` | 进入现代高亮终端 |
| **切换为 Elvish**| \`exec elvish\` | 进入支持数据结构的函数式 Shell |
