#!/usr/bin/env python3
"""初始化药店连锁促销陈列漏斗报表系统的 mock 数据"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, timedelta
import random

from sqlalchemy.orm import Session

from app.db.session import engine, Base, SessionLocal
from app import models
from app.core.config import settings


REGIONS = ["华东区", "华北区", "华南区", "西南区"]
CITIES_BY_REGION = {
    "华东区": ["上海", "杭州", "南京", "苏州"],
    "华北区": ["北京", "天津", "石家庄", "济南"],
    "华南区": ["广州", "深圳", "佛山", "厦门"],
    "西南区": ["成都", "重庆", "昆明", "贵阳"],
}
STORE_NAMES = [
    "康复大药房", "仁济堂药店", "百信医药", "康泰药店", "惠民大药房",
    "仁和堂医药", "德仁堂大药房", "保济堂药店", "同仁堂医药", "康宁大药房",
]
PRODUCTS = [
    ("维生素C泡腾片", "SKU-VC-001", 29.9, 200),
    ("布洛芬缓释胶囊", "SKU-IB-002", 19.8, 150),
    ("感冒灵颗粒", "SKU-GL-003", 15.5, 300),
    ("双黄连口服液", "SKU-SH-004", 38.0, 100),
    ("钙片(中老年)", "SKU-CA-005", 68.0, 80),
    ("蛋白粉(营养补充)", "SKU-PR-006", 168.0, 50),
    ("益生菌冻干粉", "SKU-PB-007", 128.0, 60),
    ("健胃消食片", "SKU-JW-008", 22.0, 250),
    ("复方丹参滴丸", "SKU-FD-009", 45.0, 90),
    ("阿胶补血口服液", "SKU-EJ-010", 89.0, 70),
]
INSPECTORS = ["张主管", "李经理", "王督导", "赵店长", "陈巡检"]
BUSINESS_USERS = ["运营部-小刘", "市场部-小王", "区域经理-老郑", "督导-小孙"]


def init_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def create_mock_data():
    db: Session = SessionLocal()
    try:
        print("🚀 开始创建 mock 数据...")

        stores = []
        store_idx = 0
        for region in REGIONS:
            for city in CITIES_BY_REGION[region][:3]:
                for _ in range(2):
                    if store_idx >= len(STORE_NAMES):
                        break
                    store = models.Store(
                        store_code=f"S{store_idx+1:04d}",
                        store_name=f"{city}{STORE_NAMES[store_idx]}",
                        region=region,
                        city=city,
                        is_medical_insurance=random.random() > 0.3,
                    )
                    stores.append(store)
                    store_idx += 1
        db.add_all(stores)
        db.commit()
        for s in stores:
            db.refresh(s)
        print(f"✅ 创建了 {len(stores)} 家门店")

        promotions = []
        today = date.today()
        promo_start = today - timedelta(days=25)
        for i, product in enumerate(PRODUCTS):
            store = random.choice(stores)
            start = promo_start + timedelta(days=random.randint(0, 10))
            duration = random.randint(14, 28)
            end = start + timedelta(days=duration)
            target_sales = product[2] * product[3] * random.uniform(0.8, 1.2)
            target_units = int(product[3] * random.uniform(0.8, 1.2))

            promo = models.Promotion(
                promo_code=f"PROMO-{i+1:04d}",
                promo_name=f"{product[0]} - 限时特惠",
                store_id=store.id,
                product_name=product[0],
                product_sku=product[1],
                start_date=start,
                end_date=end,
                target_sales=round(target_sales, 2),
                target_units=target_units,
                discount_rate=random.uniform(0.7, 0.9),
                promo_type=random.choice(["normal", "festival", "member", "bundle"]),
            )
            promotions.append(promo)
        db.add_all(promotions)
        db.commit()
        for p in promotions:
            db.refresh(p)
        print(f"✅ 创建了 {len(promotions)} 个促销活动")

        threshold_defaults = [
            ("cashier_delay_minutes", "收银延迟阈值", 30, "分钟", "异常检测", "收银系统延迟超过该分钟数将标记异常"),
            ("member_missing_count", "会员记录缺失阈值", 5, "条", "异常检测", "单天会员记录缺失条数超过该值将标记异常"),
            ("mi_caliber_change", "医保口径变化标记", 1, "布尔", "异常检测", "医保接口口径是否发生变化（1=是）"),
            ("display_pass_score", "陈列合格分数线", 60, "分", "陈列管理", "陈列综合评分达到该值以上视为合格"),
            ("position_weight", "陈列位置权重", 30, "分", "陈列管理", "陈列位置项在综合评分中的满分值"),
            ("pop_weight", "POP物料权重", 20, "分", "陈列管理", "POP物料项在综合评分中的满分值"),
            ("price_weight", "价格标签权重", 20, "分", "陈列管理", "价格标签项在综合评分中的满分值"),
            ("stock_weight", "库存展示权重", 30, "分", "陈列管理", "库存展示项在综合评分中的满分值"),
            ("rectification_days", "整改期限", 3, "天", "整改管理", "要求整改完成的天数"),
            ("sales_drop_threshold", "销量跌幅预警", 30, "%", "异常检测", "日销量环比跌幅超过该值触发陈列影响分析"),
        ]
        thresholds = []
        for cfg in threshold_defaults:
            thresholds.append(
                models.ThresholdConfig(
                    config_key=cfg[0],
                    config_name=cfg[1],
                    config_value=cfg[2],
                    config_unit=cfg[3],
                    category=cfg[4],
                    description=cfg[5],
                    current_modified_by="system_init",
                )
            )
        db.add_all(thresholds)
        db.commit()
        print(f"✅ 创建了 {len(thresholds)} 项阈值配置")

        inspections = []
        photos = []
        for promo in promotions:
            cursor = promo.start_date + timedelta(days=random.randint(1, 3))
            while cursor <= promo.end_date:
                if random.random() > 0.4:
                    position = random.randint(0, 30)
                    pop = random.randint(0, 20)
                    price = random.randint(0, 20)
                    stock = random.randint(0, 30)
                    overall = position + pop + price + stock
                    is_qualified = overall >= 60

                    ins = models.DisplayInspection(
                        promotion_id=promo.id,
                        store_id=promo.store_id,
                        inspection_date=cursor,
                        is_qualified=is_qualified,
                        position_score=position,
                        pop_score=pop,
                        price_score=price,
                        stock_score=stock,
                        overall_score=overall,
                        inspector=random.choice(INSPECTORS),
                        remark=(
                            "陈列位置不醒目，需调整" if overall < 60 and position < 15
                            else "POP物料缺失，需补充" if overall < 60 and pop < 10
                            else "价格标签错误，需修正" if overall < 60 and price < 10
                            else "库存堆头不足，需补货" if overall < 60 and stock < 15
                            else "陈列良好" if is_qualified
                            else "整体不合格，需整改"
                        ),
                    )
                    inspections.append(ins)

                    for pi in range(random.randint(1, 3)):
                        photos.append(
                            models.DisplayPhoto(
                                inspection_id=inspections[-1].id
                                if not inspections
                                else (len(inspections)),
                                file_path=f"/uploads/mock_{promo.id}_{cursor.isoformat()}_{pi}.jpg",
                                file_name=f"陈列照片_{cursor.isoformat()}_{pi+1}.jpg",
                                upload_by=random.choice(BUSINESS_USERS),
                                photo_type=random.choice(["display", "pop", "price", "stock"]),
                            )
                        )

                cursor += timedelta(days=random.randint(2, 4))

        db.add_all(inspections)
        db.commit()
        for ins in inspections:
            db.refresh(ins)

        for i, ph in enumerate(photos):
            if ph.inspection_id is None or ph.inspection_id > len(inspections):
                ph.inspection_id = random.choice(inspections).id
            photos[i] = ph

        db.bulk_save_objects(photos)
        db.commit()
        print(f"✅ 创建了 {len(inspections)} 条陈列巡检记录和 {len(photos)} 张照片")

        rectifications = []
        unqualified = [ins for ins in inspections if not ins.is_qualified]
        for ins in unqualified:
            if random.random() > 0.2:
                actual_date = None
                status = "pending"
                rect_by = None
                reviewer = None
                if random.random() > 0.4:
                    actual_date = ins.inspection_date + timedelta(days=random.randint(1, 5))
                    status = "completed" if actual_date <= (ins.inspection_date + timedelta(days=3)) else "overdue"
                    rect_by = random.choice(BUSINESS_USERS)
                    reviewer = random.choice(INSPECTORS) if status == "completed" else None

                rectifications.append(
                    models.Rectification(
                        promotion_id=ins.promotion_id,
                        inspection_id=ins.id,
                        issue_description=ins.remark or "陈列问题需整改",
                        require_rectification_date=ins.inspection_date + timedelta(days=3),
                        actual_rectification_date=actual_date,
                        rectification_status=status,
                        rectification_remark=(
                            "已按要求调整堆头位置和POP物料" if status == "completed"
                            else ""
                        ),
                        rectification_by=rect_by,
                        reviewer=reviewer,
                    )
                )
        db.add_all(rectifications)
        db.commit()
        print(f"✅ 创建了 {len(rectifications)} 条整改记录")

        sales_records = []
        annotations = []
        for promo in promotions:
            promo_days = (promo.end_date - promo.start_date).days + 1
            target_daily = promo.target_sales / promo_days
            target_units_daily = promo.target_units / promo_days

            cursor = promo.start_date
            while cursor <= promo.end_date:
                base_factor = 1.0

                related_inspections = [
                    ins
                    for ins in inspections
                    if ins.promotion_id == promo.id
                    and ins.inspection_date <= cursor
                    and (
                        ins.inspection_date + timedelta(days=3) >= cursor
                        or [
                            j
                            for j in inspections
                            if j.promotion_id == promo.id
                            and j.inspection_date > cursor
                        ] == []
                        and ins.inspection_date == max(
                            [
                                j.inspection_date
                                for j in inspections
                                if j.promotion_id == promo.id
                                and j.inspection_date <= cursor
                            ],
                            default=promo.start_date,
                        )
                    )
                ]
                if related_inspections:
                    latest = related_inspections[0]
                    if not latest.is_qualified:
                        base_factor *= 0.6 + (latest.overall_score / 200)

                day_factor = base_factor * random.uniform(0.6, 1.3)
                sales_amount = round(target_daily * day_factor, 2)
                sales_units = max(0, int(target_units_daily * day_factor))

                cashier_delay = 0
                member_missing = 0
                mi_caliber_changed = False

                if random.random() < 0.08:
                    cashier_delay = random.randint(30, 180)
                if random.random() < 0.06:
                    member_missing = random.randint(5, 50)
                if random.random() < 0.04:
                    mi_caliber_changed = True

                exception_types = []
                if cashier_delay >= 30:
                    exception_types.append("cashier_delay")
                if member_missing >= 5:
                    exception_types.append("member_missing")
                if mi_caliber_changed:
                    exception_types.append("mi_caliber_change")

                for et in exception_types:
                    if random.random() > 0.5:
                        desc_map = {
                            "cashier_delay": f"收银系统延迟 {cashier_delay} 分钟，可能影响当日销售统计完整性",
                            "member_missing": f"会员销售记录缺失 {member_missing} 条，会员占比数据需人工复核",
                            "mi_caliber_changed": "当日医保结算接口升级，医保销售统计口径发生变化",
                        }
                        annotations.append(
                            models.ExceptionAnnotation(
                                promotion_id=promo.id,
                                annotation_date=cursor,
                                exception_type=et,
                                exception_description=desc_map[et],
                                impact_degree=random.choice(["low", "medium", "high"]),
                                review_note=(
                                    "已与技术/运营确认，数据已在次日补全"
                                    if random.random() > 0.3
                                    else ""
                                ),
                                review_by=(
                                    random.choice(BUSINESS_USERS)
                                    if random.random() > 0.3
                                    else ""
                                ),
                                created_by=random.choice(BUSINESS_USERS),
                            )
                        )

                member_ratio = random.uniform(0.3, 0.65)
                mi_ratio = random.uniform(0.15, 0.4) if stores[promo.store_id - 1].is_medical_insurance else 0.0

                sales_records.append(
                    models.SalesRecord(
                        sale_date=cursor,
                        promotion_id=promo.id,
                        store_id=promo.store_id,
                        sales_amount=sales_amount,
                        sales_units=sales_units,
                        original_amount=round(sales_amount / promo.discount_rate, 2),
                        member_sales_amount=round(sales_amount * member_ratio, 2),
                        member_sales_units=int(sales_units * member_ratio),
                        medical_insurance_amount=round(sales_amount * mi_ratio, 2),
                        medical_insurance_units=int(sales_units * mi_ratio),
                        cashier_delay_minutes=cashier_delay,
                        member_record_missing_count=member_missing,
                        medical_insurance_caliber_changed=mi_caliber_changed,
                        data_version="v2" if mi_caliber_changed else "v1",
                    )
                )

                cursor += timedelta(days=1)

        db.bulk_save_objects(sales_records)
        db.add_all(annotations)
        db.commit()
        print(f"✅ 创建了 {len(sales_records)} 条销售记录和 {len(annotations)} 条异常标注")

        print("\n🎉 Mock 数据初始化完成！")
        print(f"   门店数: {len(stores)}")
        print(f"   促销活动: {len(promotions)}")
        print(f"   销售记录: {len(sales_records)}")
        print(f"   陈列巡检: {len(inspections)}")
        print(f"   整改记录: {len(rectifications)}")
        print(f"   异常标注: {len(annotations)}")
        print(f"   阈值配置: {len(thresholds)}")
        print(f"\n📊 数据覆盖时间范围: {promo_start.isoformat()} ~ {today.isoformat()}")

    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    create_mock_data()
