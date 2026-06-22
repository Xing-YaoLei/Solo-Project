import asyncio
import sys

if sys.version_info >= (3, 12):
    try:
        asyncio.get_event_loop()
    except RuntimeError:
        asyncio.set_event_loop(asyncio.new_event_loop())

import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go

from data_layer import dw
from mock_data import generate_all_data
from analytics import DataReconciliation, ConversionAnalytics, VersionAnalytics

print("所有模块导入成功")

data = generate_all_data()
print("模拟数据生成成功")

for name, df in data.items():
    dw.register_polars(name, df)
print("数据注册到 DuckDB 成功")

rec = DataReconciliation(data["case_system"], data["payment_flow"], data["email_attachments"])
conv = ConversionAnalytics(data["publish_schedule"])
ver = VersionAnalytics(data["version_history"], data["case_system"])

print("分析模块初始化成功")
print("应用准备就绪，可以使用 streamlit run app.py 启动")
