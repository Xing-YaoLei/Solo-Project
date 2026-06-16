#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "test_output.log")

with open(log_file, "w") as log:
    try:
        log.write("Step 1: Checking imports...\n")
        import streamlit as st
        import polars as pl
        import duckdb
        import plotly
        log.write(f"  streamlit: OK ({st.__version__})\n")
        log.write(f"  polars: OK ({pl.__version__})\n")
        log.write(f"  duckdb: OK ({duckdb.__version__})\n")
        log.write(f"  plotly: OK ({plotly.__version__})\n")

        log.write("\nStep 2: Testing database initialization...\n")
        from database import get_db
        db = get_db()
        log.write("  DuckDB connection: OK\n")

        log.write("\nStep 3: Generating test data (small subset)...\n")
        from data_models import generate_patients, generate_risk_daily
        patients = generate_patients(10)
        log.write(f"  Generated {len(patients)} patients\n")

        risk_daily, fee_logs, med_gaps, dev_changes, ins_denials = generate_risk_daily(patients, 30)
        log.write(f"  Generated {len(risk_daily)} risk records\n")
        log.write(f"  Generated {len(fee_logs)} fee delay logs\n")
        log.write(f"  Generated {len(med_gaps)} medical gaps\n")
        log.write(f"  Generated {len(dev_changes)} device changes\n")
        log.write(f"  Generated {len(ins_denials)} insurance denials\n")

        log.write("\nStep 4: Inserting data into DuckDB...\n")
        db.insert_dataframe("patients", patients)
        db.insert_dataframe("patient_risk_daily", risk_daily)
        db.insert_dataframe("fee_table_sync_log", fee_logs)
        db.insert_dataframe("medical_record_gaps", med_gaps)
        db.insert_dataframe("device_calibration_changes", dev_changes)
        db.insert_dataframe("insurance_denials", ins_denials)
        log.write("  Data inserted successfully\n")

        log.write("\nStep 5: Testing data queries...\n")
        from data_service import get_service
        service = get_service()
        result = service.get_patient_summary()
        log.write(f"  get_patient_summary: {len(result)} rows\n")

        from datetime import date, timedelta
        end = date.today()
        start = end - timedelta(days=29)
        trend = service.get_risk_trend(start, end, None, "avg")
        log.write(f"  get_risk_trend: {len(trend)} rows\n")

        log.write("\nStep 6: Testing chart generation...\n")
        from charts import create_risk_monitor_chart
        fig = create_risk_monitor_chart(trend, fee_logs, dev_changes, [])
        log.write(f"  create_risk_monitor_chart: OK (type: {type(fig).__name__})\n")

        log.write("\n" + "="*60 + "\n")
        log.write("ALL TESTS PASSED ✅\n")
        log.write("="*60 + "\n")

    except Exception as e:
        import traceback
        log.write(f"\nERROR: {e}\n")
        log.write(traceback.format_exc())

print(f"Test output written to: {log_file}")
