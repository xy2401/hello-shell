# rc (Plan 9) 语法与特性

> 本页结论：rc 用最简单的语法规则，从根本上解决了 Unix 历史上遗留的最头疼的问题——空格解析。

## 绝对清晰的列表展开

在 rc 中，一切变量默认都是一个列表（List）。当一个列表展开时，rc 不会像 Bash 那样进行二次分词（Word Splitting）。

```bash
# rc 中给变量赋值
files = (a.txt 'b c.txt')

# 直接展开，绝不会因为 b c.txt 中有空格而把它拆成两个参数！
rm $files 
# 等同于调用 rm 传递了两个参数 "a.txt" 和 "b c.txt"。
```

## 没有歧义的循环与条件

语法极简，没有 Bash 中 `[[`, `]`, `test` 这些复杂的历史包袱。

```bash
if (~ $1 -x) {
    echo "Executable option passed"
}
```
