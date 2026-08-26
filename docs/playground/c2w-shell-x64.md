---
aside: false
pageClass: shell-runtime-page
---

# C2W: Shell (AMD64)

这是搭载了 **Nushell** 等重型现代终端的 x86_64/AMD64 架构全能环境。

<BrowserContainerWorkbench runtimeId="c2w-shell-x64" />

## 特性与环境

- **x64 独占支持**：因为像 Nushell 这样的由 Rust 编写的重量级现代 Shell 尚未在 Alpine 的 RISC-V 包库中提供，故本环境特别采用 AMD64 模拟执行。
- **完全横向对比**：包含了从最古老的 \`dash\` 到最流行的 \`zsh\`，再到最前卫的结构化终端 \`nu\`，可以在这一台容器里一秒切换，感受几十年的终端进化史。

## 常用操作

| 目标操作 | 命令 | 说明 |
| :--- | :--- | :--- |
| **启动 Nushell** | \`nu\` | 进入支持强类型和表格视图的新一代终端 |
| **文件探查** | \`ls \| where size > 1kb\` | 在 Nushell 中以数据表方式过滤文件 |
