# 快速上手

> 本页结论：克隆仓库 → `npm install` → `npm run docs:dev` 就能读全站；输出快照有两种采集方式：Linux 容器用 `npm run collect-outputs`，Windows 侧用 `pwsh scripts/collect-windows.ps1`（需 Windows 环境，没有就交给 GitHub Actions 的 collect-windows-outputs workflow）；读 demos 目录时，脚本与同名 `*.out.txt` 快照永远并排。

## 环境要求

- **Node.js ≥ 20**：文档站与采集脚本的入口（见 `package.json` 的 `engines`）。
- **Docker Engine**：Linux 侧实验与采集需要。
- **Windows**：可选。没有 Windows 机器也能拿到 Windows 侧快照——由 GitHub Actions 的 collect-windows-outputs workflow 采集后提交入库。

## 克隆与启动文档站

```bash
git clone https://github.com/xy2401/hello-shell.git
cd hello-shell
npm install          # 安装依赖
npm run docs:dev     # 本地打开文档站（默认 http://localhost:5173）
```

其他常用命令：

```bash
npm run docs:build   # 构建静态文档
npm run docs:preview # 预览构建产物
npm run check        # 静态检查 + 文档构建
```

## 两种采集方式

所有 `demos/**/*.out.txt` 都是「真跑出来的」，采集入口分平台：

### 1. Linux 容器采集：`npm run collect-outputs`

```bash
npm run collect-outputs
```

- 实际执行 `scripts/run-docker-demos.js`，在容器内运行 bash / zsh / fish / pwsh / python 的全部任务并刷新快照。
- 镜像按 [版本政策](/reference/version-policy) 做 tag+digest 双锁定，锁定值在仓库根目录 `.env.versions`。
- zsh 与 fish 无官方独立镜像，统一以 digest 锁定的 alpine 为基底、在 `demos/zsh/Dockerfile`、`demos/fish/Dockerfile` 内用 apk 安装。

### 2. Windows 采集：`pwsh scripts/collect-windows.ps1`

```powershell
pwsh scripts/collect-windows.ps1
```

- 需要 **Windows 环境**，原生运行 cmd / PowerShell 5 / PowerShell 7 三套任务。
- 没有 Windows 机器？把采集交给 GitHub Actions 的 **collect-windows-outputs** workflow：推送后由 windows-latest runner 运行并把快照提交入库。

## 如何读 demos 目录

**核心约定：脚本与输出快照并排。** 每个脚本旁边都有一个同名加 `.out.txt` 的真实输出快照。

```text
demos/
├── bash/   zsh/   fish/   pwsh/   python/      # Linux 侧（容器运行，快照已入库）
├── cmd/    powershell5/    powershell7/        # Windows 侧（runner 原生运行）
└── shared/fixtures/                            # 统一输入数据（各 shell 喂同一份数据）
```

每个 shell 目录内都是同一组 9 个统一任务（`00`–`08`）：

| 编号 | 任务 | 示例（bash） |
| --- | --- | --- |
| 00 | 环境 | `00_env.sh` + `00_env.sh.out.txt` |
| 01 | 输入输出 | `01_hello_io.sh` + `01_hello_io.sh.out.txt` |
| 02 | 变量与引用 | `02_variables_quoting.sh` + `02_variables_quoting.sh.out.txt` |
| 03 | 入参解析 | `03_args_parsing.sh` + `03_args_parsing.sh.out.txt` |
| 04 | 控制流 | `04_control_flow.sh` + `04_control_flow.sh.out.txt` |
| 05 | 函数与作用域 | `05_functions_scope.sh` + `05_functions_scope.sh.out.txt` |
| 06 | 管道与文件 | `06_pipes_files.sh` + `06_pipes_files.sh.out.txt` |
| 07 | 错误处理 | `07_errors.sh` + `07_errors.sh.out.txt` |
| 08 | 综合实战 | `08_real_world.sh` + `08_real_world.sh.out.txt` |

**推荐读法**：先读脚本（它做了什么）→ 再读并排的 `*.out.txt`（真实输出长什么样）→ 最后到[矩阵](/matrix/)看横向对照。想横向比较同一个任务，就把不同 shell 目录下同一编号的两个文件放在一起读，例如 `bash/03_args_parsing.sh.out.txt` 对 `powershell7/03_args_parsing.ps1.out.txt`。

