# Nushell 参数与交互

> 本页结论：Nushell 彻底消灭了传统 Shell 解析 `$1`, `$2` 或用 `getopts` 手写循环的痛苦，直接内置了类型安全的参数签名机制。

## 自定义命令与参数签名

在 Nushell 中定义一个带有参数的命令（`def`），就像在 TypeScript 或 Rust 中写函数一样，自带类型推导、默认值和可选参数。

```nushell
# 定义一个名为 greet 的命令
def greet [
    name: string      # 必填位置参数，类型为字符串
    --age: int        # 可选命名参数（flag），类型为整数
    --shout (-s)      # 布尔类型 Flag，带有短选项 -s
] {
    let greeting = if $shout {
        $"HELLO ($name | str upcase)!"
    } else {
        $"Hello ($name)"
    }
    
    if ($age != null) {
        $"($greeting). You are ($age) years old."
    } else {
        $greeting
    }
}
```

## 调用与验证

当你定义好参数签名后，Nushell 会自动为你处理所有入参验证，甚至自动生成 `--help` 文档。

```nushell
# 正确调用
> greet "Alice" --age 30
Hello Alice. You are 30 years old.

# 短选项调用
> greet "Bob" -s
HELLO BOB!

# 错误调用：类型不匹配
> greet "Charlie" --age "thirty"
Error: nu::parser::type_mismatch
  × Type mismatch.
   ╭─[entry #4:1:23]
 1 │ greet "Charlie" --age "thirty"
   ·                       ────┬───
   ·                           ╰── expected int, found string
   ╰────
```

这比传统的 Bash `case "$1" in` 循环解析不仅易读百倍，而且在终端输入时能够获得**开箱即用的自动补全提示**。
