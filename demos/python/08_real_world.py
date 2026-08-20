# Demo 08: real-world task - stage fixtures into /tmp/work, rename *.log to *.log.bak, then verify and report.
import os
import shutil
import sys

FIXTURES = "/fixtures"
WORK = "/tmp/work"


def main():
    # stage: clean leftovers, then copy the fixture data
    shutil.rmtree(WORK, ignore_errors=True)
    os.makedirs(WORK, exist_ok=True)
    shutil.copytree(os.path.join(FIXTURES, "data"), os.path.join(WORK, "data"))

    prepared = 0
    renamed = 0
    unchanged = 0
    data_dir = os.path.join(WORK, "data")
    for name in sorted(os.listdir(data_dir)):
        path = os.path.join(data_dir, name)
        if not os.path.isfile(path):
            continue
        prepared += 1
        if name.endswith(".log"):
            os.replace(path, path + ".bak")
            renamed += 1
        else:
            unchanged += 1

    # verify: the renamed file exists, the old name is gone, and the file set matches
    verify = "ok"
    if not os.path.isfile(os.path.join(data_dir, "app.log.bak")):
        verify = "fail"
    if os.path.exists(os.path.join(data_dir, "app.log")):
        verify = "fail"
    final_names = sorted(os.listdir(data_dir))
    if final_names != ["app.log.bak", "config.csv", "readme.txt"]:
        verify = "fail"

    print(f"prepared={prepared}")
    print(f"renamed={renamed}")
    print(f"unchanged={unchanged}")
    print(f"verify={verify}")
    print(f"report=prepared={prepared},renamed={renamed},unchanged={unchanged}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
