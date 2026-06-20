import uuid
from datetime import datetime


def generate_batch_no(source: str) -> str:
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    short_uuid = uuid.uuid4().hex[:8]
    return f"{source.upper()}-{ts}-{short_uuid}"
