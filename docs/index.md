---
layout: home
hero:
  name: hello-shell
  text: Shell 与命令行统一任务矩阵
  tagline: 同一任务，八种写法，真实输出对照
  actions:
    - theme: brand
      text: 快速上手
      link: /guide/getting-started
    - theme: alt
      text: 内核 / Shell / GUI 是什么
      link: /guide/kernel-shell-gui
features:
  - title: 统一任务矩阵
    details: 9 个统一任务（环境 / IO / 变量引用 / 入参解析 / 控制流 / 函数 / 管道文本 / 错误处理 / 综合实战）× 8 个运行体，同一任务横向对照。
  - title: 双平台真实采集
    details: Linux 侧容器化运行（镜像 tag+digest 双锁定）；Windows 侧 cmd / PowerShell 5 / PowerShell 7 由 windows-latest runner 原生运行，快照提交入库。
  - title: 入参差异专题
    details: 位置参数起点、脚本名占位、长短选项、带空格参数、展开时机——各 Shell 的入参模型差异以真实输出为证。
  - title: Shell vs Python 边界
    details: 同一任务的 Python 对照实现，划清 Shell「方便但不适合 / 别扭」的场景：字符串、数据结构、跨平台、错误处理。
---

> 本页结论：hello-shell 用同一组统一任务在 bash、zsh、fish、cmd、PowerShell 5/7 与 Python 中分别实现，全部输出真实采集入库（`demos/**/*.out.txt`）——先读结论，再对输出，最后看代码。

## 快速开始

```bash
npm install              # 安装依赖（Node.js ≥ 20）
npm run docs:dev         # 本地打开文档站
npm run collect-outputs  # Linux：容器内重跑全部任务，刷新 demos/**/*.out.txt 快照
```

详见[快速上手](/guide/getting-started)。

## 八个运行体速览

| 运行体 | 平台 | 运行方式 | 版本留痕 |
| --- | --- | --- | --- |
| bash 5.2 | Linux | `bash:5.2` 镜像容器（tag+digest 双锁） | `demos/bash/00_env.sh.out.txt` |
| zsh 5.9 | Linux | alpine 3.22 基底，Dockerfile 内 `apk add zsh` | `demos/zsh/00_env.zsh.out.txt` |
| fish 4.0 | Linux | alpine 3.22 基底，Dockerfile 内 `apk add fish` | `demos/fish/00_env.fish.out.txt` |
| PowerShell 7（pwsh） | Linux | `mcr.microsoft.com/powershell:7.5-debian-12` 容器 | `demos/pwsh/00_env.ps1.out.txt` |
| cmd | Windows | windows-latest runner 原生运行 | `demos/cmd/00_env.bat`（快照待 CI 首次采集） |
| PowerShell 5.1 | Windows | windows-latest runner 内置 | `demos/powershell5/00_env.ps1`（快照待 CI 首次采集） |
| PowerShell 7 | Windows | windows-latest runner 预装 | `demos/powershell7/00_env.ps1`（快照待 CI 首次采集） |
| Python 3.12 | Linux | `python:3.12-slim` 容器（图灵完备语言对照组） | `demos/python/00_env.py.out.txt` |

镜像锁定与漂移风险见[版本政策](/reference/version-policy)，输出快照的证据规则见[证据政策](/reference/evidence-policy)。
