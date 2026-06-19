import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import random
from datetime import date, timedelta
import pandas as pd
from data.pipeline import DataPipeline
from data.database import SessionLocal, engine
from data.models import (
    Vehicle, RepairOrder, DiagnosisResult, OrderItem,
    InsuranceMaterial, PartsInventory, PartsUsage,
    ReworkRecord, ETLLog
)
from sqlalchemy import func

pipeline = DataPipeline()
db = SessionLocal()

BRANDS = ['大众', '丰田', '本田', '别克', '奥迪', '宝马', '奔驰', '日产', '现代', '比亚迪', '特斯拉', '蔚来']
MODELS = {
    '大众': ['迈腾', '帕萨特', '朗逸', '途观', '速腾'],
    '丰田': ['凯美瑞', '卡罗拉', '汉兰达', 'RAV4', '雷凌'],
    '本田': ['雅阁', '思域', 'CRV', '皓影', '飞度'],
    '别克': ['君越', '君威', '英朗', '昂科威', 'GL8'],
    '奥迪': ['A4L', 'A6L', 'Q5L', 'A3', 'Q3'],
    '宝马': ['3系', '5系', 'X3', 'X5', '1系'],
    '奔驰': ['C级', 'E级', 'GLC', 'GLE', 'A级'],
    '日产': ['天籁', '轩逸', '奇骏', '逍客', '骐达'],
    '现代': ['索纳塔', '伊兰特', '途胜', 'ix35', '名图'],
    '比亚迪': ['汉', '唐', '宋', '元', '秦'],
    '特斯拉': ['Model 3', 'Model Y', 'Model S', 'Model X'],
    '蔚来': ['ES6', 'ES8', 'ET5', 'ET7', 'EC6'],
}
FAULT_CODES = [
    ('P0123', '节气门位置传感器故障', '动力系统', '中等'),
    ('P0456', '燃油蒸发系统泄漏', '动力系统', '轻微'),
    ('P0300', '多缸失火', '动力系统', '严重'),
    ('B0100', '安全气囊故障', '车身系统', '严重'),
    ('B0240', '左前车窗电机故障', '车身系统', '轻微'),
    ('B0400', '空调鼓风机故障', '车身系统', '中等'),
    ('C0035', '左前轮ABS传感器故障', '底盘系统', '严重'),
    ('C0123', '制动压力传感器故障', '底盘系统', '严重'),
    ('C0210', '转向角传感器故障', '底盘系统', '中等'),
    ('U0100', 'ECU通讯故障', '网络通讯', '严重'),
    ('U0121', 'ABS模块通讯丢失', '网络通讯', '严重'),
    ('U0140', '车身控制模块通讯丢失', '网络通讯', '中等'),
    ('P0A80', '动力电池组故障', '电池管理', '严重'),
    ('P0AA6', '电池高压绝缘故障', '电池管理', '严重'),
    ('P0B27', '电池温度传感器故障', '电池管理', '中等'),
    ('P0A1F', '电机控制单元故障', '电机控制', '严重'),
    ('P0A25', '电机过温故障', '电机控制', '中等'),
    ('P0A30', '电机位置传感器故障', '电机控制', '严重'),
]
PARTS_CATALOG = [
    ('P001', '前刹车片', '制动系统', '博世', '套', 280, 50, 10, '博世汽配'),
    ('P002', '后刹车片', '制动系统', '博世', '套', 220, 45, 10, '博世汽配'),
    ('P003', '前刹车盘', '制动系统', '博世', '对', 580, 20, 5, '博世汽配'),
    ('P004', '机油滤芯', '滤清器', '曼牌', '个', 45, 100, 20, '曼牌滤清器'),
    ('P005', '空气滤芯', '滤清器', '曼牌', '个', 65, 80, 15, '曼牌滤清器'),
    ('P006', '空调滤芯', '滤清器', '曼牌', '个', 55, 90, 15, '曼牌滤清器'),
    ('P007', '火花塞', '点火系统', 'NGK', '支', 85, 60, 12, 'NGK官方'),
    ('P008', '点火线圈', '点火系统', '博世', '个', 320, 25, 5, '博世汽配'),
    ('P009', '蓄电池', '电气系统', '瓦尔塔', '个', 680, 15, 3, '瓦尔塔电池'),
    ('P010', '轮胎', '底盘系统', '米其林', '条', 850, 20, 4, '米其林轮胎'),
    ('P011', '雨刮片', '车身附件', '博世', '对', 120, 120, 20, '博世汽配'),
    ('P012', '变速箱油', '油品', '采埃孚', '升', 85, 40, 8, '采埃孚油品'),
    ('P013', '刹车油', '油品', '博世', '升', 65, 50, 10, '博世汽配'),
    ('P014', '防冻液', '油品', '壳牌', '桶', 120, 35, 7, '壳牌油品'),
    ('P015', '机油-全合成', '油品', '美孚', '升', 85, 60, 12, '美孚机油'),
    ('P016', '前保险杠', '车身配件', '原厂', '个', 1580, 8, 2, '原厂配件'),
    ('P017', '前大灯总成', '车身配件', '原厂', '个', 2850, 5, 1, '原厂配件'),
    ('P018', '前保险杠蒙皮', '车身配件', '副厂', '个', 450, 12, 3, '副厂配件'),
    ('P019', '机油泵', '动力系统', '原厂', '个', 1250, 6, 1, '原厂配件'),
    ('P020', '发电机', '电气系统', '法雷奥', '个', 1680, 8, 2, '法雷奥电气'),
]
SERVICE_ADVISORS = ['张三', '李四', '王五', '赵六', '钱七', '孙八']
TECHNICIANS = ['技师A-王强', '技师B-李伟', '技师C-张刚', '技师D-刘军', '技师E-陈明']
INSURANCE_COMPANIES = ['人保财险', '平安车险', '太平洋保险', '中国人寿财险', '阳光财险']
ORDER_TYPES = ['常规保养', '故障维修', '事故维修', '检测诊断', '改装升级']
DAMAGE_TYPES = ['追尾事故', '侧面碰撞', '剐蹭事故', '冰雹损伤', '水淹车']
REWORK_REASONS = [
    ('配件质量问题', '配件相关', True),
    ('安装工艺问题', '工艺相关', False),
    ('故障诊断不准确', '诊断相关', False),
    ('配件缺货导致临时处理', '配件相关', True),
    ('客户使用不当', '客户相关', False),
    ('配件型号不匹配', '配件相关', True),
]


def generate_vin():
    chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789'
    return ''.join(random.choice(chars) for _ in range(17))


def generate_license_plate():
    provinces = '京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼'
    return f'{random.choice(provinces)}{random.choice("ABCDEFGHJKLMNPQRSTUVWXYZ")}{random.randint(10000, 99999)}'


def generate_owner_name():
    surnames = '王李张刘陈杨赵黄周吴徐孙胡朱高林何郭马罗梁宋郑谢韩唐冯于董萧程曹袁邓许傅沈曾彭吕苏卢蒋蔡贾丁魏薛叶阎余潘杜戴夏钟汪田任姜范方石姚谭廖邹熊金陆郝孔白崔康毛邱秦江史顾侯邵孟龙万段雷钱汤尹黎易常武乔贺赖龚文'
    names = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '文', '华', '玲', '辉', '鑫', '斌', '波', '宇', '浩', '凯', '健', '俊', '帆', '鹏', '博', '婷', '雪', '倩']
    return f'{random.choice(surnames)}{random.choice(names)}'


def generate_phone():
    return f'1{random.choice([3, 5, 7, 8, 9])}{"".join(str(random.randint(0, 9)) for _ in range(9))}'


def insert_vehicles(count=200):
    print(f'Generating {count} vehicles...')
    vehicles_data = []
    for i in range(count):
        brand = random.choice(BRANDS)
        model = random.choice(MODELS[brand])
        model_year = random.randint(2015, 2025)
        registration_date = date(random.randint(2015, 2025), random.randint(1, 12), random.randint(1, 28))

        raw_data = {
            'vin': generate_vin(),
            'license_plate': generate_license_plate(),
            'brand': brand,
            'model': model,
            'model_year': model_year,
            'color': random.choice(['黑色', '白色', '银色', '灰色', '红色', '蓝色', '金色']),
            'mileage': random.randint(5000, 150000),
            'owner_name': generate_owner_name(),
            'owner_phone': generate_phone(),
            'first_registration_date': registration_date,
            'source_system': 'dms',
        }
        vehicles_data.append(raw_data)

    df = pd.DataFrame(vehicles_data)
    processed_df, stats = pipeline.process_vehicles(df, 'dms')
    print(f'  Processed: {stats}')

    for _, row in processed_df.iterrows():
        vehicle = Vehicle(
            vin=row['vin'],
            license_plate=row.get('license_plate'),
            brand=row.get('brand'),
            model=row.get('model'),
            model_year=row.get('model_year'),
            color=row.get('color'),
            mileage=row.get('mileage'),
            owner_name=row.get('owner_name'),
            owner_phone=row.get('owner_phone'),
            first_registration_date=row.get('first_registration_date'),
        )
        db.add(vehicle)
    db.commit()

    log = ETLLog(
        task_name='etl_vehicles',
        source_system='dms',
        run_date=date.today(),
        records_input=stats['input'],
        records_output=stats['output'],
        records_deduplicated=stats['deduplicated'],
        records_invalid=stats['invalid'],
        status='success',
    )
    db.add(log)
    db.commit()
    print(f'  Inserted {db.query(func.count(Vehicle.id)).scalar()} vehicles')


def insert_parts_inventory():
    print('Inserting parts inventory...')
    parts_data = []
    for part in PARTS_CATALOG:
        raw_data = {
            'part_code': part[0],
            'part_name': part[1],
            'part_category': part[2],
            'brand': part[3],
            'unit': part[4],
            'unit_price': part[5],
            'stock_quantity': part[6] + random.randint(-10, 20),
            'safe_stock_level': part[7],
            'supplier': part[8],
            'source_system': 'parts_erp',
        }
        parts_data.append(raw_data)

    df = pd.DataFrame(parts_data)
    processed_df, stats = pipeline.process_parts(df, 'parts_erp')
    print(f'  Processed: {stats}')

    for _, row in processed_df.iterrows():
        part = PartsInventory(
            part_code=row['part_code'],
            part_name=row['part_name'],
            part_category=row.get('part_category'),
            brand=row.get('brand'),
            unit=row.get('unit'),
            unit_price=row.get('unit_price'),
            stock_quantity=row.get('stock_quantity'),
            safe_stock_level=row.get('safe_stock_level'),
            supplier=row.get('supplier'),
            source_system=row.get('source_system'),
        )
        db.add(part)
    db.commit()
    print(f'  Inserted {db.query(func.count(PartsInventory.id)).scalar()} parts')


def insert_repair_orders(days=90):
    print(f'Generating repair orders for {days} days...')
    end_date = date.today()
    start_date = end_date - timedelta(days=days)
    vehicles = db.query(Vehicle).all()
    parts = db.query(PartsInventory).all()

    all_orders_data = []
    order_no_counter = 20240000

    current_date = start_date
    while current_date <= end_date:
        if current_date.weekday() >= 5:
            daily_count = random.randint(8, 15)
        else:
            daily_count = random.randint(15, 30)

        for i in range(daily_count):
            order_no_counter += 1
            vehicle = random.choice(vehicles)
            order_type = random.choice(ORDER_TYPES)
            has_actual_arrival = random.random() > 0.1

            raw_order = {
                'order_no': f'WO{order_no_counter}',
                'vin': vehicle.vin,
                'appointment_date': current_date,
                'actual_arrival_date': current_date if has_actual_arrival else None,
                'order_type': order_type,
                'order_status': random.choice(['已完成', '已完成', '已完成', '进行中', '待处理']),
                'service_advisor': random.choice(SERVICE_ADVISORS),
                'technician': random.choice(TECHNICIANS),
                'total_cost': 0,
                'parts_cost': 0,
                'labor_cost': 0,
                'source_system': 'dms',
                'source_id': f'WO{order_no_counter}',
            }
            all_orders_data.append((raw_order, vehicle, parts, current_date, order_type))

        current_date += timedelta(days=1)

    orders_df = pd.DataFrame([o[0] for o in all_orders_data])
    processed_orders, stats = pipeline.process_repair_orders(orders_df, 'dms')
    print(f'  Orders processed: {stats}')

    order_id_map = {}
    total_parts_cost = 0
    total_labor_cost = 0
    all_insurance_data = []

    for idx, (raw_order, vehicle, parts_list, order_date, order_type) in enumerate(all_orders_data):
        if idx >= len(processed_orders):
            break

        row = processed_orders.iloc[idx]
        order = RepairOrder(
            order_no=row['order_no'],
            vehicle_id=vehicle.id,
            appointment_date=row['appointment_date'],
            actual_arrival_date=row.get('actual_arrival_date'),
            order_type=row.get('order_type'),
            order_status=row.get('order_status'),
            service_advisor=row.get('service_advisor'),
            technician=row.get('technician'),
            source_system=row.get('source_system'),
            source_id=row.get('source_id'),
        )
        db.add(order)
        db.flush()
        order_id_map[order.order_no] = order.id

        parts_cost = 0
        labor_cost = 0

        item_count = random.randint(1, 5)
        selected_parts = random.sample(parts_list, min(item_count, len(parts_list)))

        for sp in selected_parts:
            qty = random.randint(1, 4)
            subtotal = float(sp.unit_price) * qty
            parts_cost += subtotal

            item = OrderItem(
                order_id=order.id,
                item_type='配件',
                item_code=sp.part_code,
                item_name=sp.part_name,
                quantity=qty,
                unit_price=sp.unit_price,
                subtotal=subtotal,
                is_warranty=random.random() < 0.1,
                technician=row.get('technician'),
                work_hours=random.uniform(0.5, 2.0),
            )
            db.add(item)

            is_shortage = random.random() < 0.08
            shortage_qty = random.randint(1, qty) if is_shortage else 0

            parts_usage = PartsUsage(
                order_id=order.id,
                part_code=sp.part_code,
                part_name=sp.part_name,
                quantity=qty,
                unit_price=sp.unit_price,
                is_shortage=is_shortage,
                shortage_quantity=shortage_qty,
            )
            db.add(parts_usage)

        if order_type in ['常规保养', '故障维修']:
            labor_hours = random.uniform(1.0, 4.0)
            labor = labor_hours * 150
            labor_cost += labor

            labor_item = OrderItem(
                order_id=order.id,
                item_type='工时',
                item_code=f'LAB{random.randint(100, 999)}',
                item_name=f'{order_type}工时',
                quantity=1,
                unit_price=labor,
                subtotal=labor,
                technician=row.get('technician'),
                work_hours=labor_hours,
            )
            db.add(labor_item)

        if order_type == '事故维修' and random.random() < 0.7:
            raw_insurance = {
                'order_no': order.order_no,
                'insurance_company': random.choice(['人民保险', '平安', '太保', '国寿财险', '阳光', 'picc', 'pingan']),
                'policy_no': f'POL{random.randint(100000, 999999)}',
                'claim_no': f'CL{random.randint(100000, 999999)}',
                'damage_type': random.choice(['追尾', '正面碰撞', '侧面', '剐蹭', '冰雹', '水淹', '刮擦']),
                'accident_date': order_date - timedelta(days=random.randint(0, 7)),
                'damage_description': f'车辆{random.choice(DAMAGE_TYPES)}，需修复',
                'estimated_amount': random.uniform(2000, 15000),
                'approved_amount': random.uniform(1800, 14000),
                'claim_status': random.choice(['受理', '审核', '已通过', '赔付中', '已赔付', 'received', 'approved']),
                'source_system': 'insurance',
                'source_id': f'INS{random.randint(100000, 999999)}',
            }
            all_insurance_data.append(raw_insurance)

        if order_type == '故障维修' and random.random() < 0.8:
            fault = random.choice(FAULT_CODES)
            diagnosis = DiagnosisResult(
                order_id=order.id,
                vehicle_id=vehicle.id,
                diagnosis_date=order_date,
                fault_code=fault[0],
                fault_description=fault[1],
                fault_category=fault[2],
                fault_severity=fault[3],
                diagnostic_method=random.choice(['电脑诊断', '人工检查', '路试', '拆解检查']),
                technician=row.get('technician'),
                diagnosis_result=f'检测到{fault[1]}，已修复',
                is_confirmed=True,
            )
            db.add(diagnosis)

        order.parts_cost = round(parts_cost, 2)
        order.labor_cost = round(labor_cost, 2)
        order.total_cost = round(parts_cost + labor_cost, 2)
        total_parts_cost += parts_cost
        total_labor_cost += labor_cost

        if random.random() < 0.05 and order.order_status == '已完成' and idx > 30:
            rework_reason = random.choice(REWORK_REASONS)
            order.is_rework = True

            original_idx = max(0, idx - random.randint(5, 30))
            original_order_no = list(order_id_map.keys())[original_idx]
            original_order_id = order_id_map.get(original_order_no)

            related_parts = []
            if rework_reason[2]:
                related_parts = [sp.part_code for sp in selected_parts[:2]]

            rework = ReworkRecord(
                original_order_id=original_order_id,
                rework_order_id=order.id,
                vehicle_id=vehicle.id,
                rework_reason=rework_reason[0],
                rework_type=rework_reason[1],
                rework_date=order_date,
                is_parts_related=rework_reason[2],
                related_part_codes=related_parts if related_parts else None,
                caliber_version='v1.0',
            )
            db.add(rework)

            if random.random() < 0.5:
                rework_v2 = ReworkRecord(
                    original_order_id=original_order_id,
                    rework_order_id=order.id,
                    vehicle_id=vehicle.id,
                    rework_reason=rework_reason[0],
                    rework_type=rework_reason[1],
                    rework_date=order_date,
                    is_parts_related=rework_reason[2],
                    related_part_codes=related_parts if related_parts else None,
                    caliber_version='v1.1',
                )
                db.add(rework_v2)

    if all_insurance_data:
        insurance_df = pd.DataFrame(all_insurance_data)
        processed_insurance, ins_stats = pipeline.process_insurance(insurance_df, 'insurance')
        print(f'  Insurance processed: {ins_stats}')

        for _, ins_row in processed_insurance.iterrows():
            order_no = ins_row.get('order_no')
            order_id = order_id_map.get(order_no)
            if order_id is None:
                continue
            insurance = InsuranceMaterial(
                order_id=order_id,
                insurance_company=ins_row.get('insurance_company'),
                policy_no=ins_row.get('policy_no'),
                claim_no=ins_row.get('claim_no'),
                damage_type=ins_row.get('damage_type'),
                accident_date=ins_row.get('accident_date'),
                damage_description=ins_row.get('damage_description'),
                estimated_amount=ins_row.get('estimated_amount'),
                approved_amount=ins_row.get('approved_amount'),
                claim_status=ins_row.get('claim_status'),
                source_system=ins_row.get('source_system', 'insurance'),
                source_id=ins_row.get('source_id'),
            )
            db.add(insurance)

    db.commit()

    log = ETLLog(
        task_name='etl_repair_orders',
        source_system='dms',
        run_date=date.today(),
        records_input=stats['input'],
        records_output=stats['output'],
        records_deduplicated=stats['deduplicated'],
        records_invalid=stats['invalid'],
        status='success',
    )
    db.add(log)

    for src in ['insurance', 'parts_erp']:
        log2 = ETLLog(
            task_name=f'etl_{src}',
            source_system=src,
            run_date=date.today(),
            records_input=random.randint(100, 500),
            records_output=random.randint(95, 490),
            records_deduplicated=random.randint(0, 10),
            records_invalid=random.randint(0, 5),
            status='success',
        )
        db.add(log2)
    db.commit()

    total_orders = db.query(func.count(RepairOrder.id)).scalar()
    total_items = db.query(func.count(OrderItem.id)).scalar()
    total_diagnosis = db.query(func.count(DiagnosisResult.id)).scalar()
    total_insurance = db.query(func.count(InsuranceMaterial.id)).scalar()
    total_parts_usage = db.query(func.count(PartsUsage.id)).scalar()
    total_rework = db.query(func.count(ReworkRecord.id)).scalar()

    print(f'  Inserted {total_orders} repair orders')
    print(f'  Inserted {total_items} order items')
    print(f'  Inserted {total_diagnosis} diagnosis records')
    print(f'  Inserted {total_insurance} insurance records')
    print(f'  Inserted {total_parts_usage} parts usage records')
    print(f'  Inserted {total_rework} rework records')


def main():
    print('=' * 60)
    print('汽车维修预约进厂趋势看板 - 测试数据生成')
    print('=' * 60)

    print('\n1. Truncating existing tables...')
    db.query(ReworkRecord).delete()
    db.query(PartsUsage).delete()
    db.query(InsuranceMaterial).delete()
    db.query(OrderItem).delete()
    db.query(DiagnosisResult).delete()
    db.query(RepairOrder).delete()
    db.query(PartsInventory).delete()
    db.query(Vehicle).delete()
    db.query(ETLLog).delete()
    db.commit()

    print('\n2. Generating parts inventory...')
    insert_parts_inventory()

    print('\n3. Generating vehicles...')
    insert_vehicles(200)

    print('\n4. Generating repair orders and related data...')
    insert_repair_orders(90)

    print('\n' + '=' * 60)
    print('Data generation complete!')
    print('=' * 60)

    total_vehicles = db.query(func.count(Vehicle.id)).scalar()
    total_orders = db.query(func.count(RepairOrder.id)).scalar()
    total_parts = db.query(func.count(PartsInventory.id)).scalar()
    total_rework_v1 = db.query(func.count(ReworkRecord.id)).filter(ReworkRecord.caliber_version == 'v1.0').scalar()
    total_rework_v11 = db.query(func.count(ReworkRecord.id)).filter(ReworkRecord.caliber_version == 'v1.1').scalar()
    total_shortage = db.query(func.count(PartsUsage.id)).filter(PartsUsage.is_shortage == True).scalar()

    print(f'\nSummary:')
    print(f'  Vehicles: {total_vehicles}')
    print(f'  Repair orders: {total_orders}')
    print(f'  Parts in inventory: {total_parts}')
    print(f'  Rework records (v1.0): {total_rework_v1}')
    print(f'  Rework records (v1.1): {total_rework_v11}')
    print(f'  Parts shortage records: {total_shortage}')

    db.close()


if __name__ == '__main__':
    main()
