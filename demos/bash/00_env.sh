#!/usr/bin/env bash
# Demo 00: environment info - command substitution to report shell version and platform.
version="$(bash --version | head -n 1)"
echo "version=$version"
echo "shell=bash"
platform="$(uname -s | tr '[:upper:]' '[:lower:]')"
echo "platform=$platform"
exit 0
