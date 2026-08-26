# 常见坑位

由于 Alpine Linux 大量流行，许多习惯了 Bash 的开发者在编写容器 `entrypoint.sh` 或 Dockerfile `RUN` 指令时经常踩坑：

## 1. 数组的支持缺失
Ash **不支持** Bash 的数组（如 `arr=(a b c)`）。
*解决办法*：使用空格分隔的字符串 `arr="a b c"` 配合 `for i in $arr; do ...` 循环，或依赖函数的 `$1`, `$2` 等位置参数。

## 2. 字符串操作差异
不支持 Bash 的 `${var/search/replace}` 快速字符串替换。
*解决办法*：老老实实通过管道传给 `sed` 或 `awk`。

## 3. 双中括号 `[[ ]]` 报错
Ash 遇到 `if [[ $a == $b ]]; then` 会直接报错 `[[ : not found`。
*解决办法*：严格使用单中括号 `if [ "$a" = "$b" ]; then`，注意字符串比较是单个 `=`。

## 4. Source 命令差异
某些极简编译版本的 Ash 可能不支持 `source` 关键字，尽管 Alpine 里的 ash 支持 `source`，但在标准 POSIX 脚本中，总是推荐使用 `.`（点号）来引入文件，例如 `. ./config.env`。
