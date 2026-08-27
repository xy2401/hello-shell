# Oils for Unix 参数与交互

> 本页结论：YSH 借鉴了高级语言的方法，通过标准库与现代语法极大地简化了 CLI 参数的解析。

## 现代函数的参数绑定

Bash 中使用 `$1`, `$2` 非常容易出错。YSH 允许像现代语言一样声明函数并绑定参数名称。

```bash
proc build(target, --clean) {
    if (clean) {
        echo "Cleaning..."
    }
    echo "Building $[target]..."
}

# 调用
build "app" --clean
```

## 跨数据流的交互

在使用管道传递数据时，YSH 能够智能地区分文本流和结构化数据块。配合内置的 `json` 读写块，使得 Oils 在串联现代微服务 CLI 时比传统 Bash 优雅得多。
