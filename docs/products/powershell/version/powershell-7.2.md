# PowerShell 7.2 LTS

> **参考官方文档**：[PowerShell 官方发布说明](https://learn.microsoft.com/powershell/scripting/whats-new/overview)  
> 本页依据正式 Release 与现有仓库版本证据，整理 PowerShell 7.2 LTS 的关键变化、兼容边界和升级检查。

## 版本定位

- **发布时间：** 2021 年 11 月
- **维护状态：** 历史版本或兼容基线；实际维护状态以官方页面为准
- **产品线：** PowerShell

## 核心变化

**主要功能与架构演进：**

- 基于 **.NET 6 LTS** 构建，引入 ANSI 终端彩色文本（`$PSStyle`）控制
- 通过 Microsoft Update 提供无缝跨版本自动更新通道

**工程影响与选型建议：**

> 跨平台云运维的重要稳定版本。

## 兼容与迁移

- 在目标版本运行语法检查和真实脚本回归，覆盖展开、管道、重定向、陷阱与退出码。
- 分别验证交互配置和非交互脚本；不要从登录 Shell 推断 `/bin/sh` 的实际实现。
- 部署脚本应明确最低版本，并为系统自带旧版本保留兼容路径。

## 版本确认

不要根据安装包名称或容器标签推断实际版本，应在目标环境执行：

```bash
pwsh --version
```

生产记录至少应包含完整版本输出、操作系统或运行时基线、架构，以及所用客户端或驱动版本。

## 官方资料

- [PowerShell 官方发布说明](https://learn.microsoft.com/powershell/scripting/whats-new/overview)

资料核对日期：2026-08-27。
