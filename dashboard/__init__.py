from .app import app, server
from .callbacks import register_callbacks

register_callbacks(app)

__all__ = ["app", "server"]
