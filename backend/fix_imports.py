import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))

replacements_2dot = [
    (re.compile(r'^from \.\.core\.'), 'from app.core.'),
    (re.compile(r'^from \.\.models'), 'from app.models'),
    (re.compile(r'^from \.\.schemas'), 'from app.schemas'),
    (re.compile(r'^from \.\.services\.'), 'from app.services.'),
    (re.compile(r'^from \.\.services$'), 'from app.services'),
    (re.compile(r'^from \.\.api\.'), 'from app.api.'),
    (re.compile(r'^from \.\.celery_app\.'), 'from app.celery_app.'),
]

main_1dot = [
    (re.compile(r'^from \.core\.'), 'from app.core.'),
    (re.compile(r'^from \.api'), 'from app.api'),
    (re.compile(r'^from \.services\.'), 'from app.services.'),
    (re.compile(r'^from \.models'), 'from app.models'),
    (re.compile(r'^from \.schemas'), 'from app.schemas'),
]

core_1dot = [
    (re.compile(r'^from \.config'), 'from app.core.config'),
]

api_1dot = [
    (re.compile(r'^from \.deps'), 'from app.api.deps'),
    (re.compile(r'^from \.auth'), 'from app.api.auth'),
    (re.compile(r'^from \.users'), 'from app.api.users'),
    (re.compile(r'^from \.work_orders'), 'from app.api.work_orders'),
    (re.compile(r'^from \.admin'), 'from app.api.admin'),
]

total = 0
for root, dirs, files in os.walk(os.path.join(BASE, 'app')):
    for fname in files:
        if not fname.endswith('.py'):
            continue
        fpath = os.path.join(root, fname)
        with open(fpath, 'r') as f:
            lines = f.readlines()
        changed = False
        new_lines = []
        for line in lines:
            orig = line
            for pattern, repl in replacements_2dot:
                line = pattern.sub(repl, line)
            if fname == 'main.py' and root.endswith('app'):
                for pattern, repl in main_1dot:
                    line = pattern.sub(repl, line)
            if root.endswith('app/core'):
                for pattern, repl in core_1dot:
                    line = pattern.sub(repl, line)
            if root.endswith('app/api'):
                for pattern, repl in api_1dot:
                    line = pattern.sub(repl, line)
            if line != orig:
                changed = True
            new_lines.append(line)
        if changed:
            with open(fpath, 'w') as f:
                f.writelines(new_lines)
            total += 1
            rel = os.path.relpath(fpath, BASE)
            print(f'  Updated: {rel}')

print(f'\nDone. Total {total} files updated.')
