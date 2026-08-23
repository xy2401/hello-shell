# PowerShell 版本演进

PowerShell 是基于 .NET 构建的现代化面向对象命令行与脚本框架。已从传统的 Windows 专有工具演进为全平台开源工具。

## 核心版本演进与关键里程碑

### PowerShell 7.4 LTS（2023 年 11 月）

**主要功能与架构演进：**

- 基于 **.NET 8 LTS** 构建，启动与执行性能显著提升
- PSReadLine 引入增强的预测补全（Predictive IntelliSense），支持基于历史记录与插件的命令补全提示
- 引入空合并赋值操作符（`$a ??= $b`）与三元操作符优化

**工程影响与选型建议：**

> 当前生产环境跨平台自动化与服务器管理首选的长期支持基准。

### PowerShell 7.2 LTS（2021 年 11 月）

**主要功能与架构演进：**

- 基于 **.NET 6 LTS** 构建，引入 ANSI 终端彩色文本（`$PSStyle`）控制
- 通过 Microsoft Update 提供无缝跨版本自动更新通道

**工程影响与选型建议：**

> 跨平台云运维的重要稳定版本。

### PowerShell 7.0（2020 年 3 月）

**主要功能与架构演进：**

- 正式统一 Windows PowerShell 5.1 与 PowerShell Core 6.x，实现模块高度兼容
- 引入流水线并行处理参数：`ForEach-Object -Parallel`，轻松实现多线程并发任务处理
- 引入流水线链式操作符（`&&` 和 `||`）

**工程影响与选型建议：**

> PowerShell 现代化发展的终极里程碑。

### PowerShell Core 6.0（2018 年 1 月）

**主要功能与架构演进：**

- 基于 .NET Core 正式实现**跨平台开源（Linux / macOS / Windows）**
- 执行程序名统一变更为 `pwsh`（替代历史专有的 `powershell.exe`）

**工程影响与选型建议：**

> 打破 Windows 生态边界，跨入跨平台自动化时代。

### Windows PowerShell 5.1（2016 年 8 月）

**主要功能与架构演进：**

- Windows 10 / Windows Server 2016 内置的经典版本
- 全面支持面向对象 `class` 类定义关键字与 DSC（Desired State Configuration）

**工程影响与选型建议：**

> Windows 经典时代的终极版本，现已进入长期维护状态。

## 升级与命令调用注意
- 跨平台现代脚本请统一调用 **`pwsh`**（PowerShell 7+），而不是调用 Windows 专有且停止功能更新的 `powershell.exe`（Windows PowerShell 5.1）。
