# 参数与交互

在交互式体验上，Ash 奉行“够用就好”的极简主义。

## 行编辑与历史记录

- 支持基础的 Emacs 或 Vi 模式行编辑（取决于 BusyBox 的编译配置，Alpine 默认开启基本行编辑）。
- 支持方向键调用历史记录，但不像 Bash 那样支持复杂的 `!$`、`!!` 等历史扩展操作。

## 环境变量配置

Ash 没有复杂的 `.bashrc`、`.bash_profile`、`.profile` 迷宫。
- 登录 shell 通常只加载 `/etc/profile` 和用户目录下的 `.profile`。
- 通过配置 `ENV` 环境变量可以指定交互式非登录 shell 启动时加载的配置文件。
