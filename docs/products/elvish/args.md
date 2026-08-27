# Elvish 参数与交互

> 本页结论：Elvish 的命名空间和模块化机制，使其在编写和维护复杂 CLI 工具时如鱼得水。

## 函数与参数签名

Elvish 支持通过非常优雅的语法定义函数，同时支持位置参数与关键字参数（Options）。

```bash
fn greet {|name &shout=$false|
  if $shout {
    echo "HELLO, "$name
  } else {
    echo "Hello, "$name
  }
}

# 调用
greet "Elvish"
greet "Elvish" &shout=$true
```
