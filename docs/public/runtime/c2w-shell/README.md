# Container2wasm Prebuilt Multi-Shell Runtime Assets

本目录存放由 GitHub Actions 云端流水线构建并分片的 `container2wasm` 浏览器多 Shell 容器底座。

## 构建策略
- **源镜像**：`Dockerfile`（Alpine 3.22 + ash、bash、zsh、fish、elvish、dash、mksh、yash、oksh、tcsh、ion、python3 与常用 Unix 工具）
- **编译工具**：`c2w` (v0.8.4)
- **切片规则**：10M 原始切片后执行 `gzip -9` 单片压缩
- **分发协议**：在 `docs/public/_headers` 中配置 `Content-Encoding: gzip`，由浏览器网络栈并发自动解压。

## 资产清单
详情参见同目录下的 `manifest.json`。
