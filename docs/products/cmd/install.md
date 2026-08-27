# CMD 安装与切换

CMD 的执行程序是 Windows 系统组件 `cmd.exe`，不是独立下载的软件。它随 Windows 版本和系统维护更新演进。

- [cmd 命令参考](https://learn.microsoft.com/windows-server/administration/windows-commands/cmd)
- [Windows 命令参考](https://learn.microsoft.com/windows-server/administration/windows-commands/windows-commands)
- [DISM 系统修复](https://learn.microsoft.com/windows-hardware/manufacture/desktop/repair-a-windows-image)

## 推荐方式

无需安装。使用 `%SystemRoot%\System32\cmd.exe`；如果文件损坏，应修复 Windows 组件存储，而不是从第三方网站下载 `cmd.exe`。

## Windows 组件检查

~~~batch
where cmd
%SystemRoot%\System32\cmd.exe /d /c ver
sfc /verifyonly
~~~

## 修复

~~~powershell
DISM /Online /Cleanup-Image /RestoreHealth
sfc /scannow
~~~

修复命令需要管理员终端，并会修改系统组件；这里只记录官方方法，不在文档构建中执行。

## 版本切换

版本切换不适用。CMD 版本跟随 Windows；需要复现旧行为时使用对应 Windows 虚拟机或 CI 镜像，不要替换系统目录中的可执行文件。

## Docker

Docker 不适用：Linux 容器没有 CMD，Windows 容器又依赖宿主内核与镜像许可。本站用 Windows 运行器的真实输出快照验证 CMD。

## 安装验证

~~~batch
ver
where cmd
echo %COMSPEC%
~~~

## 升级、卸载与冲突

升级和卸载不适用，Windows Update 负责维护。若 `where cmd` 的首项不是 `%SystemRoot%\System32\cmd.exe`，先排查 PATH 劫持、同名批处理和 `AutoRun` 注册表项。

## 官方资料

- [cmd 命令参考](https://learn.microsoft.com/windows-server/administration/windows-commands/cmd)
- [Windows 命令参考](https://learn.microsoft.com/windows-server/administration/windows-commands/windows-commands)
- [DISM 系统修复](https://learn.microsoft.com/windows-hardware/manufacture/desktop/repair-a-windows-image)

资料核对日期：2026-08-27。
