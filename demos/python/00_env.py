# Demo 00: environment info - Python's replacement for shell version/platform probing.
import platform
import subprocess
import sys


def main():
    version = (
        subprocess.run(
            [sys.executable, "--version"],
            capture_output=True,
            text=True,
            check=True,
        )
        .stdout.splitlines()[0]
    )
    print(f"version={version}")
    print("shell=python")
    print(f"platform={platform.system().lower()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
