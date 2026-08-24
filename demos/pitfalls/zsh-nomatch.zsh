#!/usr/bin/env zsh
# zsh reports an unmatched glob unless the (N) null-glob qualifier is used.
setopt NOMATCH
if ( print -r -- /tmp/hello-shell-lab/*.missing ) >/dev/null 2>&1; then
  print -r -- 'nomatch=expanded'
else
  print -r -- 'nomatch=error'
fi
matches=( /tmp/hello-shell-lab/*.missing(N) )
print -r -- "nullGlobCount=${#matches}"
