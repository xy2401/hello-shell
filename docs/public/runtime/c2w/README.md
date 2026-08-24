# Container2wasm Prebuilt Multi-Shell Runtime Assets

本目录存放由 GitHub Actions 云端流水线构建并分片的 `container2wasm` 浏览器多 Shell 容器底座。

## 构建方式
通过 GitHub Actions 工作流 [`.github/workflows/build-c2w-runtime.yml`](../../../.github/workflows/build-c2w-runtime.yml) 自动构建生成。

## 资产设计
- **源镜像**：`Dockerfile.base` (Alpine 3.22 + bash, zsh, fish, python3, jq 等)
- **编译工具**：`c2w` (v0.8.4)
- **切片规则**：10MB 原始切片后执行 `gzip -9` 单片压缩（单个分片仅约 2~3.5MB）
- **分发协议**：在 `docs/public/_headers` 中配置 `Content-Encoding: gzip`，由浏览器网络栈并发自动解压。
