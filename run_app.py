#!/usr/bin/env python
import asyncio
import sys
import os

if sys.version_info >= (3, 12):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

from streamlit.web import bootstrap
from streamlit import config as _config

if __name__ == "__main__":
    port = int(os.environ.get("STREAMLIT_PORT", "8502"))
    _config.set_option("server.headless", True)
    _config.set_option("server.port", port)
    _config.set_option("browser.gatherUsageStats", False)
    _config.set_option("server.address", "0.0.0.0")

    script_path = os.path.join(os.path.dirname(__file__), "app.py")
    print(f"Starting Streamlit on port {port}...")
    bootstrap.run(script_path, False, [], flag_options={})
