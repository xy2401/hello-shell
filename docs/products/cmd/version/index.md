# CMD 版本演进

Windows 命令提示符（cmd.exe）源自 MS-DOS 与 Windows NT，以极高的企业向后兼容性著称。

## 版本索引

### [Windows 11 / Server 2022 CMD](./windows-11-server-2022-cmd)

- **发布时间：** 2021 年 10 月
- **版本重点：** 默认深度集成于现代化的 Windows Terminal 宿主环境。

### [Windows 10 CMD](./windows-10-cmd)

- **发布时间：** 2015 年 7 月
- **版本重点：** 控制台宿主（conhost）重构：原生支持 ANSI/VT100 虚拟终端控制转义序列（支持颜色与光标移动）。

### [Windows 2000 / NT 4.0 CMD](./windows-2000-nt-4.0-cmd)

- **发布时间：** 2000 年 2 月
- **版本重点：** 确立了现代批处理脚本的核心语法规则：setlocal enabledelayedexpansion 延迟变量展开。

## 延迟变量展开规则
- 在 `for` 循环或 `if` 嵌套块中修改变量时，必须声明 `setlocal enabledelayedexpansion` 并使用 `!var!` 引用变量，否则变量将在代码块解析时被静态提前求值。
