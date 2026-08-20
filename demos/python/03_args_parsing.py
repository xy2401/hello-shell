# Demo 03: hand-rolled argument parsing - re-exec self with fixed args when run bare, then loop over sys.argv.
import os
import sys


def main(argv):
    if not argv:
        # no args: re-exec self with a fixed argument list (quoted arg, flags, option with value)
        os.execv(
            sys.executable,
            [sys.executable, os.path.abspath(__file__),
             "alice", "bob smith", "--verbose", "-n", "3"],
        )

    script_name = os.path.basename(sys.argv[0])
    verbose = False
    n_value = ""
    positional = []
    i = 0
    while i < len(argv):
        arg = argv[i]
        if arg == "--verbose":
            verbose = True
        elif arg == "-n":
            i += 1
            n_value = argv[i]
        else:
            positional.append(arg)
        i += 1

    print(f"invocation={script_name}")
    print(f"argCount={len(argv)}")
    print(f"firstArg={positional[0]}")
    print(f"secondArg={positional[1]}")
    print(f"verboseFlag={'true' if verbose else 'false'}")
    print(f"nValue={n_value}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
