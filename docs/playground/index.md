# 浏览器 Shell 工作台

在浏览器里直接运行 Shell，不需要连接命令执行服务器。轻量 Bash 适合快速练习语法，完整 Linux 适合观察真实内核和系统环境。

<div class="runtime-entry-grid">
  <a href="./bash">
    <small>轻量 · TypeScript 沙箱</small>
    <strong>浏览器 Bash</strong>
    <span>执行 Bash 语法、管道、重定向和常见 Unix 工具，打开即可使用。</span>
  </a>
  <a href="./linux">
    <small>完整 · v86</small>
    <strong>浏览器 Linux</strong>
    <span>模拟 x86 PC 并启动真实 Buildroot Linux 内核，体验完整系统终端。</span>
  </a>
  <a href="./container">
    <small>多环境 · container2wasm</small>
    <strong>多 Shell 容器</strong>
    <span>Alpine 容器内随时切换 Bash、Zsh、Fish 与 Python 3，内置完整工具链。</span>
  </a>
</div>

---

## 浏览器 Shell 方案速查

| 方案类型 | 代表技术 | 编译打包成本 (构建期) | 首次下载体积 | 启动速度 | CF Pages / 静态托管 |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **轻量 JS 解释器** *(当前线上)* | `just-bash` | 🟢 **零编译** (npm 包即装即用) | **~460 KB** | **毫秒级** | ✅ **纯前端** · 零配置 |
| **x86 硬件虚拟机** *(当前线上)* | `v86` + Linux | 🟢 **零编译** (预编译 wasm + 固件) | **~13 MB** | **~3 秒** | ✅ **纯前端** · 零配置 |
| **DOS 批处理模拟** | `v86` + FreeDOS | 🟢 **零编译** (直接静态托管镜像) | **~3 - 6 MB** | **~2 秒** | ✅ **纯前端** · 零配置 |
| **专用语言 WASI** | `Pyodide` / `zsh-wasm` | 🟢 **零编译** (直接分发 wasm 模块) | **~3 - 15 MB** | **~1 秒** | ✅ **纯前端** · 零配置 |
| **容器转 Wasm** | `container2wasm` (Alpine) | 🔴 **极重 · 源码全量重编 QEMU**<br>• **CPU**：15~30 分钟多核 100% 满载<br>• **硬盘**：6~10 GB 构建缓存<br>• **内存**：编译峰值需 4~8 GB RAM | **~25 - 35 MB** | **~5 秒** | ⚠️ **纯前端** · 需配安全头 |
| **JIT 加速虚拟机** | `CheerpX` (Debian) | 🟡 **轻** (分发 EXT2 镜像块 · 耗时 < 1m) | **~5 MB 起** | **~2 秒** | ⚠️ **纯前端** · 需配安全头 |
| **Node 微内核沙箱** | `WebContainer` | 🟢 **零编译** (官方 SDK 即插即用) | **~10 MB** | **秒级** | ⚠️ **纯前端** · 需配安全头 |
| **服务端真实容器** | `ttyd` + Docker | 🟢 **常规镜像构建** (普通缓存 · ~1m) | **< 500 KB** | **~1 秒** | ❌ **需独立后端服务器** |

---

## 各方案技术剖析与详细边界

### 1. 纯 JS/TS 解释器沙箱（如 `just-bash`）
* **运行原理**：在浏览器内存中通过 AST 语法树解析执行 Bash 脚本，维护虚拟内存文件系统。
* **核心优势**：极轻量（~460 KB）、毫秒级冷启动、零本地/CI 编译负担、100% 静态免维护。
* **局限边界**：仅为语法兼容解释器，非真实 Linux 内核；不支持任意原生 ELF 二进制程序、多进程调度或硬件交互。

### 2. x86 硬件模拟虚拟机（如 `v86` + Buildroot Linux）
* **运行原理**：WebAssembly 模拟 x86 PC 硬件指令与外设，直接引导真实的精简 Buildroot Linux 内核。
* **核心优势**：拥有真实的 Linux 内核、完整进程树与 BusyBox 工具链；官方提供预编译 `v86.wasm` 与固件，开箱即用。
* **局限边界**：纯软件模拟指令执行偏慢；系统镜像预先固化（~9.6 MB），无法在前端轻易动态安装大型软件包。

### 3. Windows DOS / 批处理模拟（如 `v86` + FreeDOS / `js-dos`）
* **运行原理**：复用 x86 模拟器直接加载 FreeDOS 软盘/硬盘镜像（约 2 MB）。
* **核心优势**：零额外开发成本，原汁原味体验 Windows 批处理（`.bat`）、`call :label` 与变量延迟展开机制。
* **局限边界**：仅限 16/32 位 DOS 与基础命令行工具，不支持现代 PowerShell 7。

### 4. 专用语言 WebAssembly 移植（如 `Pyodide` / `zsh-wasm` / `fish-wasm`）
* **运行原理**：通过 Emscripten/WASI 将单一语言/Shell 直接交叉编译为独立的 `.wasm` 二进制文件。
* **核心优势**：体积适中（~3-15 MB）、直接分发免编译、保留该运行体核心特性（如 Python 数据科学库、Zsh 通配符与下标 1 起点、Fish 语法高亮）。
* **局限边界**：各个 Shell 环境相互孤立，无法在同一个终端内通过管道自由调度。

### 5. 容器转 WebAssembly（如 `container2wasm` / c2w）
* **运行原理**：将标准 Docker 镜像与 QEMU-WASM 包装，在浏览器 WebWorker 内运行多线程 Linux 容器。
* **核心优势**：多 Shell（Bash/Zsh/Fish/Python3）一站式集成，支持 `apk add` 动态装包，可预载项目全部任务案例。
* **编译与打包代价（痛点）**：
  * ⚠️ **重型 C/C++ 源码全量编译**：`c2w --to-js` 并不是简单的格式转换，而是通过 Docker + Emscripten **把数百万行 C 源码的 QEMU 模拟器全量交叉编译为 WebAssembly**。
  * ⚠️ **CPU 消耗**：本地或 CI 构建需持续消耗 **15~30 分钟的多核 100% 满载** 计算。
  * ⚠️ **硬盘 / 磁盘空间**：拉取 Emscripten SDK、Rust、GCC 交叉工具链并产生巨量中间 LLVM/Wasm 目标文件，单次构建吃掉 **6~10 GB** 的 Docker Build Cache。
  * ⚠️ **内存占用**：在多线程链接大型 Wasm 模块与运行 `wasm-opt` 优化时，编译期内存峰值需 **4~8 GB RAM**，低配构建机极易触发 OOM。
* **运行环境依赖**：底层依赖 `SharedArrayBuffer`，托管平台（如 Cloudflare Pages）必须配置 `COOP / COEP` 跨域隔离安全头。

### 6. JIT 加速虚拟机（如 `CheerpX`）
* **运行原理**：x86-to-Wasm JIT 动态翻译，通过 HTTP Range 请求按需流式拉取 EXT2 文件系统块。
* **核心优势**：支持运行任意原生 ELF 二进制程序，执行性能明显优于纯解释模拟。
* **局限边界**：依赖特定商业/开源许可协议；静态服务器必须开启 `Accept-Ranges` 与 `COOP / COEP`。

### 7. 微内核进程沙箱（如 StackBlitz `WebContainer`）
* **运行原理**：基于 WebWorker 与 Node.js API 在浏览器端模拟微内核与虚拟进程树。
* **核心优势**：秒级极速冷启动，天然适配 Node.js 生态与前端 CLI 工具链。
* **局限边界**：底层是模拟 Shell（jsh）而非真实 POSIX/Linux 内核；强制依赖 `COOP / COEP` 请求头。

### 8. 服务端真实隔离沙箱（如 `ttyd` + Docker / VPS）
* **运行原理**：浏览器作为纯 xterm 终端客户端，通过 WebSocket 桥接后端的真实容器或微虚机。
* **核心优势**：100% 真实原生生产环境（可支持原生 Windows CMD / PowerShell 5.1 / Docker-in-Docker）。
* **局限边界**：失去纯静态文档站优势；需持续承担云服务器算力成本，并负责容器生命周期管理与防滥用/逃逸安全。

---

## 方案选型与技术建议

1. **日常语法学习与快速验证**：
   * 优先使用 **[浏览器 Bash](./bash)**：零等待、极省流量，适合快速验证管道、参数引用、循环与常见文本工具。
2. **内核行为与真实系统观察**：
   * 使用 **[浏览器 Linux](./linux)**：直观查看 Linux 启动过程、目录层次、环境变量与真实进程树。
3. **跨 Shell 矩阵与生产级实验**：
   * 跨 Shell 的 9 个统一任务、真实输出快照和基于 Docker 的本地运行方法，请参考 [对比矩阵 · 统一任务实验](/matrix/experiments)。
