# Nushell 常见坑位

> 本页结论：从 Bash 迁移到 Nushell 时，最大的坑往往来自于“字符串与数据的认知错位”以及“外部命令的交互边界”。

## 1. 外部命令与原生命令的边界混淆

Nushell 是一套独立的生态，原生命令返回的是表格（Table）或数据；但当你调用外部的传统程序（如 `git`, `curl`, `jq`）时，它们返回的是**纯文本（Raw String）**。

**坑位**：直接把外部命令的结果丢给基于 Table 的 Nushell 命令会报错。
```nushell
# 失败：git log 返回的是纯文本，Nushell 的 select 只能处理 Table/Record
git log | select commit 
```

**解法**：你需要用专门的解析命令（如 `lines`, `parse`, `from json`）将纯文本“反序列化”成 Nushell 能懂的表格。
```nushell
# 正确做法：先切分成行，再用 parse 提取结构
git log | lines | parse "commit {hash}" | select hash
```

## 2. 默认不可变带来的“循环不生效”问题

受函数式编程影响，Nushell 强烈不建议使用可变状态。这会导致传统 Bash 里的 `while` 累加器失效。

**坑位**：
```nushell
# 这在 Bash 里很常见，但在 Nushell 中会因为作用域和不可变性引发报错或无效
mut total = 0
[1 2 3] | each { |x| $total = $total + $x } # 报错：闭包内部无法改变外部作用域的 mut 变量
```

**解法**：使用数据流特有的归约（Reduce）或数学运算命令。
```nushell
# 优雅的声明式解法
[1 2 3] | math sum
# 或者
[1 2 3] | reduce -f 0 { |it, acc| $acc + $it }
```

## 3. 引号缺失导致的数据类型误判

Bash 里 `echo hello` 不加引号也能执行，因为一切都是字符串。在 Nushell 中，裸词（Bare word）在某些上下文中是允许的，但如果你输入的内容碰巧符合其他类型的特征，就会引发灾难。

**坑位**：
```nushell
# 假设你想输出一个版本号字符串
echo 1.5.0
# 可能会被误判，或者在参数解析中报错。
```

**最佳实践**：在 Nushell 中，**当你需要传递字符串时，永远老老实实加上双引号或单引号**，不要依赖裸词的自动推导。
