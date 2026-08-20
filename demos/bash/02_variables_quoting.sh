#!/usr/bin/env bash
# Demo 02: variables and quoting - spaced values, word splitting, interpolation, glob-literal safety.
value="hello world"
echo "value=$value"

# bash splits an unquoted expansion on IFS whitespace: "a b c" -> 3 words.
words="a b c"
set -- $words
echo "wordCount=$#"

count=42
echo "interpolated=value-is-$count"

glob="a*b*c"  # quoted expansion: the * stays literal, no pathname expansion
echo "starLiteral=$glob"
exit 0
