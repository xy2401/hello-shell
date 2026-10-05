---
aside: false
pageClass: shell-runtime-page
---

# C2W: PowerShell Core

在浏览器里跑完整的 .NET PowerShell 运行时！

运行时由 [Hello WASM](https://wasm.2401.xyz/runtimes/) 维护，读取 `shell/powershell/amd64`；当前 gzip 下载量为 112.1 MiB。保留现有 AMD64 架构，打开页面只获取清单，点击启动才下载分片。

<BrowserContainerWorkbench runtimeId="c2w-powershell" />

## 特性与环境

- **跨平台微软力量**：基于 Alpine (AMD64) 的 PowerShell Core 容器镜像。它将完整的 .NET CLR 和 PowerShell 面向对象终端装进了浏览器里。
- **强类型对象管道**：告别纯文本流。在 PowerShell 中，所有命令传递的都是真正的 .NET 对象。

## 常用操作

| 目标操作 | 命令 | 说明 |
| :--- | :--- | :--- |
| **启动终端** | \`pwsh\` | 启动 PowerShell Core 交互环境 |
| **体验对象过滤** | \`Get-Process \| Where-Object CPU -gt 0\` | 感受真正的对象级命令管道 |
