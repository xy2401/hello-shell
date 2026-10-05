---
aside: false
pageClass: shell-runtime-page
---

# c2w

本页提供一个极简版本的 Alpine 3.22 容器环境（纯 `sh`），用于演示 container2wasm 在 RISC-V 64 架构下最小化的运行开销。

运行时由 [Hello WASM](https://wasm.2401.xyz/runtimes/) 维护，读取 `shell/base/riscv64`；当前 gzip 下载量为 25.9 MiB。打开页面只获取清单，点击启动才下载分片。

<BrowserContainerWorkbench runtimeId="c2w" />

## 特性与环境

- **极致纯净**：只安装了 `coreutils`，没有任何外加的 Shell 或 Python，体积最小。
- **免本地构建与分片加载**：
  - 容器底座由 hello-wasm 的手动 GitHub Actions 工作流构建并生成。
  - 镜像通过 Cloudflare Pages CDN 静态托管，浏览器并发下载。
