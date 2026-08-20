# Demo 02: variables and quoting - lists, word counting, interpolation, glob-literal safety.
set -l value "hello world"
echo "value=$value"
# word count: split into a list and count it (the value's 2 words plus one more = 3)
set -l sentence "$value fish"
set -l wc (count (string split " " $sentence))
echo "wordCount=$wc"
# interpolation: variables expand inside double quotes, no ${} needed
set -l num 42
echo "interpolated=value-is-$num"
# quoting: a quoted '*' stays literal and is never glob-expanded
set -l star "a*b*c"
echo "starLiteral=$star"
exit 0
