# Demo 04: control flow - for/while loops, if/else, and counting fixture rows.
import csv
import os
import sys

FIXTURES = "/fixtures"


def main():
    total = 0
    for i in range(1, 4):  # 1..3 inclusive
        total += i
    print(f"sum123={total}")

    # count paid orders
    paid = 0
    with open(os.path.join(FIXTURES, "orders.csv"), newline="") as fh:
        for row in csv.DictReader(fh):
            if row["status"] == "paid":
                paid += 1
    print(f"paidCount={paid}")

    # loop over a directory listing
    n = 0
    for _name in sorted(os.listdir(os.path.join(FIXTURES, "data"))):
        n += 1
    print(f"loopFiles={n}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
