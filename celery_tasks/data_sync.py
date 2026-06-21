import os
import requests
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Any
from celery_tasks.celery_app import celery
from data_processor.pipeline import DataPipeline
from database.db import get_db_session
from database.models import Order, PaymentTransaction, RiderTrajectory
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pipeline = DataPipeline()

ORDER_SYSTEM_API = os.getenv('ORDER_SYSTEM_API', 'http://localhost:8001/api')
PAYMENT_SYSTEM_API = os.getenv('PAYMENT_SYSTEM_API', 'http://localhost:8002/api')
MAP_SYSTEM_API = os.getenv('MAP_SYSTEM_API', 'http://localhost:8003/api')
API_TIMEOUT = int(os.getenv('API_TIMEOUT', '30'))


@celery.task(bind=True, max_retries=3)
def sync_order_data(self, start_time: str = None, end_time: str = None):
    try:
        if not start_time:
            start_time = (datetime.now() - timedelta(hours=1)).isoformat()
        if not end_time:
            end_time = datetime.now().isoformat()

        logger.info(f"Syncing orders from {start_time} to {end_time}")

        url = f"{ORDER_SYSTEM_API}/orders"
        params = {
            'start_time': start_time,
            'end_time': end_time,
            'page_size': 1000
        }

        all_data = []
        page = 1
        while True:
            params['page'] = page
            response = requests.get(url, params=params, timeout=API_TIMEOUT)
            response.raise_for_status()
            data = response.json()
            
            if not data.get('data'):
                break
                
            all_data.extend(data['data'])
            
            if len(data['data']) < params['page_size']:
                break
            page += 1

        if not all_data:
            logger.info("No new order data to sync")
            return {'status': 'success', 'records_synced': 0}

        df = pd.DataFrame(all_data)
        result = pipeline.process_orders(df, 'order_system')

        if result['success'] and not result['processed_df'].empty:
            _save_orders_to_db(result['processed_df'])
            logger.info(f"Successfully synced {result['stats']['final_count']} orders")
        else:
            logger.warning(f"Order processing completed with issues: {result['issues']}")

        return {
            'status': 'success' if result['success'] else 'partial',
            'records_synced': result['stats'].get('final_count', 0),
            'issues': result['issues']
        }

    except Exception as e:
        logger.error(f"Error syncing order data: {str(e)}")
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery.task(bind=True, max_retries=3)
def sync_payment_data(self, start_time: str = None, end_time: str = None):
    try:
        if not start_time:
            start_time = (datetime.now() - timedelta(hours=2)).isoformat()
        if not end_time:
            end_time = datetime.now().isoformat()

        logger.info(f"Syncing payments from {start_time} to {end_time}")

        url = f"{PAYMENT_SYSTEM_API}/transactions"
        params = {
            'start_time': start_time,
            'end_time': end_time,
            'page_size': 1000
        }

        all_data = []
        page = 1
        while True:
            params['page'] = page
            response = requests.get(url, params=params, timeout=API_TIMEOUT)
            response.raise_for_status()
            data = response.json()
            
            if not data.get('data'):
                break
                
            all_data.extend(data['data'])
            
            if len(data['data']) < params['page_size']:
                break
            page += 1

        if not all_data:
            logger.info("No new payment data to sync")
            return {'status': 'success', 'records_synced': 0}

        df = pd.DataFrame(all_data)
        result = pipeline.process_payments(df, 'payment_system')

        if result['success'] and not result['processed_df'].empty:
            _save_payments_to_db(result['processed_df'])
            logger.info(f"Successfully synced {result['stats']['final_count']} payments")
        else:
            logger.warning(f"Payment processing completed with issues: {result['issues']}")

        return {
            'status': 'success' if result['success'] else 'partial',
            'records_synced': result['stats'].get('final_count', 0),
            'issues': result['issues']
        }

    except Exception as e:
        logger.error(f"Error syncing payment data: {str(e)}")
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery.task(bind=True, max_retries=3)
def sync_trajectory_data(self, start_time: str = None, end_time: str = None):
    try:
        if not start_time:
            start_time = (datetime.now() - timedelta(minutes=5)).isoformat()
        if not end_time:
            end_time = datetime.now().isoformat()

        logger.info(f"Syncing trajectories from {start_time} to {end_time}")

        url = f"{MAP_SYSTEM_API}/trajectories"
        params = {
            'start_time': start_time,
            'end_time': end_time,
            'page_size': 5000
        }

        response = requests.get(url, params=params, timeout=API_TIMEOUT)
        response.raise_for_status()
        data = response.json()

        if not data.get('data'):
            logger.info("No new trajectory data to sync")
            return {'status': 'success', 'records_synced': 0}

        df = pd.DataFrame(data['data'])
        result = pipeline.process_trajectories(df, 'map_system')

        if result['success'] and not result['processed_df'].empty:
            _save_trajectories_to_db(result['processed_df'])
            logger.info(f"Successfully synced {result['stats']['final_count']} trajectories")
        else:
            logger.warning(f"Trajectory processing completed with issues: {result['issues']}")

        return {
            'status': 'success' if result['success'] else 'partial',
            'records_synced': result['stats'].get('final_count', 0),
            'issues': result['issues']
        }

    except Exception as e:
        logger.error(f"Error syncing trajectory data: {str(e)}")
        raise self.retry(exc=e, countdown=30 * (2 ** self.request.retries))


def _save_orders_to_db(df: pd.DataFrame):
    with get_db_session() as session:
        for _, row in df.iterrows():
            order = Order(
                order_id=str(row['order_id']),
                order_no=str(row['order_no']),
                user_id=str(row['user_id']),
                rider_id=str(row['rider_id']) if pd.notna(row.get('rider_id')) else None,
                merchant_id=str(row['merchant_id']),
                order_type=str(row['order_type']),
                order_status=str(row['order_status']),
                pickup_address=str(row['pickup_address']),
                pickup_lng=float(row['pickup_lng']) if pd.notna(row.get('pickup_lng')) else None,
                pickup_lat=float(row['pickup_lat']) if pd.notna(row.get('pickup_lat')) else None,
                delivery_address=str(row['delivery_address']),
                delivery_lng=float(row['delivery_lng']) if pd.notna(row.get('delivery_lng')) else None,
                delivery_lat=float(row['delivery_lat']) if pd.notna(row.get('delivery_lat')) else None,
                distance_km=float(row['distance_km']) if pd.notna(row.get('distance_km')) else None,
                estimated_amount=float(row['estimated_amount']) if pd.notna(row.get('estimated_amount')) else 0,
                actual_amount=float(row['actual_amount']) if pd.notna(row.get('actual_amount')) else 0,
                subsidy_amount=float(row['subsidy_amount']) if pd.notna(row.get('subsidy_amount')) else 0,
                create_time=row['create_time'],
                accept_time=row['accept_time'] if pd.notna(row.get('accept_time')) else None,
                pickup_time=row['pickup_time'] if pd.notna(row.get('pickup_time')) else None,
                delivery_time=row['delivery_time'] if pd.notna(row.get('delivery_time')) else None,
                cancel_time=row['cancel_time'] if pd.notna(row.get('cancel_time')) else None,
                cancel_reason=str(row['cancel_reason']) if pd.notna(row.get('cancel_reason')) else None,
                is_risk_order=bool(row.get('is_risk_order', False)),
                risk_level=str(row.get('risk_level', 'normal')),
                data_source=str(row.get('data_source', 'order_system'))
            )
            session.merge(order)
        session.commit()


def _save_payments_to_db(df: pd.DataFrame):
    with get_db_session() as session:
        for _, row in df.iterrows():
            payment = PaymentTransaction(
                txn_id=str(row['txn_id']),
                order_id=str(row['order_id']),
                user_id=str(row['user_id']),
                pay_type=str(row['pay_type']),
                pay_amount=float(row['pay_amount']),
                pay_status=str(row['pay_status']),
                pay_time=row['pay_time'] if pd.notna(row.get('pay_time')) else None,
                refund_amount=float(row['refund_amount']) if pd.notna(row.get('refund_amount')) else 0,
                refund_time=row['refund_time'] if pd.notna(row.get('refund_time')) else None,
                third_party_txn_id=str(row['third_party_txn_id']) if pd.notna(row.get('third_party_txn_id')) else None,
                currency=str(row.get('currency', 'CNY')),
                data_source=str(row.get('data_source', 'payment_system'))
            )
            session.merge(payment)
        session.commit()


def _save_trajectories_to_db(df: pd.DataFrame):
    with get_db_session() as session:
        for _, row in df.iterrows():
            trajectory = RiderTrajectory(
                traj_id=str(row['traj_id']),
                rider_id=str(row['rider_id']),
                order_id=str(row['order_id']) if pd.notna(row.get('order_id')) else None,
                lng=float(row['lng']),
                lat=float(row['lat']),
                speed_kmh=float(row['speed_kmh']) if pd.notna(row.get('speed_kmh')) else None,
                heading=float(row['heading']) if pd.notna(row.get('heading')) else None,
                accuracy_m=float(row['accuracy_m']) if pd.notna(row.get('accuracy_m')) else None,
                record_time=row['record_time'],
                data_source=str(row.get('data_source', 'map_system'))
            )
            session.merge(trajectory)
        session.commit()


@celery.task
def sync_all_data():
    order_result = sync_order_data.delay()
    payment_result = sync_payment_data.delay()
    trajectory_result = sync_trajectory_data.delay()
    
    return {
        'order_task_id': order_result.id,
        'payment_task_id': payment_result.id,
        'trajectory_task_id': trajectory_result.id
    }
