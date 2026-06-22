#!/usr/bin/env python
import asyncio
import sys
import os

if sys.version_info >= (3, 12):
    try:
        asyncio.get_event_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())

from streamlit.web import bootstrap
from streamlit import config as _config

if __name__ == "__main__":
    _config.set_option("server.headless", True)
    _config.set_option("server.port", 8502)
    _config.set_option("browser.gatherUsageStats", False)

    script_path = os.path.join(os.path.dirname(__file__), "app.py")
    bootstrap.run(script_path, False, [], flag_options={})
