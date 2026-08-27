# PowerShell 7.6 LTS

> **参考官方文档**：[PowerShell 官方发布说明](https://learn.microsoft.com/powershell/scripting/whats-new/what-s-new-in-powershell-76)  
> 本页依据正式 Release 与现有仓库版本证据，整理 PowerShell 7.6 LTS 的关键变化、兼容边界和升级检查。

## 版本定位

- **发布时间：** 2026 年 8 月
- **维护状态：** 截至 2026-08-27 的当前重要版本线
- **产品线：** PowerShell

## 核心变化

- 进入新的 LTS 支持线并更新到现代 .NET 运行时
- 改进引擎、补全、AppContainer 与诊断行为
- 继续修正脚本调用、SSH 子进程与平台集成差异

## 兼容与迁移

- 从 7.4 LTS 升级时应验证二进制模块、远程会话、配置文件和宿主 API，不以 Windows PowerShell 5.1 的行为作为兼容基线。

## 版本确认

不要根据安装包名称或容器标签推断实际版本，应在目标环境执行：

```bash
pwsh --version
```

生产记录至少应包含完整版本输出、操作系统或运行时基线、架构，以及所用客户端或驱动版本。

## 官方资料

- [PowerShell 官方发布说明](https://learn.microsoft.com/powershell/scripting/whats-new/what-s-new-in-powershell-76)

资料核对日期：2026-08-27。
