# Nushell 语法与特性

> 本页结论：Nushell 的语法不再是传统的文本替换和宏展开，而是一门强类型、面向数据的现代编程语言。

## 强类型数据管道

与 Bash 将一切视为字符串不同，Nushell 拥有真实的数据类型。管道 `|` 传递的是结构化数据（通常是 Table 或 Record）。

```nushell
# 返回的是一张表，包含 name, type, size, modified 等强类型列
ls 

# 过滤大小大于 10MB 的文件（size 是专用的 Filesize 类型）
ls | where size > 10mb

# 按时间排序并只保留 name 和 size 列
ls | where size > 10mb | sort-by modified | select name size
```

## 核心数据类型

- **基础类型**：`int` (整数), `float` (浮点), `string` (字符串), `bool` (布尔)。
- **特殊基础类型**：
  - `filesize`：如 `10mb`, `1.5gb`，原生支持大小计算。
  - `duration`：如 `10sec`, `1wk`，原生支持时间计算。
  - `date`：绝对时间戳。
- **复合类型**：
  - `list`：有序列表 `[1, 2, 3]`。
  - `record`：键值对集合 `{name: "Alice", age: 30}`。
  - `table`：列表的列表（等同于多行 Record），终端里显示为表格。

## 变量与作用域

Nushell 默认是**不可变（Immutable）**的。

```nushell
# 声明不可变变量
let name = "Nushell"

# 声明可变变量（需要使用 mut，修改使用 =）
mut count = 0
$count = $count + 1
```

## 控制流

Nushell 提供了现代编程语言的控制流：

```nushell
# 条件判断
if $count > 10 {
    print "Too many"
} else {
    print "OK"
}

# 循环遍历列表
for item in [1 2 3] {
    print ($item * 2)
}

# 现代的管道遍历 (类似 map/each)
[1 2 3] | each {|x| $x * 2 }
```
