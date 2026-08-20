#!/usr/bin/env zsh
# Demo 02: variables and quoting - spaced values, explicit splitting, interpolation, glob-literal safety.
value="hello world"
echo "value=$value"

# zsh does NOT word-split unquoted expansions (unlike bash); ${=var} opts in,
# and zsh arrays are 1-based: words[1]="a" words[2]="b" words[3]="c".
words="a b c"
wordArray=( ${=words} )
echo "wordCount=${#wordArray}"

count=42
echo "interpolated=value-is-$count"

glob="a*b*c"  # quoted expansion: the * stays literal, no filename generation
echo "starLiteral=$glob"
exit 0
