# Elvish 语法与特性

> 本页结论：Elvish 以 Go 语言的健壮性为底座，带来了一流的函数式编程特性和原生的异常处理。

## 数据流与结构

和传统 Bash 的纯字符串管道不同，Elvish 支持在管道中传递丰富的数据结构。

```bash
# 定义列表和字典
var li = [a b c]
var map = [&key=value &foo=bar]

# 在管道中传递并处理列表元素
put 1 2 3 | each {|x| * $x 2 } # 输出 2 4 6
```

## 异常捕获机制 (Exceptions)

Elvish 抛弃了 `set -e` 和 `$?` 这种脆弱的错误处理方式，引入了强力的 `try...catch` 机制。

```bash
try {
  # 可能会失败的命令
  cat non_existent_file.txt
} catch e {
  echo "Caught an error: " $e[reason]
}
```
