import sys
import py_compile
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

py_files = list(BASE_DIR.rglob("*.py"))
errors = []

print(f"检查 {len(py_files)} 个 Python 文件的语法...\n")

for f in py_files:
    if "venv" in str(f) or ".venv" in str(f) or "__pycache__" in str(f):
        continue
    try:
        py_compile.compile(str(f), doraise=True)
        print(f"✅ {f.relative_to(BASE_DIR)}")
    except py_compile.PyCompileError as e:
        errors.append((f, e))
        print(f"❌ {f.relative_to(BASE_DIR)}: {e}")

if errors:
    print(f"\n❌ 发现 {len(errors)} 个语法错误")
    sys.exit(1)
else:
    print("\n🎉 所有 Python 文件语法检查通过！")
