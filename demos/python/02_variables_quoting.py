# Demo 02: variables and quoting - Python strings need no quoting rules; no glob expansion exists.
import sys


def main():
    value = "hello world"
    print(f"value={value}")
    # word count: the value's 2 words plus one more = 3 (same source as the fish demo)
    sentence = f"{value} fish"
    print(f"wordCount={len(sentence.split())}")
    # interpolation: f-strings are Python's answer to "$var" expansion
    num = 42
    print(f"interpolated=value-is-{num}")
    # '*' is just a character in Python; nothing is ever glob-expanded
    star = "a*b*c"
    print(f"starLiteral={star}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
