#!/usr/bin/env bash

# Count Lines of Code (LOC)
# Ignores files in .gitignore, .git, and .github

TARGET_DIR="${1:-.}"

# Find available python command
PYTHON_BIN=""
if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
elif command -v py >/dev/null 2>&1; then
    PYTHON_BIN="py -3"
fi

if [ -n "$PYTHON_BIN" ]; then
    $PYTHON_BIN - "$TARGET_DIR" << 'EOF'
import fnmatch
import subprocess
import sys
from collections import defaultdict
from pathlib import Path


def get_files_with_git(root: Path) -> list[Path] | None:
    try:
        res = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
            cwd=root,
            capture_output=True,
            text=True,
            check=True,
        )
        files = []
        for line in res.stdout.splitlines():
            p = Path(line.strip())
            # Ignore .github and .git directories
            if any(part in (".github", ".git") for part in p.parts):
                continue
            full_path = root / p
            if full_path.is_file():
                files.append(full_path)
        return files
    except Exception:
        return None


def get_files_fallback(root: Path) -> list[Path]:
    patterns = [".git*", ".github*"]
    gitignore = root / ".gitignore"
    if gitignore.is_file():
        with open(gitignore, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    patterns.append(line.rstrip("/"))

    def is_ignored(path: Path) -> bool:
        if any(part in (".git", ".github") for part in path.parts):
            return True
        rel_str = path.relative_to(root).as_posix()
        for pat in patterns:
            if (
                fnmatch.fnmatch(rel_str, pat)
                or fnmatch.fnmatch(path.name, pat)
                or fnmatch.fnmatch(rel_str, f"{pat}/*")
            ):
                return True
        return False

    return [p for p in root.rglob("*") if p.is_file() and not is_ignored(p)]


def count_lines(file_path: Path):
    try:
        with open(file_path, "rb") as f:
            if b"\x00" in f.read(1024):
                return None  # Skip binary file

        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            total, blank = 0, 0
            for line in f:
                total += 1
                if not line.strip():
                    blank += 1
            return total, blank, total - blank
    except Exception:
        return None


def count_loc(target_dir: str):
    root = Path(target_dir).resolve()
    files = get_files_with_git(root)
    if files is None:
        files = get_files_fallback(root)

    stats = defaultdict(lambda: {"files": 0, "blank": 0, "code": 0, "total": 0})
    total_files = total_blank = total_code = total_lines = 0

    for file_path in files:
        result = count_lines(file_path)
        if result is None:
            continue

        file_total, file_blank, file_code = result
        ext = file_path.suffix.lower() or "[no ext]"

        stats[ext]["files"] += 1
        stats[ext]["blank"] += file_blank
        stats[ext]["code"] += file_code
        stats[ext]["total"] += file_total

        total_files += 1
        total_blank += file_blank
        total_code += file_code
        total_lines += file_total

    print(f"\nCounting lines in: {root}")
    print("=" * 66)
    print(f"{'Extension':<15} {'Files':>8} {'Blank':>12} {'Code':>12} {'Total':>12}")
    print("-" * 66)

    for ext, data in sorted(stats.items(), key=lambda x: x[1]["code"], reverse=True):
        print(
            f"{ext:<15} {data['files']:>8} {data['blank']:>12,}"
            f" {data['code']:>12,} {data['total']:>12,}"
        )

    print("-" * 66)
    print(
        f"{'TOTAL':<15} {total_files:>8} {total_blank:>12,}"
        f" {total_code:>12,} {total_lines:>12,}"
    )
    print("=" * 66)


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if a != "-"]
    folder = args[0] if args else "."
    count_loc(folder)
EOF
else
    # Pure bash fallback using git ls-files and wc/awk
    echo "Python not detected; running in pure Git Bash mode..."
    git ls-files --cached --others --exclude-standard | grep -v '^\.github/' | while IFS= read -r f; do
        if [ -f "$f" ]; then
            wc -l "$f" 2>/dev/null
        fi
    done | awk '
    {
        total += $1
        files++
    }
    END {
        printf "\nTotal Files: %d\nTotal Lines: %d\n", files, total
    }'
fi
