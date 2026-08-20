# Demo 00: environment info - command substitution and string handling in fish.
set -l fish_version (fish --version | string split \n)[1]
echo "version=$fish_version"
echo "shell=fish"
set -l platform (string lower (uname -s))
echo "platform=$platform"
exit 0
