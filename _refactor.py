"""Move app.layout definition to after all _render_xxx_tab functions."""
import re

with open("app.py", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find line numbers (0-indexed)
layout_start = None  # "app.layout = dbc.Container([" line
layout_end = None    # line containing "})" which closes Container
render_sync_end = None  # after _render_sync_tab function, before "# === 核心回调 ==="
section_comment_layout = None  # "# ============== 页面主布局 =============="
section_comment_render = None  # "# ============== 渲染 Tab 内容 =============="

for i, line in enumerate(lines):
    if line.strip() == "# ============== 页面主布局 ==============":
        section_comment_layout = i
    if line.strip().startswith("app.layout = dbc.Container(["):
        layout_start = i
    if section_comment_layout and layout_start and layout_end is None:
        # find matching close for layout: line with "})" followed by blank lines
        # Actually Container ends at "], fluid=True, style={... })" around line 396
        if layout_start is not None and i > layout_start + 150:
            if line.strip().startswith("})"):
                layout_end = i + 1  # exclusive
                break

# Fallback: search exactly around 396 for "minHeight.*sans-serif.*})"
if layout_end is None:
    for i, line in enumerate(lines):
        if 'sans-serif"' in line and line.strip().endswith("})"):
            layout_end = i + 1
            break

# Find "# === 核心回调 ===" line, insert layout before it
core_callback_line = None
for i, line in enumerate(lines):
    if line.strip() == "# ============== 核心回调 ==============":
        core_callback_line = i
        break

# Find "# === 渲染 Tab 内容 ===" comment
for i, line in enumerate(lines):
    if line.strip() == "# ============== 渲染 Tab 内容 ==============":
        section_comment_render = i
        break

print(f"[DEBUG] section_comment_layout={section_comment_layout}")
print(f"[DEBUG] layout_start={layout_start}")
print(f"[DEBUG] layout_end={layout_end}")
print(f"[DEBUG] section_comment_render={section_comment_render}")
print(f"[DEBUG] core_callback_line={core_callback_line}")

assert all(v is not None for v in [
    section_comment_layout, layout_start, layout_end, core_callback_line
]), "Could not find all markers"

# Extract blocks
header_block = lines[:section_comment_layout]
layout_block = lines[section_comment_layout:layout_end]
# from layout_end to core_callback_line = "渲染 Tab 内容 + 6个render函数 + old TAB_RENDERS(已删) + 空行"
render_block = lines[layout_end:core_callback_line]
callbacks_block = lines[core_callback_line:]

# Reorder: header -> (blank)-> render comment + renders -> layout section -> callbacks
new_lines = (
    header_block
    + ["\n"]
    + layout_block  # But layout references _render functions! We need to wrap in lazy eval.
    + render_block
    + callbacks_block
)

# Problem: layout_block still references _render functions that are now AFTER it in render_block.
# Solution: reorder differently:
#   header + render_comment_section(empty for now) + render_block + THEN layout_block + callbacks

# Let's just re-arrange properly:
# The render_block already contains the "# === 渲染 Tab 内容 ===" comment.
# So we want: header + render_block + layout_block + callbacks
# BUT we also want to move section_comment_layout to appear just before layout_start inside its own block.

# Let me rebuild carefully:
# header = lines[0 : section_comment_layout]
# rest = lines[section_comment_layout : ]
# 
# In rest, first is layout block, then render block, then callbacks
# We want header + render_block + layout_block + callbacks

# Let's re-extract carefully:
layout_block_full = lines[section_comment_layout : layout_end]
render_block_full = lines[layout_end : core_callback_line]
callbacks_block_full = lines[core_callback_line:]

result = (
    header_block  # imports, app init, helpers
    + ["\n"]
    + render_block_full  # 6 render functions
    + layout_block_full  # layout definition
    + ["\n\n"]
    + callbacks_block_full
)

with open("app.py", "w", encoding="utf-8") as f:
    f.writelines(result)

print("\n✅ Refactor complete!")
print(f"  - Moved layout (lines {section_comment_layout+1}-{layout_end}) to after render functions")
print(f"  - Inserted before core callbacks (line {core_callback_line+1} originally)")
print("\nNow verify with: python -c \"import app; print('OK')\"")
