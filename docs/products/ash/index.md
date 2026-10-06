# Ash (Almquist Shell) 总览

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

## 适用边界

适合 BusyBox 等精简环境；可用命令与行为受 BusyBox 构建配置影响，不假定所有 Bash 扩展存在。

## 版本阅读范围

[完整版本目录](./version/)收录本仓库已有专题（如 busybox-1.36、busybox-1.37）。这些是教学与兼容性对照入口；运行环境的具体版本以安装页、工作台或采集证据为准。

## 推荐学习路线

[安装与环境](./install) → [语法骨架](./syntax) → [入参模型](./args) → [陷阱与检查表](./pitfalls) → [完整版本目录](./version/)。先完成最小示例，再阅读版本差异。

## 实验入口与范围

[浏览器实验台](/playground/)提供 Bash 风格与 BusyBox 等已有引擎；这些不能自动代表本产品的完整实现。 [统一任务复现手册](/matrix/experiments)说明已有脚本、输入和采集方式；未进入快照矩阵的 Shell 请按本产品安装页在本机实践。
