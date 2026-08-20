# Demo 07: error handling - try/except catches failures; a child process supplies the numeric exit code.
import subprocess
import sys


def main():
    caught = False
    fail_code = 0
    try:
        # check=True raises CalledProcessError when the child exits non-zero;
        # an uncaught exception would exit Python with code 1, so the child is
        # made to fail the same way: raise -> exit code 1.
        subprocess.run(
            [sys.executable, "-c", "raise RuntimeError('boom')"],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except subprocess.CalledProcessError as exc:
        caught = True
        fail_code = exc.returncode

    print(f"caughtError={'true' if caught else 'false'}")
    print("afterFailure=continued")
    print(f"setEExitCode={fail_code}")
    print("scriptExitCode=0")
    return 0


if __name__ == "__main__":
    sys.exit(main())
