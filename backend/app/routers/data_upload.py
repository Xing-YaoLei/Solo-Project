from fastapi import APIRouter, Depends, File, UploadFile, HTTPException, Form
from sqlalchemy.orm import Session
import pandas as pd
import io
from typing import Optional
import json

from ..database import get_db
from ..data_processor import DataPipeline
from .. import schemas

router = APIRouter(prefix="/api/data", tags=["data"])


@router.post("/upload/{data_type}", response_model=schemas.DataUploadResponse)
def upload_data(
    data_type: str,
    file: UploadFile = File(...),
    source_system: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    valid_types = ['patients', 'appointments', 'billing', 'medical_records', 'treatment_plans', 'images']
    if data_type not in valid_types:
        raise HTTPException(status_code=400, detail=f"Invalid data type. Must be one of: {valid_types}")

    try:
        contents = file.file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(contents))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV, Excel, or JSON.")

        if source_system and 'source_system' not in df.columns:
            df['source_system'] = source_system

        pipeline = DataPipeline(db)
        processed = 0
        duplicated = 0
        conflicts = 0
        objects = []

        if data_type == 'patients':
            processed, duplicated, objects = pipeline.process_patients(df)
        elif data_type == 'appointments':
            processed, duplicated, objects = pipeline.process_appointments(df)
        elif data_type == 'billing':
            processed, duplicated, objects = pipeline.process_billing_records(df)
        elif data_type == 'medical_records':
            processed, duplicated, objects = pipeline.process_medical_records(df)
        elif data_type == 'treatment_plans':
            processed, duplicated, objects = pipeline.process_treatment_plans(df)
        elif data_type == 'images':
            processed, duplicated, objects = pipeline.process_image_records(df)

        pipeline.bulk_save(objects)

        if data_type in ['appointments', 'images']:
            all_appointments = []
            all_images = []

            if data_type == 'appointments':
                all_appointments = df.to_dict('records')
                from .. import models
                existing_images = db.query(models.ImageRecord).all()
                all_images = [
                    {
                        'patient_id': img.patient_id,
                        'study_date': img.study_date,
                        'image_type': img.image_type,
                        'source_system': img.source_system
                    }
                    for img in existing_images
                ]
            elif data_type == 'images':
                all_images = df.to_dict('records')
                from .. import models
                existing_appointments = db.query(models.Appointment).all()
                all_appointments = [
                    {
                        'patient_id': appt.patient_id,
                        'appointment_date': appt.appointment_date,
                        'treatment_type': appt.treatment_type,
                        'source_system': appt.source_system
                    }
                    for appt in existing_appointments
                ]

            if all_appointments and all_images:
                conflict_list = pipeline.matcher.detect_conflicts_from_data(all_appointments, all_images)
                conflicts = pipeline.save_conflicts(conflict_list)

        return schemas.DataUploadResponse(
            success=True,
            records_processed=processed,
            records_duplicated=duplicated,
            records_cleaned=processed,
            conflicts_found=conflicts,
            message=f"Successfully processed {processed} records. {duplicated} duplicates skipped. {conflicts} conflicts detected."
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.post("/bulk-import", response_model=schemas.DataUploadResponse)
def bulk_import(
    patients: UploadFile = File(None),
    appointments: UploadFile = File(None),
    billing: UploadFile = File(None),
    medical_records: UploadFile = File(None),
    treatment_plans: UploadFile = File(None),
    images: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    pipeline = DataPipeline(db)
    total_processed = 0
    total_duplicated = 0
    total_conflicts = 0

    all_appointments_data = []
    all_images_data = []

    uploads = [
        (patients, 'patients'),
        (appointments, 'appointments'),
        (billing, 'billing'),
        (medical_records, 'medical_records'),
        (treatment_plans, 'treatment_plans'),
        (images, 'images')
    ]

    for file, data_type in uploads:
        if not file:
            continue

        try:
            contents = file.file.read()
            if file.filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(contents))
            elif file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
                df = pd.read_excel(io.BytesIO(contents))
            elif file.filename.endswith('.json'):
                df = pd.read_json(io.BytesIO(contents))
            else:
                continue

            processed = 0
            duplicated = 0
            objects = []

            if data_type == 'patients':
                processed, duplicated, objects = pipeline.process_patients(df)
            elif data_type == 'appointments':
                processed, duplicated, objects = pipeline.process_appointments(df)
                all_appointments_data = df.to_dict('records')
            elif data_type == 'billing':
                processed, duplicated, objects = pipeline.process_billing_records(df)
            elif data_type == 'medical_records':
                processed, duplicated, objects = pipeline.process_medical_records(df)
            elif data_type == 'treatment_plans':
                processed, duplicated, objects = pipeline.process_treatment_plans(df)
            elif data_type == 'images':
                processed, duplicated, objects = pipeline.process_image_records(df)
                all_images_data = df.to_dict('records')

            pipeline.bulk_save(objects)
            total_processed += processed
            total_duplicated += duplicated

        except Exception:
            continue

    if all_appointments_data and all_images_data:
        conflict_list = pipeline.matcher.detect_conflicts_from_data(all_appointments_data, all_images_data)
        total_conflicts = pipeline.save_conflicts(conflict_list)

    return schemas.DataUploadResponse(
        success=True,
        records_processed=total_processed,
        records_duplicated=total_duplicated,
        records_cleaned=total_processed,
        conflicts_found=total_conflicts,
        message=f"Successfully processed {total_processed} records. {total_duplicated} duplicates skipped. {total_conflicts} conflicts detected."
    )