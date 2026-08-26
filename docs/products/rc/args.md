# rc (Plan 9) 参数与交互

> 本页结论：rc 将脚本入参当作最原生的列表变量对待，简洁而高效。

## 内置的魔法变量
- `$*`：包含所有参数的列表。由于 rc 的列表不会发生二次分词，`$*` 是绝对安全的。
- `$#*`：参数的个数（对应 Bash 的 `$#`）。

```rc
echo "You passed" $#* "arguments."
for (arg in $*) {
    echo "Argument:" $arg
}
```
