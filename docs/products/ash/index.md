# Ash (Almquist Shell) 分卷

> 本页结论：Ash 是轻量级嵌入式系统和容器（如 Alpine Linux）的默认王者，极简而强大。

## 一句话定位

**嵌入式系统与容器世界（BusyBox/Alpine）的绝对霸主。**

- 最初为 BSD 编写的 Bourne-compatible shell（Almquist shell）；
- 现今最广泛的化身是 **BusyBox ash**，是 Alpine Linux 等轻量级容器发行版的默认 `/bin/sh`；
- 体积极小，通常与数百个 Unix 基础命令被打包在同一个几百 KB 的 BusyBox 二进制文件中。

## 核心特色

1. **容器时代的标准底座**：
   在微服务与云原生时代，由于 Alpine Linux 的广泛流行，Ash 几乎成了无数 Docker 容器的默认入口环境。
2. **恰到好处的扩展**：
   相比极其严苛、纯粹只为性能而生的 Dash，BusyBox ash 在保持极小体积（比 Bash 小几个数量级）的同时，保留了一些基本的交互能力（如简单的命令历史、基本的行编辑支持）。

*(注：本页为特色介绍扩展，暂未收录入标准 9 大统一任务快照矩阵)*
