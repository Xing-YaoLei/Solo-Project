import traceback
from datetime import datetime


def log_task_result(task_func):
    def wrapper(*args, **kwargs):
        start = datetime.now()
        try:
            result = task_func(*args, **kwargs)
            return result
        except Exception as e:
            traceback.print_exc()
            raise
    return wrapper
