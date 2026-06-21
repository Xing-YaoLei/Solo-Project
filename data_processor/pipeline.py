import pandas as pd
from typing import Dict, List, Tuple, Any
from data_processor.cleaner import DataCleaner
from data_processor.deduplicator import DataDeduplicator
from data_processor.matcher import DataMatcher
from database.db import get_db_session
from database.models import Order, PaymentTransaction, RiderTrajectory
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DataPipeline:
    def __init__(self):
        self.cleaner = DataCleaner()
        self.deduplicator = DataDeduplicator()
        self.matcher = DataMatcher()

    def process_orders(self, df: pd.DataFrame, source_system: str) -> Dict[str, Any]:
        result = {
            'success': False,
            'processed_df': pd.DataFrame(),
            'issues': [],
            'stats': {}
        }

        if df.empty:
            result['issues'].append({'type': 'empty_dataframe'})
            return result

        try:
            initial_count = len(df)
            
            matched_df, match_issues = self.matcher.match_orders(df, source_system)
            result['issues'].extend(match_issues)
            
            cleaned_df, clean_issues = self.cleaner.clean_orders(matched_df)
            result['issues'].extend(clean_issues)
            
            existing_ids = self._get_existing_ids('orders')
            dedup_df, cross_dedup_issues = self.deduplicator.check_cross_source_duplicates(
                cleaned_df, existing_ids
            )
            result['issues'].extend(cross_dedup_issues)
            
            dedup_df, dedup_issues = self.deduplicator.dedup_orders(dedup_df)
            result['issues'].extend(dedup_issues)
            
            final_count = len(dedup_df)
            
            result['success'] = True
            result['processed_df'] = dedup_df
            result['stats'] = {
                'initial_count': initial_count,
                'final_count': final_count,
                'removed_count': initial_count - final_count,
                'issues_count': len(result['issues'])
            }
            
            logger.info(f"Orders processing completed: {initial_count} -> {final_count} records")
            
        except Exception as e:
            logger.error(f"Error processing orders: {str(e)}")
            result['issues'].append({'type': 'processing_error', 'message': str(e)})

        return result

    def process_payments(self, df: pd.DataFrame, source_system: str) -> Dict[str, Any]:
        result = {
            'success': False,
            'processed_df': pd.DataFrame(),
            'issues': [],
            'stats': {}
        }

        if df.empty:
            result['issues'].append({'type': 'empty_dataframe'})
            return result

        try:
            initial_count = len(df)
            
            matched_df, match_issues = self.matcher.match_payments(df, source_system)
            result['issues'].extend(match_issues)
            
            cleaned_df, clean_issues = self.cleaner.clean_payments(matched_df)
            result['issues'].extend(clean_issues)
            
            existing_ids = self._get_existing_ids('payments')
            dedup_df, cross_dedup_issues = self.deduplicator.check_cross_source_duplicates(
                cleaned_df, existing_ids
            )
            result['issues'].extend(cross_dedup_issues)
            
            dedup_df, dedup_issues = self.deduplicator.dedup_payments(dedup_df)
            result['issues'].extend(dedup_issues)
            
            final_count = len(dedup_df)
            
            result['success'] = True
            result['processed_df'] = dedup_df
            result['stats'] = {
                'initial_count': initial_count,
                'final_count': final_count,
                'removed_count': initial_count - final_count,
                'issues_count': len(result['issues'])
            }
            
            logger.info(f"Payments processing completed: {initial_count} -> {final_count} records")
            
        except Exception as e:
            logger.error(f"Error processing payments: {str(e)}")
            result['issues'].append({'type': 'processing_error', 'message': str(e)})

        return result

    def process_trajectories(self, df: pd.DataFrame, source_system: str) -> Dict[str, Any]:
        result = {
            'success': False,
            'processed_df': pd.DataFrame(),
            'issues': [],
            'stats': {}
        }

        if df.empty:
            result['issues'].append({'type': 'empty_dataframe'})
            return result

        try:
            initial_count = len(df)
            
            matched_df, match_issues = self.matcher.match_trajectories(df, source_system)
            result['issues'].extend(match_issues)
            
            cleaned_df, clean_issues = self.cleaner.clean_trajectories(matched_df)
            result['issues'].extend(clean_issues)
            
            existing_ids = self._get_existing_ids('trajectories')
            dedup_df, cross_dedup_issues = self.deduplicator.check_cross_source_duplicates(
                cleaned_df, existing_ids
            )
            result['issues'].extend(cross_dedup_issues)
            
            dedup_df, dedup_issues = self.deduplicator.dedup_trajectories(dedup_df)
            result['issues'].extend(dedup_issues)
            
            final_count = len(dedup_df)
            
            result['success'] = True
            result['processed_df'] = dedup_df
            result['stats'] = {
                'initial_count': initial_count,
                'final_count': final_count,
                'removed_count': initial_count - final_count,
                'issues_count': len(result['issues'])
            }
            
            logger.info(f"Trajectories processing completed: {initial_count} -> {final_count} records")
            
        except Exception as e:
            logger.error(f"Error processing trajectories: {str(e)}")
            result['issues'].append({'type': 'processing_error', 'message': str(e)})

        return result

    def _get_existing_ids(self, data_type: str) -> List[str]:
        try:
            with get_db_session() as session:
                if data_type == 'orders':
                    result = session.query(Order.order_id).all()
                elif data_type == 'payments':
                    result = session.query(PaymentTransaction.txn_id).all()
                elif data_type == 'trajectories':
                    result = session.query(RiderTrajectory.traj_id).all()
                else:
                    return []
                
                return [row[0] for row in result]
        except Exception as e:
            logger.warning(f"Could not get existing IDs for {data_type}: {str(e)}")
            return []

    def batch_process(self, data_batches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        
        for batch in data_batches:
            data_type = batch.get('data_type')
            df = batch.get('data')
            source = batch.get('source_system', 'unknown')
            
            if data_type == 'orders':
                result = self.process_orders(df, source)
            elif data_type == 'payments':
                result = self.process_payments(df, source)
            elif data_type == 'trajectories':
                result = self.process_trajectories(df, source)
            else:
                result = {
                    'success': False,
                    'issues': [{'type': 'unknown_data_type', 'data_type': data_type}]
                }
            
            result['batch_info'] = batch.get('info', {})
            results.append(result)
        
        return results
