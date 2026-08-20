# 版本政策

> 本页结论：Linux 侧镜像一律「tag+digest 双锁定、禁止 latest/edge/nightly」，锁定值提交在 `.env.versions`；zsh 与 fish 无官方独立镜像，统一以 digest 锁定的 alpine 为基底 apk 安装；Windows 侧（cmd / PowerShell 5 / PowerShell 7）无镜像可锁，用 `demos/<shell>/00_env.*.out.txt` 快照留痕，并接受 windows-latest runner 的版本漂移风险；升级走「改 `.env.versions` → 重跑采集 → 审查差异 → 更新文档」四步。

## 锁定规则

1. **tag+digest 双锁定**。只写 tag 不够——tag 会被上游原地覆盖。必须同时钉住 digest，保证拉到的字节完全一致。digest 为**多架构 manifest index** 的 digest，经 `docker buildx imagetools inspect` 实测。
2. **禁止 latest / edge / nightly** 等浮动标签。任何浮动标签都不得出现在 `.env.versions`、Dockerfile、workflow 中。
3. **锁定值集中入库**。所有镜像锁定写在仓库根目录 `.env.versions`，随仓库提交，采集脚本与 workflow 统一从这里读取。

## 当前锁定表（checkedAt: 2026-08-20）

下表与 `.env.versions` 一一对应，版本号以该文件为准。

| 变量 | 锁定值 | 用途 |
| --- | --- | --- |
| `BASH_IMAGE` | `bash:5.2@sha256:3bee76a96d86d5d2d5efc7c1c570e5a7c95db22348a26944e0e546fa174e3324` | bash 运行体 |
| `ALPINE_IMAGE` | `alpine:3.22@sha256:14358309a308569c32bdc37e2e0e9694be33a9d99e68afb0f5ff33cc1f695dce` | zsh 与 fish 的基底（apk 安装） |
| `POWERSHELL_IMAGE` | `mcr.microsoft.com/powershell:7.5-debian-12@sha256:7ab5bd5ca6f95a3351fa0c6a1205237d57048c94542355aab55519a0861a9b25` | PowerShell 7（Linux，pwsh 运行体） |
| `PYTHON_IMAGE` | `python:3.12-slim@sha256:2c941e860699f878900b0edc2403613c234d4b32eda3cc9fa7036991a2a63c4a` | Python 对照组 |

对应运行体版本：**bash 5.2、alpine 3.22（zsh、fish 的基底）、PowerShell 7.5-debian-12、python 3.12-slim**。

zsh 与 fish 无官方独立镜像，统一以 digest 锁定的 alpine 为基底，分别在 `demos/zsh/Dockerfile`、`demos/fish/Dockerfile` 内 `apk add` 安装；实际装到的版本以对应 `00_env` 快照为准。

## Windows 侧：无镜像可锁

cmd / PowerShell 5 / PowerShell 7 使用 GitHub **windows-latest runner 内置运行体**，没有可锁的镜像：

- 版本以 `demos/<shell>/00_env.*.out.txt` 快照留痕（`demos/cmd/`、`demos/powershell5/`、`demos/powershell7/` 各自的 `00_env`）。
- **漂移风险**：windows-latest runner 的内置运行体版本会随 GitHub 更新而变化，快照可能随下次采集漂移。读取 Windows 侧结论时，请以最近一次 `00_env` 快照为准。
- 采集方式与「待首次采集」的标注规则见[证据政策](/reference/evidence-policy)。

## 升级流程

锁定要升级时，严格走四步，避免「版本变了但结论没跟上」：

1. **更新 `.env.versions`**：替换为新 tag 并重新实测 digest，同时更新 `checkedAt` 日期。
2. **重跑采集**：`npm run collect-outputs`（Linux）；Windows 侧经 collect-windows-outputs workflow 重跑。
3. **审查输出差异**：逐条 `git diff demos/**/*.out.txt`，确认行为变化是「预期内升级」还是「需要记录的差异」。
4. **更新文档**：把受影响的分卷页、矩阵页、本页锁定表一并更新，保持结论与新输出一致。
