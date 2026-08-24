# 浏览器 Shell 工作台

在浏览器里直接运行 Shell，不需要连接命令执行服务器。轻量 Bash 适合快速练习语法，完整 Linux 适合观察真实内核和系统环境。

<div class="runtime-entry-grid">
  <a href="./just-bash">
    <small>轻量 · 语法沙箱</small>
    <strong>JUST-BASH</strong>
    <span>基于 TypeScript 执行 Bash 语法、管道、重定向和常见 Unix 工具，打开即用。</span>
  </a>
  <a href="./busybox">
    <small>正统 POSIX · 1MB WASI</small>
    <strong>BusyBox</strong>
    <span>Wasmer 官方预编译 C 语言标准工具箱，毫秒级启动 ash 与 100+ 经典命令。</span>
  </a>
  <a href="./webcontainer">
    <small>Node.js 微系统 · 秒启</small>
    <strong>WebContainer</strong>
    <span>StackBlitz 官方驱动，浏览器内运行完整 Node.js、npm 与 jsh 交互终端。</span>
  </a>
  <a href="./pyodide">
    <small>官方 WASM · 对照终端</small>
    <strong>Pyodide</strong>
    <span>CPython 3.12 官方原生交互终端，直接进行 Shell vs Python 语法横向对照。</span>
  </a>
  <a href="./v86">
    <small>微虚机 · x86 PC</small>
    <strong>V86</strong>
    <span>模拟 x86 硬件并引导真实 Buildroot Linux 内核，观察进程树与环境。</span>
  </a>
  <a href="./container2wasm">
    <small>完整容器 · RISC-V 虚拟机</small>
    <strong>container2wasm</strong>
    <span>Alpine 容器内自由切换 Bash、Zsh、Fish 与 Python 3，预装多 Shell 工具链。</span>
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
* **关于 PowerShell 的 Wasm 现状**：
  * ⚠️ **非微软官方产品**：微软官方（`PowerShell/PowerShell`）**从未发布过官方独立的轻量 `powershell.wasm` 解释器**。
  * ⚠️ **底层重型依赖**：PowerShell 深度绑定 .NET CoreCLR 运行时（包含 JIT 编译器、GC 垃圾回收器以及庞大的 BCL 程序集）。社区虽有基于 Blazor/.NET Wasm 的嵌入式实验，但体积动辄 50~70 MB，且在浏览器纯 Wasm 沙箱中缺失操作系统 P/Invoke、文件系统与外部子进程管道能力。
  * ⚠️ **完整运行方案**：若要在浏览器中体验 100% 真实且包含全部 cmdlets 的 PowerShell 7，目前成熟方案为 **`container2wasm` (AMD64 容器，~140 MB)** 或 **服务端 WebTTY (`ttyd` + Docker)**。

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
   * 优先使用 **[JUST-BASH](./just-bash)**：零等待、极省流量，适合快速验证管道、参数引用、循环与常见文本工具。
2. **内核行为与真实系统观察**：
2. **正统 C 语言 POSIX 工具链验证**：
   * 使用 **[BusyBox](./busybox)**：1MB 官方预编译 WASI 模块，原生体验 `ash` 与 100+ 经典 Unix 工具。
3. **Node.js 命令行与前端脚本生态**：
   * 使用 **[WebContainer](./webcontainer)**：毫秒级进入真实的 Node.js 环境，在 `jsh` 终端中运行 `npm` 与 JS 脚本。
4. **Shell vs Python 语法横向对照**：
   * 使用 **[Pyodide](./pyodide)**：官方 CPython 3.12 原生终端，快速对照各任务在 Python 3 中的标准库与数据结构实现。
5. **内核行为与真实系统观察**：
   * 使用 **[V86](./v86)**：直观查看 Linux 启动过程、目录层次、环境变量与真实进程树。
3. **多 Shell 切换与完整工具链体验**：
6. **多 Shell 切换与完整工具链体验**：
   * 使用 **[container2wasm](./container2wasm)**：在同一容器中自由体验 Bash、Zsh、Fish、Python 3 及 jq 等现代命令行工具。
4. **跨 Shell 矩阵与生产级实验**：
   * 跨 Shell 的 9 个统一任务、真实输出快照和基于 Docker 的本地运行方法，请参考 [对比矩阵 · 统一任务实验](/matrix/experiments)。
7. **跨 Shell 矩阵与生产级实验**：
   * 跨 Shell 的 9 个统一任务、真实输出快照和基于 Docker 的本地运行方法，请参考 [对比矩阵 · 统一任务实验](/matrix/experiments)
