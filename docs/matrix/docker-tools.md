# Docker 与原生命令工具矩阵

| 产品 | 证据环境 | 命令来源 | 检查 | 执行 | 限制 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| bash | 锁定 bash 镜像 | builtins + PATH | `bash -n` | `bash script.sh` | Linux 容器 |
| zsh | Alpine 自建镜像 | builtins + `/bin`、`/usr/bin` | `zsh -n` | `zsh script.zsh` | 无官方独立镜像 |
| fish | Alpine 自建镜像 | builtins + `/bin`、`/usr/bin` | `fish --no-execute` | `fish script.fish` | 无官方独立镜像 |
| PowerShell | Linux 容器 PS7 + Windows runner PS5/PS7 | Cmdlet、Function、Application | Parser / ScriptAnalyzer | `pwsh -File` | PS5 仅 Windows 原生 |
| cmd | Windows runner | builtins + System32 PATH | `cmd /d /c` | `cmd /d /c script.bat` | 不存在 Linux Docker 运行体 |

完整工具清单将 builtins 与外部 executable 分开统计；现有 9 个统一任务快照继续作为行为证据。
