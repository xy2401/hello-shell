#!/usr/bin/env bash
# Unquoted expansion performs word splitting and pathname expansion.
rm -rf /tmp/quote-demo
mkdir -p /tmp/quote-demo
touch /tmp/quote-demo/alpha.txt /tmp/quote-demo/beta.txt

value="hello world"
set -- $value
printf 'unquotedWords=%s\n' "$#"
set -- "$value"
printf 'quotedWords=%s\n' "$#"

pattern='/tmp/quote-demo/*.txt'
set -- $pattern
printf 'expandedFiles=%s\n' "$#"
set -- "$pattern"
printf 'literalPatterns=%s\n' "$#"
