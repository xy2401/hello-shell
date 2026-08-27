# PowerShell 版本演进

PowerShell 是基于 .NET 构建的现代化面向对象命令行与脚本框架。已从传统的 Windows 专有工具演进为全平台开源工具。

## 版本索引

### [PowerShell 7.6 LTS](./powershell-7.6)

- **发布时间：** 2026 年 8 月
- **版本重点：** 进入新的 LTS 支持线并更新到现代 .NET 运行时。

### [PowerShell 7.4 LTS](./powershell-7.4)

- **发布时间：** 2023 年 11 月
- **版本重点：** 基于 .NET 8 LTS 构建，启动与执行性能显著提升。

### [PowerShell 7.2 LTS](./powershell-7.2)

- **发布时间：** 2021 年 11 月
- **版本重点：** 基于 .NET 6 LTS 构建，引入 ANSI 终端彩色文本（$PSStyle）控制。

### [PowerShell 7.0](./powershell-7.0)

- **发布时间：** 2020 年 3 月
- **版本重点：** 正式统一 Windows PowerShell 5.1 与 PowerShell Core 6.x，实现模块高度兼容。

### [PowerShell Core 6.0](./powershell-core-6.0)

- **发布时间：** 2018 年 1 月
- **版本重点：** 基于 .NET Core 正式实现跨平台开源（Linux / macOS / Windows）。

### [Windows PowerShell 5.1](./windows-powershell-5.1)

- **发布时间：** 2016 年 8 月
- **版本重点：** Windows 10 / Windows Server 2016 内置的经典版本。

## 升级与命令调用注意
- 跨平台现代脚本请统一调用 **`pwsh`**（PowerShell 7+），而不是调用 Windows 专有且停止功能更新的 `powershell.exe`（Windows PowerShell 5.1）。
