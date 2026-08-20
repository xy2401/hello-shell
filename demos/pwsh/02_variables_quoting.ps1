# 演示点：变量与引号——双引号插值、单引号原样字面量、-split 计数
$value = 'hello world'
$answer = 42
# 双引号：$answer 被插值成 42
$interpolated = "value-is-$answer"
# 单引号：a*b*c 原样保留（是字面量，不是通配符）
$starLiteral = 'a*b*c'
# -split 按正则拆分并计数：'\*' 转义星号，拆出 a/b/c 三段
$wordCount = ($starLiteral -split '\*').Count

Write-Output "value=$value"
Write-Output "wordCount=$wordCount"
Write-Output "interpolated=$interpolated"
Write-Output "starLiteral=$starLiteral"
exit 0
