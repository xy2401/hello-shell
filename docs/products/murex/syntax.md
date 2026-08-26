# Murex 语法与特性

> 本页结论：Murex 在拥抱结构化数据（JSON）的同时，最大程度地兼容了 POSIX 管道直觉。

## 强类型数据流
Murex 管道传递的是包含类型元数据的数据块。它原生支持 JSON、YAML、CSV 等。

```murex
# 读取一个 JSON 文件并通过管道处理
open config.json | format yaml
```

## 智能变量与类型映射
Murex 会自动推断数据结构，并允许直接使用类似 JS 的对象访问语法。

```murex
# 直接提取 JSON 树中的某个节点
open data.json | [Person.Name]
```
