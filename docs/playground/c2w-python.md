---
aside: false
pageClass: shell-runtime-page
---

# C2W: Python 环境

专为脚本对比测试打造的纯净 Python WebAssembly 沙盒。

<BrowserContainerWorkbench runtimeId="c2w-python" />

## 特性与环境

- **纯粹的语言引擎**：隔离了所有的 Shell 工具链，只包含基础的 Alpine 系统以及 Python 3 与 Pip 工具。
- **极简极速**：通过剥离其它 Shell 的依赖，大幅缩减了容器体积，为只想单纯测试 Python 脚本的开发者提供最优加载体验。

## 常用操作

| 目标操作 | 命令 | 说明 |
| :--- | :--- | :--- |
| **进入交互模式** | \`python3\` | 启动 Python REPL |
| **执行测试片段** | \`python3 -c "print('Hello')"\`| 快速打印测试 |
