import asyncio
import uuid
import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import text
from api.utils.database import async_session, pg_async_session, is_postgresql, TABLE_COLUMNS
from api.utils.duckdb_engine import sync_postgres_to_duckdb, get_duckdb_conn


def generate_id():
    return str(uuid.uuid4())


class SyncPipelineService:
    SOURCES = {
        "ticket_platform": {
            "name": "票务平台",
            "tables": ["orders", "ticket_types", "ticket_benefits"],
            "description": "票务平台订单与票种数据",
        },
        "gate_system": {
            "name": "闸机系统",
            "tables": ["gate_records", "check_in_records"],
            "description": "闸机通行记录与签到记录",
        },
        "payment_system": {
            "name": "支付系统",
            "tables": ["payment_records"],
            "description": "支付流水数据",
        },
    }

    async def run_full_sync(self) -> Dict[str, Any]:
        results = {}
        for source_key, source_info in self.SOURCES.items():
            result = await self.sync_source(source_key)
            results[source_key] = result
        return results

    async def sync_source(self, source: str) -> Dict[str, Any]:
        if source not in self.SOURCES:
            return {"status": "error", "message": f"Unknown source: {source}"}

        source_info = self.SOURCES[source]
        tables = source_info["tables"]
        batch_results = []
        duckdb_rows = 0

        for table_name in tables:
            batch_id = await self._sync_table(source, table_name)
            batch_results.append({"table": table_name, "batch_id": batch_id})

        async with self._get_session()() as sess:
            for table in tables:
                if table in ["orders", "payment_records", "gate_records", "check_in_records"]:
                    r = await sess.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    duckdb_rows += (r.fetchone() or [0])[0] or 0

        return {
            "status": "success",
            "source": source,
            "source_name": source_info["name"],
            "tables": tables,
            "batches": batch_results,
            "rows_synced_to_pg": duckdb_rows,
        }

    async def _sync_table(self, source: str, table_name: str) -> str:
        records = await self._pull_from_source(source, table_name)
        total_records = len(records)

        batch_id = await self.create_batch(source, table_name, total_records)
        await self.update_batch_status(batch_id, "running", processed=0)

        try:
            processed = await self._insert_records(table_name, records, batch_id)
            await self.update_batch_status(batch_id, "success", processed=processed)

            await self.sync_batch_to_duckdb(batch_id)
        except Exception as e:
            await self.update_batch_status(batch_id, "failed", error=str(e))

        return batch_id

    async def _pull_from_source(self, source: str, table_name: str) -> List[Dict[str, Any]]:
        await asyncio.sleep(0.1)

        if table_name == "orders":
            return await self._generate_mock_orders()
        elif table_name == "payment_records":
            return await self._generate_mock_payments()
        elif table_name == "gate_records":
            return await self._generate_mock_gate_records()
        elif table_name == "check_in_records":
            return await self._generate_mock_check_ins()
        elif table_name == "ticket_types":
            return []
        elif table_name == "ticket_benefits":
            return []
        else:
            return []

    async def _generate_mock_orders(self) -> List[Dict[str, Any]]:
        count = random.randint(50, 100)
        names = ["张三", "李四", "王五", "赵六", "钱七", "孙八", "周九", "吴十", "郑十一", "王十二"]
        ticket_type_map = {"tt-001": 1280, "tt-002": 680, "tt-003": 480, "tt-004": 280}
        base_date = datetime.now()
        orders = []

        for i in range(count):
            oid = f"order-{generate_id()[:8]}"
            tt_id = random.choice(["tt-001", "tt-002", "tt-003", "tt-004"])
            name = random.choice(names)
            phone = f"138{random.randint(10000000, 99999999)}"
            amount = ticket_type_map[tt_id]
            statuses = ["paid", "paid", "paid", "used", "used", "refunded"]
            status = random.choice(statuses)
            created = (base_date - timedelta(days=random.randint(0, 10), hours=random.randint(0, 20))).isoformat()
            paid = (base_date - timedelta(days=random.randint(0, 10), hours=random.randint(0, 20))).isoformat() if status != "pending" else None
            verified = (base_date - timedelta(days=random.randint(0, 5), hours=random.randint(18, 22))).isoformat() if status == "used" else None
            check_in = f"CI{random.randint(100000, 999999)}" if status in ["used"] else None

            orders.append({
                "id": oid,
                "ticket_type_id": tt_id,
                "order_no": oid.upper(),
                "buyer_name": name,
                "buyer_phone": phone,
                "amount": amount,
                "status": status,
                "created_at": created,
                "paid_at": paid,
                "verified_at": verified,
                "check_in_code": check_in,
            })

        return orders

    async def _generate_mock_payments(self) -> List[Dict[str, Any]]:
        count = random.randint(50, 100)
        payments = []
        base_date = datetime.now()

        for i in range(count):
            pid = f"pay-{generate_id()[:8]}"
            oid = f"order-{generate_id()[:8]}"
            pay_time = (base_date - timedelta(days=random.randint(0, 10), hours=random.randint(0, 20))).isoformat()

            payments.append({
                "id": pid,
                "order_id": oid,
                "transaction_id": f"TXN{random.randint(10000000, 99999999)}",
                "amount": random.choice([1280, 680, 480, 280]),
                "pay_method": random.choice(["alipay", "wechat", "card"]),
                "status": "success",
                "pay_time": pay_time,
            })

        return payments

    async def _generate_mock_gate_records(self) -> List[Dict[str, Any]]:
        count = random.randint(30, 80)
        records = []
        base_date = datetime.now()

        for i in range(count):
            gid = f"gate-{generate_id()[:8]}"
            oid = f"order-{generate_id()[:8]}"
            pass_time = (base_date - timedelta(days=random.randint(0, 5), hours=random.randint(18, 22))).isoformat()

            records.append({
                "id": gid,
                "order_id": oid,
                "gate_code": f"GATE-{random.choice(['01', '02', '03', '04'])}",
                "device_id": f"DEV{random.randint(100, 999)}",
                "direction": random.choice(["in", "out"]),
                "pass_time": pass_time,
            })

        return records

    async def _generate_mock_check_ins(self) -> List[Dict[str, Any]]:
        count = random.randint(30, 80)
        records = []
        base_date = datetime.now()

        for i in range(count):
            cid = f"checkin-{generate_id()[:8]}"
            oid = f"order-{generate_id()[:8]}"
            scan_time = (base_date - timedelta(days=random.randint(0, 5), hours=random.randint(18, 22))).isoformat()

            records.append({
                "id": cid,
                "order_id": oid,
                "check_in_code": f"CI{random.randint(100000, 999999)}",
                "scanner": f"扫码员{random.randint(1, 10)}",
                "location": f"入口{random.choice(['A', 'B', 'C', 'D'])}",
                "status": "success",
                "scan_time": scan_time,
            })

        return records

    async def create_batch(self, source: str, table_name: str, total_records: int) -> str:
        batch_id = f"batch-{source}-{generate_id()[:8]}"
        task_id = await self._get_task_id_for_source(source)
        now = datetime.now().isoformat()
        sync_date = datetime.now().date().isoformat()

        async with self._get_session()() as sess:
            await sess.execute(text("""
                INSERT INTO sync_batches (id, task_id, source, status, total_records, processed_records, start_time, sync_date)
                VALUES (:bid, :tid, :source, 'pending', :total, 0, :start, :sync_date)
            """), {
                "bid": batch_id,
                "tid": task_id,
                "source": source,
                "total": total_records,
                "start": now,
                "sync_date": sync_date,
            })
            await sess.commit()

        return batch_id

    async def _get_task_id_for_source(self, source: str) -> str:
        task_map = {
            "ticket_platform": "task-001",
            "gate_system": "task-002",
            "payment_system": "task-003",
        }
        return task_map.get(source, "task-001")

    async def update_batch_status(
        self,
        batch_id: str,
        status: str,
        processed: Optional[int] = None,
        error: Optional[str] = None,
    ):
        async with self._get_session()() as sess:
            updates = []
            params = {"bid": batch_id}

            updates.append("status = :status")
            params["status"] = status

            if processed is not None:
                updates.append("processed_records = :processed")
                params["processed"] = processed

            if status in ["success", "failed"]:
                updates.append("end_time = :end_time")
                params["end_time"] = datetime.now().isoformat()

            if error:
                updates.append("error_message = :error")
                params["error"] = error

            if updates:
                sql = f"UPDATE sync_batches SET {', '.join(updates)} WHERE id = :bid"
                await sess.execute(text(sql), params)
                await sess.commit()

    def _get_session(self):
        return pg_async_session if is_postgresql() else async_session

    async def _insert_records(self, table_name: str, records: List[Dict[str, Any]], batch_id: str) -> int:
        if not records:
            return 0

        columns = TABLE_COLUMNS.get(table_name, [])
        if not columns:
            return 0

        has_sync_batch_id = "sync_batch_id" in columns
        pg = is_postgresql()

        async with self._get_session()() as sess:
            processed = 0
            for record in records:
                if has_sync_batch_id:
                    record["sync_batch_id"] = batch_id

                cols = [c for c in columns if c in record]
                placeholders = [f":{c}" for c in cols]
                values = {c: record[c] for c in cols}

                col_str = ", ".join(cols)
                ph_str = ", ".join(placeholders)

                if pg:
                    update_sets = ", ".join([f"{c} = EXCLUDED.{c}" for c in cols if c != "id"])
                    sql = f"INSERT INTO {table_name} ({col_str}) VALUES ({ph_str}) ON CONFLICT (id) DO UPDATE SET {update_sets}"
                else:
                    sql = f"INSERT OR REPLACE INTO {table_name} ({col_str}) VALUES ({ph_str})"

                await sess.execute(text(sql), values)
                processed += 1

            await sess.commit()

        return processed

    async def sync_batch_to_duckdb(self, batch_id: str) -> Dict[str, Any]:
        async with self._get_session()() as sess:
            result = await sess.execute(text("""
                SELECT source FROM sync_batches WHERE id = :bid
            """), {"bid": batch_id})
            row = result.fetchone()
            if not row:
                return {"status": "error", "message": f"Batch not found: {batch_id}"}

            source = row[0]

        source_info = self.SOURCES.get(source, {})
        tables = source_info.get("tables", [])
        results = []

        for table in tables:
            result = await sync_postgres_to_duckdb(table, batch_id)
            results.append(result)

        return {
            "batch_id": batch_id,
            "status": "success",
            "tables_synced": len(results),
            "results": results,
        }

    async def rerun_batch(self, batch_id: str) -> Dict[str, Any]:
        async with self._get_session()() as sess:
            result = await sess.execute(text("""
                SELECT id, source, status, total_records FROM sync_batches WHERE id = :bid
            """), {"bid": batch_id})
            row = result.fetchone()
            if not row:
                return {"status": "error", "message": f"Batch not found: {batch_id}"}

            source = row[1]
            total_records = row[3]

        now = datetime.now().isoformat()
        async with self._get_session()() as sess:
            await sess.execute(text("""
                UPDATE sync_batches
                SET status = 'running', start_time = :now, end_time = NULL, error_message = NULL, processed_records = 0
                WHERE id = :bid
            """), {"bid": batch_id, "now": now})
            await sess.commit()

        try:
            source_info = self.SOURCES.get(source, {})
            tables = source_info.get("tables", [])

            for table_name in tables:
                if table_name in ["orders", "payment_records", "gate_records"]:
                    async with self._get_session()() as sess:
                        await sess.execute(text(f"""
                            DELETE FROM {table_name} WHERE sync_batch_id = :bid
                        """), {"bid": batch_id})
                        await sess.commit()

            new_records = await self._pull_from_source(source, tables[0] if tables else "")
            processed = 0
            for table_name in tables:
                table_records = await self._pull_from_source(source, table_name)
                if table_records:
                    processed += await self._insert_records(table_name, table_records, batch_id)

            await self.update_batch_status(batch_id, "success", processed=processed)
            await self.sync_batch_to_duckdb(batch_id)

            return {
                "batch_id": batch_id,
                "status": "success",
                "processed_records": processed,
            }
        except Exception as e:
            await self.update_batch_status(batch_id, "failed", error=str(e))
            return {
                "batch_id": batch_id,
                "status": "failed",
                "error": str(e),
            }

    async def get_sync_progress(self, batch_id: str) -> Dict[str, Any]:
        async with self._get_session()() as sess:
            result = await sess.execute(text("""
                SELECT id, source, status, total_records, processed_records, start_time, end_time, error_message, sync_date
                FROM sync_batches WHERE id = :bid
            """), {"bid": batch_id})
            row = result.fetchone()
            if not row:
                return {"status": "error", "message": f"Batch not found: {batch_id}"}

            progress = 0
            if row[3] and row[3] > 0:
                progress = round((row[4] or 0) * 100.0 / row[3], 2)

            return {
                "batch_id": row[0],
                "source": row[1],
                "status": row[2],
                "total_records": row[3],
                "processed_records": row[4] or 0,
                "progress_percent": progress,
                "start_time": row[5],
                "end_time": row[6],
                "error_message": row[7],
                "sync_date": row[8],
            }

    def get_sources(self) -> Dict[str, Any]:
        return self.SOURCES


sync_pipeline = SyncPipelineService()
