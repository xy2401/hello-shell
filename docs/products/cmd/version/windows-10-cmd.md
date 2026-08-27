# Windows 10 CMD

> **参考官方文档**：[Windows CMD 官方发布说明](https://learn.microsoft.com/windows-server/administration/windows-commands/cmd)  
> 本页依据正式 Release 与现有仓库版本证据，整理 Windows 10 CMD 的关键变化、兼容边界和升级检查。

## 版本定位

- **发布时间：** 2015 年 7 月
- **维护状态：** 历史版本或兼容基线；实际维护状态以官方页面为准
- **产品线：** Windows CMD

## 核心变化

**主要功能与架构演进：**

- 控制台宿主（conhost）重构：原生支持 ANSI/VT100 虚拟终端控制转义序列（支持颜色与光标移动）
- 原生支持 Ctrl+C / Ctrl+V 标准快捷键复制粘贴与窗口自由缩放折行

**工程影响与选型建议：**

> 告别了数十年无法方便复制粘贴与无彩色的历史。

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
