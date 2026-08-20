# Demo 01: hello I/O - stdout vs stderr, and capturing a child's non-zero exit code.
import subprocess
import sys


def main():
    print("stdout: hello from python")
    print("stderr: this line goes to stderr", file=sys.stderr)
    result = subprocess.run(
        ["ls", "/nonexistent-dir-hello-shell"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print(f"childExitCode={result.returncode}")
    print("scriptExitCode=0")
    return 0


if __name__ == "__main__":
    sys.exit(main())
