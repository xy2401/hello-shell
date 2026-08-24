---
aside: false
pageClass: shell-runtime-page
---

# container2wasm 工作台

本页通过 **`container2wasm`** 技术将预装多种 Shell 的 Alpine Linux 容器转换为 WebAssembly，直接在浏览器端加载并运行。

<BrowserContainerWorkbench />

## 特性与环境

- **多 Shell 一站式体验**：容器内预装了 **Bash 5.2**、**Zsh 5.9**、**Fish 3.7** 以及 **Python 3.12**，可在同一终端环境内随时通过 `exec zsh`、`exec fish` 自由切换。
- **丰富的 Unix 工具链**：内置 `jq`、`curl`、`tree`、`grep`、`sed`、`gawk`、`diffutils`、`vim`、`nano` 等常用文本与命令行工具。
- **免本地构建与分片加载**：
  - 容器底座由云端 GitHub Actions 流水线（[`.github/workflows/build-c2w-runtime.yml`](https://github.com)）自动构建并生成。
  - 镜像经过 10 MB 切片与 `gzip -9` 单片压缩（单个分片仅约 3.5 MB），由 Cloudflare Pages CDN 静态托管，浏览器并发下载并通过 `Content-Encoding: gzip` 原生自动解压。

## 常用操作

| 目标操作 | 命令 | 说明 |
| :--- | :--- | :--- |
| **切换为 Bash** | `exec bash -l` | 进入登录 Bash 环境 |
| **切换为 Zsh** | `exec zsh -l` | 进入 Zsh 环境（体验扩展通配与数组下标从 1 开始） |
| **切换为 Fish** | `exec fish` | 体验 Fish 的交互式语法高亮与语法风格 |
| **启动 Python** | `python3` | 进入 Python 3.12 交互式解释器 |
| **查看系统环境** | `cat /etc/os-release` | 查看 Alpine Linux 3.22 发行版信息 |

---

*其他工作台*：[JUST-BASH](./just-bash) · [BusyBox](./busybox) · [Pyodide](./pyodide) · [V86](./v86)
