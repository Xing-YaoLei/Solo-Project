import sys

print("Testing router imports...")

routers_to_test = [
    ("auth", "app.routers.auth"),
    ("quotes", "app.routers.quotes"),
    ("invoices", "app.routers.invoices"),
    ("approvals", "app.routers.approvals"),
    ("payments", "app.routers.payments"),
    ("exceptions", "app.routers.exceptions"),
    ("attachments", "app.routers.attachments"),
    ("statistics", "app.routers.statistics"),
]

for name, mod_path in routers_to_test:
    try:
        mod = __import__(mod_path, fromlist=["router"])
        router = getattr(mod, "router", None)
        if router:
            print(f"✅ {name}: {len(router.routes)} routes")
            for r in router.routes:
                print(f"     {list(r.methods)[0] if r.methods else '':6s} {r.path}")
        else:
            print(f"❌ {name}: no router attribute")
    except Exception as e:
        print(f"❌ {name}: {type(e).__name__}: {e}")

print("\nTesting main app...")
try:
    from app.main import app
    print(f"✅ App created, {len(app.routes)} top-level routes")
    for r in app.routes:
        p = getattr(r, "path", "")
        m = ",".join(sorted(getattr(r, "methods", set())))
        print(f"   {m:10s} {p}")
except Exception as e:
    print(f"❌ Main app failed: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
