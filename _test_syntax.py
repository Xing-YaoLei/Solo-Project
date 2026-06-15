import sys, py_compile, os

files = [
    'config.py', 'celery_app.py', 'app.py',
    'app/charts.py',
    'models/database.py', 'models/student.py', 'models/course.py',
    'models/classroom.py', 'models/enrollment.py', 'models/schedule.py',
    'models/anomaly.py', 'models/source_raw.py',
    'tasks/base.py', 'tasks/sync_student_application.py',
    'tasks/sync_teaching_platform.py', 'tasks/sync_smart_card.py',
    'tasks/anomaly_detection.py',
    'utils/mock_data.py', 'utils/data_service.py', 'utils/exporter.py',
]

ok = 0
fail = 0
for f in files:
    if os.path.exists(f):
        try:
            py_compile.compile(f, doraise=True)
            ok += 1
        except Exception as e:
            fail += 1
            print(f'FAIL {f}: {e}')
    else:
        fail += 1
        print(f'MISS {f}')

print(f'\nSyntax check: {ok}/{ok+fail} passed')
sys.exit(0 if fail == 0 else 1)
