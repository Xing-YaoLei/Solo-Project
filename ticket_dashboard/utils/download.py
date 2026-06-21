import io
import base64
import pandas as pd
from datetime import date
from dash import html, dcc
import dash_bootstrap_components as dbc


def generate_download_csv(df, attendance_rules_text=""):
    output = io.StringIO()

    if attendance_rules_text:
        output.write(f"# 到场率计算规则: {attendance_rules_text}\n")

    if not df.empty:
        df.to_csv(output, index=False, encoding="utf-8-sig")

    encoded = base64.b64encode(output.getvalue().encode("utf-8-sig")).decode()
    return f"data:text/csv;charset=utf-8-sig;base64,{encoded}"


def generate_download_excel(df, attendance_rules_text=""):
    output = io.BytesIO()

    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        if not df.empty:
            df.to_excel(writer, sheet_name="预约数据", index=False)

        if attendance_rules_text:
            rules_df = pd.DataFrame({"到场率计算规则": [attendance_rules_text]})
            rules_df.to_excel(writer, sheet_name="到场率规则", index=False)

    encoded = base64.b64encode(output.getvalue()).decode()
    return f"data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,{encoded}"


def format_attendance_rules_description(rules_df):
    if rules_df.empty:
        return "默认规则: 到场率 = 签到人数 / 预约人数"

    parts = []
    for _, rule in rules_df.iterrows():
        effective = ""
        if rule.get("effective_from") and rule.get("effective_to"):
            effective = f"（生效期: {rule['effective_from']} ~ {rule['effective_to']}）"
        desc = (
            f"[{rule['rule_name']}] "
            f"到场率 = {rule['numerator_source']} / {rule['denominator_source']}"
        )
        if rule["adjustment_factor"] != 1.0:
            desc += f" × {rule['adjustment_factor']}"
        desc += effective
        if rule.get("description"):
            desc += f" — {rule['description']}"
        parts.append(desc)

    return "；".join(parts)
