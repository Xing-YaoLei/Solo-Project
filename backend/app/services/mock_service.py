from __future__ import annotations

import random
import uuid
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional


STORE_DATA = [
    {"name": "北京朝阳旗舰店", "code": "BJ-CY-001", "region": "北京", "address": "北京市朝阳区建国路88号", "lng": 116.4621, "lat": 39.9073},
    {"name": "上海浦东中心店", "code": "SH-PD-002", "region": "上海", "address": "上海市浦东新区世纪大道1000号", "lng": 121.5150, "lat": 31.2335},
    {"name": "广州天河精品店", "code": "GZ-TH-003", "region": "广州", "address": "广州市天河区珠江新城华夏路16号", "lng": 113.3245, "lat": 23.1291},
    {"name": "深圳南山旗舰店", "code": "SZ-NS-004", "region": "深圳", "address": "深圳市南山区科技园高新南一道8号", "lng": 113.9348, "lat": 22.5308},
    {"name": "杭州西湖中心店", "code": "HZ-XH-005", "region": "杭州", "address": "杭州市西湖区文三路398号", "lng": 120.1200, "lat": 30.2741},
    {"name": "成都武侯精品店", "code": "CD-WH-006", "region": "成都", "address": "成都市武侯区天府大道北段1700号", "lng": 104.0668, "lat": 30.5728},
    {"name": "武汉江汉旗舰店", "code": "WH-JH-007", "region": "武汉", "address": "武汉市江汉区建设大道568号", "lng": 114.2710, "lat": 30.5928},
    {"name": "西安高新中心店", "code": "XA-GX-008", "region": "西安", "address": "西安市雁塔区高新路50号", "lng": 108.9468, "lat": 34.2594},
]

BRANDS_MODELS = [
    ("宝马", "3系"), ("宝马", "5系"), ("宝马", "X3"), ("宝马", "X5"),
    ("奔驰", "C级"), ("奔驰", "E级"), ("奔驰", "GLC"), ("奔驰", "GLE"),
    ("奥迪", "A4L"), ("奥迪", "A6L"), ("奥迪", "Q5L"), ("奥迪", "Q7"),
    ("特斯拉", "Model 3"), ("特斯拉", "Model Y"), ("特斯拉", "Model S"),
    ("比亚迪", "汉EV"), ("比亚迪", "唐DM"), ("比亚迪", "宋PLUS"),
    ("丰田", "凯美瑞"), ("丰田", "汉兰达"), ("丰田", "RAV4"),
    ("本田", "雅阁"), ("本田", "CR-V"), ("本田", "思域"),
    ("大众", "迈腾"), ("大众", "帕萨特"), ("大众", "途观L"),
    ("蔚来", "ES6"), ("蔚来", "ET5"), ("理想", "L7"), ("理想", "L9"),
    ("小鹏", "P7"), ("小鹏", "G9"),
]

DOCUMENT_TYPES = [
    ("driving_license", "行驶证"),
    ("registration_cert", "机动车登记证书"),
    ("purchase_tax", "购置税完税证明"),
    ("insurance_policy", "交强险保单"),
    ("invoice", "二手车销售发票"),
    ("other", "其他材料"),
]

RISK_LEVELS = ["low", "medium", "high", "critical"]
STAGES = ["inbound", "preparation", "test_drive", "quoting", "deal", "transfer"]


def _rand_uuid() -> str:
    return str(uuid.uuid4())


def _rand_vin() -> str:
    chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"
    return "".join(random.choice(chars) for _ in range(17))


def _rand_plate(region: str) -> str:
    prefix_map = {"北京": "京", "上海": "沪", "广州": "粤A", "深圳": "粤B", "杭州": "浙A", "成都": "川A", "武汉": "鄂A", "西安": "陕A"}
    prefix = prefix_map.get(region, "京")
    chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
    return prefix + "".join(random.choice(chars) for _ in range(5))


def _days_ago(n: int) -> date:
    return (datetime.now() - timedelta(days=n)).date()


def _hours_ago(n: int) -> datetime:
    return datetime.now() - timedelta(hours=n)


class MockService:
    _instance = None
    _stores: List[Dict] = []
    _vehicles: List[Dict] = []
    _alerts: List[Dict] = []
    _rules: List[Dict] = []

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._init_data()
        return cls._instance

    def _init_data(self):
        self._stores = self.generate_mock_stores()
        self._vehicles = self.generate_mock_vehicles(self._stores)
        self._alerts = self.generate_mock_alerts(self._stores, self._vehicles)
        self._rules = self.generate_mock_rules()

    def generate_mock_stores(self) -> List[Dict]:
        stores = []
        for s in STORE_DATA:
            risk_score = random.randint(5, 95)
            in_stock = random.randint(10, 50)
            alert_count = random.randint(2, 15)
            stores.append({
                "id": _rand_uuid(),
                "name": s["name"],
                "code": s["code"],
                "region": s["region"],
                "address": s["address"],
                "lng": s["lng"],
                "lat": s["lat"],
                "riskScore": risk_score,
                "inStockCount": in_stock,
                "alertCount": alert_count,
                "risk_score": risk_score,
                "in_stock_count": in_stock,
                "alert_count": alert_count,
                "createdAt": _hours_ago(random.randint(500, 2000)).isoformat(),
                "updatedAt": _hours_ago(random.randint(10, 100)).isoformat(),
                "created_at": _hours_ago(random.randint(500, 2000)).isoformat(),
                "updated_at": _hours_ago(random.randint(10, 100)).isoformat(),
            })
        return stores

    def generate_mock_vehicles(self, stores: Optional[List[Dict]] = None) -> List[Dict]:
        if stores is None:
            stores = self._stores
        vehicles = []
        for i in range(30):
            store = random.choice(stores)
            brand, model = random.choice(BRANDS_MODELS)
            year = random.randint(2018, 2024)
            mileage = random.randint(5000, 120000)
            stock_days = random.randint(1, 120)
            inbound = _days_ago(stock_days)
            stage = random.choices(STAGES, weights=[3, 4, 2, 2, 1, 1])[0]
            completion = random.randint(20, 100)
            risk = random.choices(RISK_LEVELS, weights=[5, 3, 2, 1])[0]

            docs = []
            for dt, dn in DOCUMENT_TYPES:
                status = "present" if random.random() < (completion / 100) else random.choice(["missing", "pending"])
                docs.append({
                    "id": _rand_uuid(),
                    "doc_type": dt,
                    "display_name": dn,
                    "documentType": dt,
                    "documentName": dn,
                    "status": status,
                    "uploaded_at": _hours_ago(random.randint(24, 500)).isoformat() if status == "present" else None,
                    "verified": status == "present" and random.random() > 0.3,
                })

            vehicles.append({
                "id": _rand_uuid(),
                "vin": _rand_vin(),
                "plateNumber": _rand_plate(store["region"]),
                "plate_number": _rand_plate(store["region"]),
                "brand": brand,
                "model": model,
                "year": year,
                "mileage": mileage,
                "storeId": store["id"],
                "store_id": store["id"],
                "storeName": store["name"],
                "inboundDate": inbound.isoformat(),
                "inbound_date": inbound.isoformat(),
                "stage": stage,
                "stockDays": stock_days,
                "stock_days": stock_days,
                "documentCompletion": completion,
                "document_completion": completion,
                "riskLevel": risk,
                "risk_level": risk,
                "documents": docs,
                "createdAt": _hours_ago(stock_days * 24 + random.randint(1, 10)).isoformat(),
                "updatedAt": _hours_ago(random.randint(1, 48)).isoformat(),
                "created_at": _hours_ago(stock_days * 24 + random.randint(1, 10)).isoformat(),
                "updated_at": _hours_ago(random.randint(1, 48)).isoformat(),
            })
        return vehicles

    def generate_mock_alerts(self, stores: Optional[List[Dict]] = None, vehicles: Optional[List[Dict]] = None) -> List[Dict]:
        if stores is None:
            stores = self._stores
        if vehicles is None:
            vehicles = self._vehicles
        rule_names = [
            ("R001", "行驶证缺失超过7天", "high"),
            ("R002", "登记证书未上传", "medium"),
            ("R003", "库龄超过60天未过户", "critical"),
            ("R004", "购置税证明缺失", "medium"),
            ("R005", "保单即将到期", "low"),
            ("R006", "过户材料完整度低于50%", "high"),
        ]
        alerts = []
        for i in range(25):
            vehicle = random.choice(vehicles)
            store = next((s for s in stores if s["id"] == vehicle["storeId"]), stores[0])
            rule_id, rule_name, level = random.choice(rule_names)
            doc_type, doc_name = random.choice(DOCUMENT_TYPES)
            triggered = _hours_ago(random.randint(1, 480))
            acknowledged = random.random() > 0.6
            resolved = random.random() > 0.7 if acknowledged else False

            alerts.append({
                "id": _rand_uuid(),
                "vehicleId": vehicle["id"],
                "vehicle_id": vehicle["id"],
                "vin": vehicle["vin"],
                "storeId": store["id"],
                "store_id": store["id"],
                "storeName": store["name"],
                "store_name": store["name"],
                "documentType": doc_type,
                "documentName": doc_name,
                "doc_type": doc_type,
                "ruleId": rule_id,
                "rule_id": rule_id,
                "ruleName": rule_name,
                "rule_name": rule_name,
                "level": level,
                "message": f"车辆{vehicle['vin']}({store['name']}) - {rule_name}",
                "triggeredAt": triggered.isoformat(),
                "triggered_at": triggered.isoformat(),
                "acknowledged": acknowledged,
                "acknowledgedAt": _hours_ago(random.randint(1, 200)).isoformat() if acknowledged else None,
                "acknowledged_at": _hours_ago(random.randint(1, 200)).isoformat() if acknowledged else None,
                "resolved": resolved,
                "resolvedAt": _hours_ago(random.randint(1, 100)).isoformat() if resolved else None,
                "resolved_at": _hours_ago(random.randint(1, 100)).isoformat() if resolved else None,
                "stockDays": vehicle["stockDays"],
                "stock_days": vehicle["stockDays"],
            })
        return sorted(alerts, key=lambda x: x["triggeredAt"], reverse=True)

    def generate_mock_rules(self) -> List[Dict]:
        rules = [
            {
                "id": _rand_uuid(),
                "name": "行驶证缺失超7天",
                "description": "车辆入库7天后行驶证仍未上传，触发预警",
                "expression": "doc_status(driving_license) != 'present' AND stock_days > 7",
                "level": "high",
                "enabled": True,
                "createdAt": _days_ago(30).isoformat(),
                "updatedAt": _days_ago(5).isoformat(),
                "created_at": _days_ago(30).isoformat(),
                "updated_at": _days_ago(5).isoformat(),
                "params": {"thresholds": {"missing_days": 7}, "docType": "driving_license"},
            },
            {
                "id": _rand_uuid(),
                "name": "登记证书缺失",
                "description": "机动车登记证书未上传",
                "expression": "doc_status(registration_cert) != 'present'",
                "level": "medium",
                "enabled": True,
                "createdAt": _days_ago(28).isoformat(),
                "updatedAt": _days_ago(3).isoformat(),
                "created_at": _days_ago(28).isoformat(),
                "updated_at": _days_ago(3).isoformat(),
                "params": {"thresholds": {}, "docType": "registration_cert"},
            },
            {
                "id": _rand_uuid(),
                "name": "库龄超60天未过户",
                "description": "车辆在库超过60天仍未完成过户流程",
                "expression": "stock_days > 60 AND stage NOT IN ('transfer', 'deal')",
                "level": "critical",
                "enabled": True,
                "createdAt": _days_ago(25).isoformat(),
                "updatedAt": _days_ago(10).isoformat(),
                "created_at": _days_ago(25).isoformat(),
                "updated_at": _days_ago(10).isoformat(),
                "params": {"thresholds": {"max_stock_days": 60}},
            },
            {
                "id": _rand_uuid(),
                "name": "购置税证明缺失",
                "description": "购置税完税证明未上传",
                "expression": "doc_status(purchase_tax) != 'present'",
                "level": "medium",
                "enabled": False,
                "createdAt": _days_ago(20).isoformat(),
                "updatedAt": _days_ago(15).isoformat(),
                "created_at": _days_ago(20).isoformat(),
                "updated_at": _days_ago(15).isoformat(),
                "params": {"thresholds": {}, "docType": "purchase_tax"},
            },
            {
                "id": _rand_uuid(),
                "name": "材料完整度低于50%",
                "description": "过户所需材料完整度不足50%",
                "expression": "document_completion < 50",
                "level": "high",
                "enabled": True,
                "createdAt": _days_ago(18).isoformat(),
                "updatedAt": _days_ago(2).isoformat(),
                "created_at": _days_ago(18).isoformat(),
                "updated_at": _days_ago(2).isoformat(),
                "params": {"thresholds": {"min_completion": 50}},
            },
            {
                "id": _rand_uuid(),
                "name": "保单30天内到期",
                "description": "交强险保单将在30天内到期",
                "expression": "doc_expire_days(insurance_policy) < 30 AND doc_status(insurance_policy) == 'present'",
                "level": "low",
                "enabled": True,
                "createdAt": _days_ago(15).isoformat(),
                "updatedAt": _days_ago(1).isoformat(),
                "created_at": _days_ago(15).isoformat(),
                "updated_at": _days_ago(1).isoformat(),
                "params": {"thresholds": {"expire_days": 30}, "docType": "insurance_policy"},
            },
        ]
        return rules

    def generate_matrix_bubbles(self) -> List[Dict]:
        age_buckets = ["0-7天", "8-30天", "31-60天", "61+天"]
        comp_buckets = ["<50%", "50-75%", "76-95%", "96-100%"]
        bubbles = []
        all_vins = [v["vin"] for v in self._vehicles]
        for i, age in enumerate(age_buckets):
            for j, comp in enumerate(comp_buckets):
                count = random.randint(1, 8)
                level = random.choices(RISK_LEVELS, weights=[4, 3, 2, 1])[0]
                vins = random.sample(all_vins, min(count, len(all_vins)))
                bubbles.append({
                    "id": f"bubble-{i}-{j}",
                    "stockAgeBucket": age,
                    "stock_age_bucket": age,
                    "completionBucket": comp,
                    "completion_bucket": comp,
                    "x": i,
                    "y": j,
                    "count": count,
                    "riskLevel": level,
                    "risk_level": level,
                    "vehicleIds": vins,
                    "vehicle_ids": vins,
                })
        return bubbles

    def generate_preparation_trend(self, days: int = 30) -> List[Dict]:
        data = []
        base = random.randint(8, 15)
        for i in range(days):
            d = _days_ago(days - i - 1)
            in_stock = base + random.randint(-3, 5)
            completed = max(0, in_stock - random.randint(1, 4))
            data.append({
                "date": d.isoformat(),
                "inStock": in_stock,
                "completed": completed,
                "in_stock": in_stock,
                "avg_prep_days": round(random.uniform(3.5, 8.2), 1),
            })
            base = in_stock
        return data

    def generate_test_drive_distribution(self, weeks: int = 12) -> List[Dict]:
        data = []
        for i in range(weeks):
            start = _days_ago((weeks - i) * 7)
            end = _days_ago((weeks - i - 1) * 7 - 1)
            total = random.randint(20, 80)
            data.append({
                "week": f"W{i+1}",
                "startDate": start.isoformat(),
                "endDate": end.isoformat(),
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
                "total": total,
                "converted": random.randint(3, total // 2),
                "conversionRate": round(random.uniform(0.1, 0.4), 3),
                "conversion_rate": round(random.uniform(0.1, 0.4), 3),
            })
        return data

    def generate_quote_candles(self, days: int = 30) -> List[Dict]:
        data = []
        base_price = 200000
        for i in range(days):
            d = _days_ago(days - i - 1)
            open_p = base_price + random.randint(-10000, 10000)
            close_p = open_p + random.randint(-8000, 8000)
            high_p = max(open_p, close_p) + random.randint(1000, 6000)
            low_p = min(open_p, close_p) - random.randint(1000, 6000)
            data.append({
                "date": d.isoformat(),
                "open": open_p,
                "high": high_p,
                "low": low_p,
                "close": close_p,
                "volume": random.randint(5, 30),
                "quoteCount": random.randint(10, 50),
                "quote_count": random.randint(10, 50),
            })
            base_price = close_p
        return data

    def generate_sync_delay_info(self) -> List[Dict]:
        sources = [
            ("vehicle_source", "车源库", random.randint(25, 60), True),
            ("finance", "金融系统", random.uniform(0.5, 6), False),
            ("inspector", "检测仪数据", random.uniform(0.2, 4), False),
        ]
        info = []
        for src, name, delay, is_delayed in sources:
            last = _hours_ago(int(delay) + random.randint(0, 5))
            info.append({
                "source": src,
                "sourceName": name,
                "source_name": name,
                "lastSyncAt": last.isoformat(),
                "last_sync_at": last.isoformat(),
                "delayHours": round(delay, 1) if isinstance(delay, float) else delay,
                "delay_hours": round(delay, 1) if isinstance(delay, float) else delay,
                "affectedFrom": _hours_ago(int(delay) + 48).isoformat() if is_delayed else None,
                "affectedTo": _hours_ago(int(delay)).isoformat() if is_delayed else None,
                "affected_from": _hours_ago(int(delay) + 48).isoformat() if is_delayed else None,
                "affected_to": _hours_ago(int(delay)).isoformat() if is_delayed else None,
                "isDelayed": is_delayed,
                "is_delayed": is_delayed,
            })
        return info

    def generate_review_data(self, vin: str) -> Dict:
        vehicle = next((v for v in self._vehicles if v["vin"].lower() == vin.lower()), self._vehicles[0])
        store = next((s for s in self._stores if s["id"] == vehicle["storeId"]), self._stores[0])

        timeline = []
        base_days = vehicle["stockDays"]
        timeline.append({
            "time": _days_ago(base_days).isoformat(),
            "stage": "inbound",
            "title": "车辆入库",
            "description": f"{vehicle['brand']} {vehicle['model']} 入库 {store['name']}",
            "operator": "系统自动",
        })
        stages_timeline = [
            ("preparation", "开始整备", "车辆进入整备车间"),
            ("test_drive", "试驾登记", f"完成{random.randint(1, 5)}次客户试驾"),
            ("quoting", "报价阶段", f"收到{random.randint(2, 8)}条报价"),
            ("deal", "成交签约", "与客户达成交易意向"),
            ("transfer", "过户办理", "车管所过户手续办理中"),
        ]
        done_count = min(random.randint(1, len(stages_timeline)), STAGES.index(vehicle["stage"]))
        for i in range(done_count):
            key, title, desc = stages_timeline[i]
            timeline.append({
                "time": _days_ago(max(1, base_days - (i + 1) * random.randint(3, 10))).isoformat(),
                "stage": key,
                "title": title,
                "description": desc,
                "operator": random.choice(["张经理", "李主管", "王顾问"]),
            })

        prep_records = []
        prep_items = [("外观清洗", "美容"), ("内饰清洁", "美容"), ("机油更换", "保养"),
                      ("刹车片检查", "安全"), ("轮胎检测", "安全"), ("空调滤芯", "保养")]
        for name, cat in prep_items[:random.randint(3, 6)]:
            cost = random.randint(100, 2000)
            started = _days_ago(random.randint(5, base_days))
            prep_records.append({
                "id": _rand_uuid(),
                "itemName": name,
                "item_name": name,
                "category": cat,
                "cost": cost,
                "status": random.choice(["done", "done", "in_progress"]),
                "startedAt": started.isoformat(),
                "started_at": started.isoformat(),
                "completedAt": (started + timedelta(hours=random.randint(2, 24))).isoformat(),
                "completed_at": (started + timedelta(hours=random.randint(2, 24))).isoformat(),
            })

        td_records = []
        for _ in range(random.randint(1, 5)):
            mb = vehicle["mileage"] + random.randint(0, 100)
            ma = mb + random.randint(5, 50)
            td_records.append({
                "id": _rand_uuid(),
                "customerName": random.choice(["陈先生", "刘女士", "赵先生", "孙先生", "周女士"]),
                "customer_name": random.choice(["陈先生", "刘女士", "赵先生", "孙先生", "周女士"]),
                "customerPhone": f"138{random.randint(10000000, 99999999)}",
                "customer_phone": f"138{random.randint(10000000, 99999999)}",
                "mileageBefore": mb,
                "mileage_after": ma,
                "mileageAfter": ma,
                "mileage_before": mb,
                "salesman": random.choice(["销售小王", "顾问小李", "销售小张"]),
                "rating": random.randint(3, 5),
                "driveAt": _days_ago(random.randint(1, base_days)).isoformat(),
                "drive_at": _days_ago(random.randint(1, base_days)).isoformat(),
                "feedback": random.choice(["动力不错，空间够用", "驾驶体验好，考虑中", "车况满意", "整体满意，需要再比较"]),
            })

        quote_records = []
        for _ in range(random.randint(2, 6)):
            amount = random.randint(100000, 500000)
            is_deal = random.random() < 0.3
            quote_records.append({
                "id": _rand_uuid(),
                "amount": amount,
                "source": random.choice(["门店", "线上平台", "老客户推荐", "合作伙伴"]),
                "customerContact": random.choice(["陈先生", "刘女士", "赵先生", "孙先生"]),
                "customer_contact": random.choice(["陈先生", "刘女士", "赵先生", "孙先生"]),
                "isDeal": is_deal,
                "is_deal": is_deal,
                "dealPrice": amount + random.randint(-5000, 5000) if is_deal else None,
                "deal_price": amount + random.randint(-5000, 5000) if is_deal else None,
                "quotedAt": _days_ago(random.randint(1, base_days)).isoformat(),
                "quoted_at": _days_ago(random.randint(1, base_days)).isoformat(),
            })

        alerts_for_v = [a for a in self._alerts if a["vin"] == vehicle["vin"]]

        return {
            "vehicle": vehicle,
            "store": store,
            "timeline": timeline,
            "preparation_records": prep_records,
            "test_drive_records": td_records,
            "quote_records": quote_records,
            "documents": vehicle["documents"],
            "alerts": alerts_for_v,
            "risk_assessment": {
                "level": vehicle["riskLevel"],
                "score": random.randint(10, 90),
                "suggestions": [
                    "尽快补充缺失的过户材料",
                    "库龄较长建议加大营销力度",
                    "材料完整度尚可，可加快过户流程",
                ][:random.randint(1, 3)],
            },
        }

    def get_stores(self) -> List[Dict]:
        return self._stores

    def get_store_by_id(self, store_id: str) -> Optional[Dict]:
        for s in self._stores:
            if s["id"] == store_id:
                vehicles_in_store = [v for v in self._vehicles if v["storeId"] == store_id]
                alerts_in_store = [a for a in self._alerts if a["storeId"] == store_id]
                result = dict(s)
                result["vehicles"] = vehicles_in_store
                result["alerts"] = alerts_in_store
                return result
        return None

    def get_vehicles(self, page: int = 1, page_size: int = 20, store_id: Optional[str] = None, risk_level: Optional[str] = None) -> Dict:
        filtered = self._vehicles
        if store_id:
            filtered = [v for v in filtered if v["storeId"] == store_id]
        if risk_level:
            filtered = [v for v in filtered if v["riskLevel"] == risk_level]
        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        items = filtered[start:end]
        return {"items": items, "total": total, "page": page, "page_size": page_size, "totalPages": (total + page_size - 1) // page_size}

    def get_vehicle_by_vin(self, vin: str) -> Optional[Dict]:
        for v in self._vehicles:
            if v["vin"].lower() == vin.lower():
                return v
        return None

    def get_alerts(self, page: int = 1, page_size: int = 20, level: Optional[str] = None, resolved: Optional[bool] = None, store_id: Optional[str] = None) -> Dict:
        filtered = self._alerts
        if level:
            filtered = [a for a in filtered if a["level"] == level]
        if resolved is not None:
            filtered = [a for a in filtered if a["resolved"] == resolved]
        if store_id:
            filtered = [a for a in filtered if a["storeId"] == store_id]
        total = len(filtered)
        start = (page - 1) * page_size
        end = start + page_size
        items = filtered[start:end]
        return {"items": items, "total": total, "page": page, "page_size": page_size, "totalPages": (total + page_size - 1) // page_size}

    def update_alert_acknowledge(self, alert_id: str) -> bool:
        for a in self._alerts:
            if a["id"] == alert_id:
                a["acknowledged"] = True
                a["acknowledgedAt"] = datetime.now().isoformat()
                a["acknowledged_at"] = datetime.now().isoformat()
                return True
        return False

    def update_alert_resolve(self, alert_id: str) -> bool:
        for a in self._alerts:
            if a["id"] == alert_id:
                a["resolved"] = True
                a["resolvedAt"] = datetime.now().isoformat()
                a["resolved_at"] = datetime.now().isoformat()
                a["acknowledged"] = True
                return True
        return False

    def get_rules(self) -> List[Dict]:
        return self._rules

    def get_rule_by_id(self, rule_id: str) -> Optional[Dict]:
        for r in self._rules:
            if r["id"] == rule_id:
                return r
        return None

    def create_rule(self, data: Dict) -> Dict:
        new_rule = {
            "id": _rand_uuid(),
            "name": data.get("name", "新规则"),
            "description": data.get("description", ""),
            "expression": data.get("dsl_expression", data.get("expression", "")),
            "dsl_expression": data.get("dsl_expression", data.get("expression", "")),
            "level": data.get("default_level", data.get("level", "medium")),
            "default_level": data.get("default_level", data.get("level", "medium")),
            "enabled": data.get("enabled", True),
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "params": data.get("params", {}),
        }
        self._rules.append(new_rule)
        return new_rule

    def update_rule(self, rule_id: str, data: Dict) -> Optional[Dict]:
        for r in self._rules:
            if r["id"] == rule_id:
                for k, v in data.items():
                    if v is not None:
                        r[k] = v
                        if k == "params" and isinstance(v, dict):
                            r["params"] = {**r.get("params", {}), **v}
                r["updatedAt"] = datetime.now().isoformat()
                r["updated_at"] = datetime.now().isoformat()
                return r
        return None

    def toggle_rule(self, rule_id: str, enabled: bool) -> Optional[Dict]:
        return self.update_rule(rule_id, {"enabled": enabled})

    def dry_run_rule(self, rule_id: str) -> Dict:
        matched = random.randint(2, 15)
        sample_vins = random.sample([v["vin"] for v in self._vehicles], min(matched, 5))
        return {
            "matchedCount": matched,
            "matched_count": matched,
            "sampleVehicles": sample_vins,
            "sample_vehicles": sample_vins,
            "estimatedImpact": f"{matched} 辆车辆会触发此预警",
            "estimated_impact": f"{matched} 辆车辆会触发此预警",
        }

    def get_dashboard_summary(self) -> Dict:
        total_vehicles = len(self._vehicles)
        total_alerts = len(self._alerts)
        high_risk = len([v for v in self._vehicles if v["riskLevel"] in ("high", "critical")])
        unacknowledged = len([a for a in self._alerts if not a["acknowledged"]])
        open_alerts = len([a for a in self._alerts if not a["resolved"]])
        critical = len([a for a in self._alerts if a["level"] == "critical"])
        high_a = len([a for a in self._alerts if a["level"] == "high"])
        medium_a = len([a for a in self._alerts if a["level"] == "medium"])
        low_a = len([a for a in self._alerts if a["level"] == "low"])
        return {
            "inStockCount": total_vehicles,
            "in_stock_count": total_vehicles,
            "alertCount": total_alerts,
            "alert_count": total_alerts,
            "openAlertCount": open_alerts,
            "open_alert_count": open_alerts,
            "highRiskRatio": round(high_risk / total_vehicles, 3) if total_vehicles else 0,
            "high_risk_ratio": round(high_risk / total_vehicles, 3) if total_vehicles else 0,
            "highRiskCount": high_risk,
            "high_risk_count": high_risk,
            "unacknowledgedCount": unacknowledged,
            "unacknowledged_count": unacknowledged,
            "avgMaterialHours": round(random.uniform(12, 72), 1),
            "avg_material_hours": round(random.uniform(12, 72), 1),
            "transferRate30d": round(random.uniform(0.35, 0.7), 3),
            "transfer_rate_30d": round(random.uniform(0.35, 0.7), 3),
            "missingTop3": [
                {"docType": "registration_cert", "docName": "登记证书", "missingCount": random.randint(3, 10)},
                {"docType": "purchase_tax", "docName": "购置税证明", "missingCount": random.randint(2, 8)},
                {"docType": "insurance_policy", "docName": "交强险保单", "missingCount": random.randint(1, 6)},
            ],
            "missing_top3": [
                {"doc_type": "registration_cert", "doc_name": "登记证书", "missing_count": random.randint(3, 10)},
                {"doc_type": "purchase_tax", "doc_name": "购置税证明", "missing_count": random.randint(2, 8)},
                {"doc_type": "insurance_policy", "doc_name": "交强险保单", "missing_count": random.randint(1, 6)},
            ],
            "levelDistribution": {"critical": critical, "high": high_a, "medium": medium_a, "low": low_a},
            "level_distribution": {"critical": critical, "high": high_a, "medium": medium_a, "low": low_a},
            "todayNew": random.randint(1, 8),
            "today_new": random.randint(1, 8),
            "trend": {"7d": random.randint(-5, 15), "30d": random.randint(-10, 30)},
        }

    def get_alert_stats(self) -> Dict:
        critical = len([a for a in self._alerts if a["level"] == "critical" and not a["resolved"]])
        high_a = len([a for a in self._alerts if a["level"] == "high" and not a["resolved"]])
        medium_a = len([a for a in self._alerts if a["level"] == "medium" and not a["resolved"]])
        low_a = len([a for a in self._alerts if a["level"] == "low" and not a["resolved"]])
        total = len(self._alerts)
        open_count = len([a for a in self._alerts if not a["resolved"]])
        return {
            "total": total,
            "open": open_count,
            "todayNew": random.randint(1, 8),
            "today_new": random.randint(1, 8),
            "unacknowledged": len([a for a in self._alerts if not a["acknowledged"]]),
            "high": high_a,
            "critical": critical,
            "levelDistribution": {"critical": critical, "high": high_a, "medium": medium_a, "low": low_a},
            "level_distribution": {"critical": critical, "high": high_a, "medium": medium_a, "low": low_a},
            "avgResolutionHours": round(random.uniform(2, 48), 1),
            "avg_resolution_hours": round(random.uniform(2, 48), 1),
        }

    def get_document_missing_distribution(self) -> List[Dict]:
        age_buckets = ["0-7天", "8-30天", "31-60天", "61+天"]
        result = []
        for dt, dn in DOCUMENT_TYPES:
            for ab in age_buckets:
                result.append({
                    "docType": dt,
                    "doc_type": dt,
                    "docName": dn,
                    "doc_name": dn,
                    "stockAgeBucket": ab,
                    "stock_age_bucket": ab,
                    "count": random.randint(0, 6),
                })
        return result

    def get_sync_status(self) -> Dict:
        return {
            "vehicle_source": {
                "lastSync": _hours_ago(30).isoformat(),
                "last_sync": _hours_ago(30).isoformat(),
                "status": "delayed",
                "delayHours": 30.5,
                "delay_hours": 30.5,
                "recordsCount": 2350,
                "records_count": 2350,
            },
            "finance": {
                "lastSync": _hours_ago(2).isoformat(),
                "last_sync": _hours_ago(2).isoformat(),
                "status": "ok",
                "delayHours": 2.1,
                "delay_hours": 2.1,
                "recordsCount": 890,
                "records_count": 890,
            },
            "inspector": {
                "lastSync": _hours_ago(1).isoformat(),
                "last_sync": _hours_ago(1).isoformat(),
                "status": "ok",
                "delayHours": 1.2,
                "delay_hours": 1.2,
                "recordsCount": 560,
                "records_count": 560,
            },
        }

    def get_etl_stats(self) -> Dict:
        return {
            "extract": {"records": 3800, "durationMs": 1250, "duration_ms": 1250},
            "transform": {
                "deduped": 127,
                "normalized": 856,
                "filled": 234,
                "invalidRemoved": 18,
                "invalid_removed": 18,
            },
            "load": {"inserted": 3210, "updated": 420, "failed": 5},
            "totalDurationMs": 5820,
            "total_duration_ms": 5820,
            "summary": {
                "dedupeCount": 127,
                "dedupe_count": 127,
                "normalizationCount": 856,
                "normalization_count": 856,
                "missingFillCount": 234,
                "missing_fill_count": 234,
                "successRate": round(3210 / 3800, 4),
                "success_rate": round(3210 / 3800, 4),
            },
        }
