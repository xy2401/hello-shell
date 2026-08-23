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
</div>

## 如何选择

| 运行环境 | 适合 | 边界 |
| --- | --- | --- |
| [浏览器 Bash](./bash) | Bash 语法、管道、重定向和临时文件练习 | Bash 兼容解释器，不是 Linux 内核 |
| [浏览器 Linux](./linux) | 内核、进程、目录与 BusyBox 命令实验 | x86 模拟，下载更大、启动更慢 |

跨 Shell 的 9 个统一任务、输出快照和运行方法已经归入[对比矩阵 · 统一任务实验](/matrix/experiments)。
