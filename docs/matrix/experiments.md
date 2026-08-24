# 统一任务实验总览

> 9 个统一任务 × 8 个运行体构成本站的实证基础。选择任务和 Shell，可直接查看仓库中的完整脚本、输入数据与真实采集快照；本页只展示证据，不在浏览器内执行代码。

## 任务 × Shell

<MatrixExperimentViewer />

## 采集方式

**Linux：bash、zsh、fish、pwsh、python**

```bash
npm run collect-outputs
```

采集器使用 `.env.versions` 中以 tag 和 digest 锁定的镜像。zsh、fish 基于锁定的 Alpine 镜像构建，脚本输出写回源码旁的快照文件。

**Windows：cmd、PowerShell 5、PowerShell 7**

```powershell
pwsh scripts/collect-windows.ps1
```

Windows 快照由 `windows-latest` runner 采集，版本可能随 runner 更新，因此任务 00 的环境指纹就是版本留痕。

## 已知差异

- 任务 00 本来就应不同：每个运行体报告自己的版本、名称与平台。
- 任务 01 的失败命令和退出码受平台影响；查看器展示各自原始快照，不把结果改写成统一值。
- 任务 03 中 CMD 的 `invocation=3` 与其他运行体不同，来自批处理脚本自调用时 `%~nx0` 的实际取值。
- 任务 06 中 CMD 得到 `requestLines=4`，其余运行体为 `2`；该批处理把带文件名的 `find` 输出再次按行计数，快照保留了这项平台工具差异。
- 任务 04、05、07、08 的关键输出在八个运行体中一致，体现的是不同语法实现同一任务，而不是共享同一份脚本。
