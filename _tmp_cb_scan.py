from app.dashboard import app

print("=== Dash callback structure ===")
for cid, info in (getattr(app, 'callback_map', {}) or {}).items():
    outs = getattr(info, 'outputs', None) or []
    outs_list = list(outs) if hasattr(outs, '__iter__') else [outs]
    out_descs = []
    for o in outs_list:
        cid_o = getattr(o, 'component_id', None)
        prop = getattr(o, 'component_property', None)
        if cid_o:
            out_descs.append(f"{cid_o}.{prop}")
    print(f"  [{cid[:20]}...] Outputs: {out_descs}")

# 另一种方式：_callback_list
print()
print("=== Dash _callback_list ===")
cb_list = getattr(app, '_callback_list', []) or []
for cb in cb_list:
    outs = getattr(cb, 'outputs', None) or []
    outs_list = list(outs) if hasattr(outs, '__iter__') and not isinstance(outs, str) else [outs]
    out_descs = []
    for o in outs_list:
        cid_o = getattr(o, 'component_id', None)
        prop = getattr(o, 'component_property', None)
        if cid_o:
            out_descs.append(f"{cid_o}.{prop}")
    if any('share' in x for x in out_descs):
        print(f"  Outputs: {out_descs}")
    if any('login-panel' in x for x in out_descs):
        print(f"  Outputs: {out_descs}")

# 直接搜 Output("share-result"
import inspect
from app import dashboard as db
src = inspect.getsource(db)
import re
print()
print("=== Raw source scan for Output() with share-result/login-panel ===")
for m in re.finditer(r'Output\(\s*"(share-result|login-panel-placeholder)"[^)]*\)', src):
    print(f"  L?: {m.group(0)}")
