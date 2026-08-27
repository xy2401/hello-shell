# Windows 11 / Server 2022 CMD

> **参考官方文档**：[Windows CMD 官方发布说明](https://learn.microsoft.com/windows-server/administration/windows-commands/cmd)  
> 本页依据正式 Release 与现有仓库版本证据，整理 Windows 11 / Server 2022 CMD 的关键变化、兼容边界和升级检查。

## 版本定位

- **发布时间：** 2021 年 10 月
- **维护状态：** 截至 2026-08-27 的当前重要版本线
- **产品线：** Windows CMD

## 核心变化

**主要功能与架构演进：**

- 默认深度集成于现代化的 **Windows Terminal** 宿主环境
- 改进 UTF-8 代码页（`chcp 65001`）环境下的中英文字符显示与输入法兼容性

**工程影响与选型建议：**

> 终端显示体验向现代终端标准看齐。

## 兼容与迁移

- 在目标版本运行语法检查和真实脚本回归，覆盖展开、管道、重定向、陷阱与退出码。
- 分别验证交互配置和非交互脚本；不要从登录 Shell 推断 `/bin/sh` 的实际实现。
- 部署脚本应明确最低版本，并为系统自带旧版本保留兼容路径。

## 版本确认

不要根据安装包名称或容器标签推断实际版本，应在目标环境执行：

```bash
cmd /c ver
```

生产记录至少应包含完整版本输出、操作系统或运行时基线、架构，以及所用客户端或驱动版本。

## 官方资料

- [Windows CMD 官方发布说明](https://learn.microsoft.com/windows-server/administration/windows-commands/cmd)

资料核对日期：2026-08-27。
