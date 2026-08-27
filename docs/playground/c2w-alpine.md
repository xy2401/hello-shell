---
aside: false
pageClass: shell-runtime-page
---

# c2w-alpine (极简底座)

本页提供一个极简版本的 Alpine 3.22 容器环境（纯 `sh`），用于演示 container2wasm 在 RISC-V 64 架构下最小化的运行开销。

<BrowserContainerWorkbench runtimeId="c2w-empty" />

## 特性与环境

- **极致纯净**：只安装了 `coreutils`，没有任何外加的 Shell 或 Python，体积最小。
- **免本地构建与分片加载**：
  - 容器底座由云端 GitHub Actions 流水线自动构建并生成。
  - 镜像通过 Cloudflare Pages CDN 静态托管，浏览器并发下载。
