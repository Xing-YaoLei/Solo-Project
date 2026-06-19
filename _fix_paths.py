import json

with open('assets/resources/config/diagnoses.json', 'r') as f:
    data = json.load(f)

for diag_id, diag in data.items():
    fixed_paths = []
    for p in diag['photoPaths']:
        if not p.startswith('textures/'):
            fixed = 'textures/' + p
            print(f"✅ {diag_id}: {p} -> {fixed}")
            fixed_paths.append(fixed)
        else:
            fixed_paths.append(p)
    diag['photoPaths'] = fixed_paths

with open('assets/resources/config/diagnoses.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n✅ 所有 photoPaths 已修复")
