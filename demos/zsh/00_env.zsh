#!/usr/bin/env zsh
# Demo 00: environment info - command substitution to report shell version and platform.
version="$(zsh --version | head -n 1)"
echo "version=$version"
echo "shell=zsh"
platform="$(uname -s | tr '[:upper:]' '[:lower:]')"
echo "platform=$platform"
exit 0
