# Demo 05: functions and scope - return values (not exit codes), local/global scope, and a child process exit code.
import subprocess
import sys


def make_answer():
    return 42  # Python functions return real values, unlike fish's exit-code returns


def fail_seven():
    return 7


def set_scope_demo():
    after_call = "inner"  # local: the outer variable is untouched
    return after_call


after_call = "outer"


def main():
    result = make_answer()
    print(f"functionResult={result}")

    # fish functions return exit codes; Python functions return plain values,
    # so the "capture return code 7" counterpart is a child process exit code.
    seven = fail_seven()  # just a value here, never an exit status
    code = subprocess.run(
        [sys.executable, "-c", f"import sys; sys.exit({seven})"]
    ).returncode
    print(f"exitCodeReturn={code}")

    set_scope_demo()
    print(f"afterCall={after_call}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
