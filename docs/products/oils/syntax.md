# Oils for Unix 语法与特性

> 本页结论：Oils 拥有双解析器架构，`OSH` 让你无缝运行历史遗留的 Bash 脚本，而 `YSH` 则是一门专为未来设计的严谨脚本语言。

## OSH：100% 的兼容性

OSH（Oil Shell 的向下兼容部分）在语法上与 Bash 高度一致。它的目标是完全解析并正确执行那些数以万计的复杂底层系统脚本。

```bash
# 在 Oils 中，你可以直接跑那些复杂的 Bash 魔法
if [ -n "${VAR+x}" ]; then
  echo "VAR is set"
fi
```

## YSH：下一代语言设计

在编写全新脚本时，Oils 推荐使用 `YSH` 语法。它抛弃了 Unix 历史上许多“糟糕的设计”。

### 1. 变量声明
告别裸露的全局变量，YSH 强制或推荐更清晰的变量声明：
```ysh
var name = "Oils"   # 声明变量
setvar name = "YSH" # 修改变量
```

### 2. 表达式与条件判断
Bash 的 `[ ]` 和 `[[ ]]` 以及各种 `-eq`, `-z` 让人头皮发麻。YSH 借用了 Python 和 JS 的现代语法：
```ysh
if (x > 0 and name === "Oils") {
    echo "Modern Syntax!"
}
```

### 3. 原生数据结构
不仅有字符串，YSH 原生支持字典（Dict）和数组（List）以及直接处理 JSON：
```ysh
var my_dict = {
  name: "Alice",
  age: 30
}
echo $[my_dict.name]
```
