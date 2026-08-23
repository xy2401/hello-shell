# hello-shell

> **Shell 与命令行统一任务矩阵：同一任务，八种写法，真实输出对照 (Shell & Command Line Task Matrix)**

`hello-shell` 是面向开发者与运维的 Shell 横向对比项目，属于 `hello-*` 系列开源学习矩阵（已落地 `hello-lang`、`hello-sql`、`hello-mq`，`hello-shell` 为第四块）。用同一组统一任务在 bash、zsh、fish、cmd、PowerShell 5、PowerShell 7（Windows/Linux）中分别实现并采集真实输出，解释「什么是内核、什么是 Shell、什么是 GUI」，并划清 Shell 脚本与图灵完备语言（Python 对照）的能力边界。

## 核心特色

- **统一任务矩阵**：9 个统一任务（环境/IO/变量引用/入参解析/控制流/函数/管道文本/错误处理/综合实战）× 8 个运行体，同一任务横向对照。
- **入参差异专题**：位置参数起点、脚本名占位、长短选项、带空格参数、展开时机——七种 Shell 的入参模型差异以真实输出为证。
- **双平台真实采集**：Linux 侧容器化运行（镜像 tag+digest 双锁定），Windows 侧（cmd / PowerShell 5 / PowerShell 7）由 windows-latest runner 原生运行，快照提交入库。
- **Shell vs Python 边界**：同一任务的 Python 对照实现，解释 Shell「方便但不适合/别扭」的场景（字符串、数据结构、跨平台、错误处理）。
- **概念地基**：内核（资源管理者）、Shell（命令解释器）、GUI（图形化 Shell）三层模型，Unix 与 Windows 两套分层对照。

## 目录结构

```text
hello-shell/
├── demos/                      # 统一任务脚本与输出快照（*.out.txt 与源码同目录）
│   ├── bash/  zsh/  fish/      # Linux Shell（zsh/fish 以 alpine Dockerfile 内装）
│   ├── pwsh/                   # PowerShell 7（Linux 容器）
│   ├── python/                 # 图灵完备语言对照组
│   ├── cmd/                    # Windows cmd（runner 原生）
│   ├── powershell5/            # Windows PowerShell 5.1（runner 内置）
│   ├── powershell7/            # PowerShell 7（Windows runner 预装）
│   └── shared/fixtures/        # 统一输入数据
├── docs/                       # VitePress 文档站（唯一文档入口）
│   ├── index.md                # 首页与统一语义骨架
│   ├── products/               # bash/ zsh/ fish/ cmd/ powershell/ 分卷
│   ├── matrix/                 # 横向对比大屏（入参/引号/通配/错误/可移植性）
│   ├── playground/             # 浏览器 Bash / Linux 工作台
│   └── reference/              # 快速上手、版本政策、证据政策
├── scripts/                    # run-docker-demos.js（Linux 采集）、collect-windows.ps1（Windows 采集）、check-project.js
├── .github/workflows/          # collect-docker-outputs / collect-windows-outputs / docs
├── .env.versions               # Linux 镜像 tag+digest 双锁定
└── package.json
```

## 环境要求

- Node.js ≥ 20（文档站与采集脚本入口）
- Docker Engine（Linux 侧实验与采集）
- Windows 侧实验由 GitHub Actions windows-latest runner 运行，无需本地 Windows

## 快速开始

```bash
npm install
npm run docs:dev          # 本地打开文档站
```

## 实验命令

```bash
npm run collect-outputs                 # Linux：容器内运行全部任务，刷新 *.out.txt
pwsh scripts/collect-windows.ps1        # Windows：原生运行 cmd/PS5/PS7 任务（需 Windows）
npm run check                           # 静态检查 + 文档构建
```

## 资源与安全提示

- 所有实验只读挂载 fixtures，写入仅发生在容器内 `/tmp` 或系统临时目录。
- Windows runner 内置运行体版本随 GitHub 更新漂移，以 `00_env.out.txt` 快照留痕（见版本政策）。

## License

Released under the MIT License.
