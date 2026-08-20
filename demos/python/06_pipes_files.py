# Demo 06: pipes and files - Python replaces one shell pipeline with explicit stdlib code.
import csv
import os
import sys

FIXTURES = "/fixtures"


def main():
    data_dir = os.path.join(FIXTURES, "data")

    # glob listing (fish: for f in /fixtures/data/*; basename $f; end)
    names = sorted(os.listdir(data_dir))
    print(f"globList={','.join(names)}")

    # glob counting (fish: count /fixtures/data/*.log)
    log_files = sum(1 for name in names if name.endswith(".log"))
    print(f"logFiles={log_files}")

    # line filtering (fish: command grep request ... | wc -l)
    with open(os.path.join(data_dir, "app.log")) as fh:
        request_lines = sum(1 for line in fh if "request" in line)
    print(f"requestLines={request_lines}")

    # status tallies from the CSV's status column, first-seen order
    counts = {}
    with open(os.path.join(FIXTURES, "orders.csv"), newline="") as fh:
        for row in csv.DictReader(fh):
            status = row["status"]
            counts[status] = counts.get(status, 0) + 1
    print(f"statusCounts={','.join(f'{k}:{v}' for k, v in counts.items())}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
