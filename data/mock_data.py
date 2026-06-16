import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
from faker import Faker

fake = Faker('zh_CN')
random.seed(42)
np.random.seed(42)


def generate_mock_data(days_back=90):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    date_range = pd.date_range(start=start_date, end=end_date, freq='h')

    stores = pd.DataFrame([
        {'store_id': 1, 'store_code': 'ST001', 'store_name': '中心店', 'manager': '张经理'},
        {'store_id': 2, 'store_code': 'ST002', 'store_name': '城东店', 'manager': '李经理'},
        {'store_id': 3, 'store_code': 'ST003', 'store_name': '城西店', 'manager': '王经理'},
        {'store_id': 4, 'store_code': 'ST004', 'store_name': '城南店', 'manager': '赵经理'},
        {'store_id': 5, 'store_code': 'ST005', 'store_name': '城北店', 'manager': '刘经理'},
    ])

    drugs = pd.DataFrame([
        {'drug_id': 1, 'drug_code': 'RX001', 'drug_name': '阿莫西林胶囊', 'specification': '0.25g*24粒',
         'manufacturer': '华北制药', 'is_prescription': True, 'category': '抗生素', 'price': 25.5},
        {'drug_id': 2, 'drug_code': 'RX002', 'drug_name': '头孢克肟分散片', 'specification': '0.1g*6片',
         'manufacturer': '石药集团', 'is_prescription': True, 'category': '抗生素', 'price': 45.0},
        {'drug_id': 3, 'drug_code': 'RX003', 'drug_name': '硝苯地平控释片', 'specification': '30mg*7片',
         'manufacturer': '拜耳', 'is_prescription': True, 'category': '心血管', 'price': 38.0},
        {'drug_id': 4, 'drug_code': 'RX004', 'drug_name': '二甲双胍片', 'specification': '0.5g*20片',
         'manufacturer': '中美上海施贵宝', 'is_prescription': True, 'category': '糖尿病', 'price': 32.0},
        {'drug_id': 5, 'drug_code': 'RX005', 'drug_name': '阿托伐他汀钙片', 'specification': '20mg*7片',
         'manufacturer': '辉瑞', 'is_prescription': True, 'category': '心血管', 'price': 68.0},
        {'drug_id': 6, 'drug_code': 'RX006', 'drug_name': '奥美拉唑肠溶胶囊', 'specification': '20mg*14粒',
         'manufacturer': '阿斯利康', 'is_prescription': True, 'category': '消化系统', 'price': 55.0},
        {'drug_id': 7, 'drug_code': 'OTC001', 'drug_name': '感冒灵颗粒', 'specification': '10g*9袋',
         'manufacturer': '三九医药', 'is_prescription': False, 'category': '感冒', 'price': 18.0},
        {'drug_id': 8, 'drug_code': 'OTC002', 'drug_name': '布洛芬缓释胶囊', 'specification': '0.3g*20粒',
         'manufacturer': '中美史克', 'is_prescription': False, 'category': '止痛', 'price': 22.0},
    ])

    members = []
    for i in range(500):
        birth_year = random.randint(1940, 2005)
        chronic_diseases = ['高血压', '糖尿病', '冠心病', '高血脂', '哮喘', '慢性胃炎', '']
        weights = [0.2, 0.15, 0.1, 0.15, 0.05, 0.1, 0.25]
        members.append({
            'member_id': i + 1,
            'member_card_no': f'M{20240000 + i}',
            'name': fake.name(),
            'gender': random.choice(['男', '女']),
            'birthday': fake.date_of_birth(minimum_age=18, maximum_age=85),
            'phone': fake.phone_number(),
            'chronic_disease': random.choices(chronic_diseases, weights=weights, k=1)[0],
            'member_level': random.choice(['普通', '银卡', '金卡', '钻石']),
            'register_date': fake.date_between(start_date='-3y', end_date='today'),
        })
    members_df = pd.DataFrame(members)

    prescriptions = []
    prescription_items = []
    cashier_records = []
    cashier_items = []
    insurance_records = []
    audit_tasks = []
    followup_records = []
    inventory = []
    replenishment_orders = []
    replenishment_items = []

    batch_prefixes = ['B2024', 'B2025', 'B2026']
    for drug_id in drugs['drug_id']:
        for store_id in stores['store_id']:
            for i in range(random.randint(2, 5)):
                batch_no = f'{random.choice(batch_prefixes)}{random.randint(1000, 9999)}{chr(65 + i)}'
                prod_date = fake.date_between(start_date='-2y', end_date='-6m')
                exp_date = fake.date_between(start_date='+3m', end_date='+2y')
                inv_id = len(inventory) + 1
                inventory.append({
                    'inventory_id': inv_id,
                    'store_id': store_id,
                    'drug_id': drug_id,
                    'batch_no': batch_no,
                    'production_date': prod_date,
                    'expiry_date': exp_date,
                    'quantity': random.randint(50, 200),
                    'unit_cost': drugs[drugs['drug_id'] == drug_id]['price'].values[0] * 0.6,
                    'supplier': random.choice(['国药控股', '上药集团', '九州通', '华润医药']),
                    'received_date': fake.date_between(start_date='-6m', end_date='today'),
                })

    for i in range(200):
        ro_id = len(replenishment_orders) + 1
        store_id = random.choice(stores['store_id'])
        order_date = fake.date_between(start_date='-6m', end_date='today')
        replenishment_orders.append({
            'replenishment_order_id': ro_id,
            'order_no': f'PO{20240000 + i}',
            'store_id': store_id,
            'supplier': random.choice(['国药控股', '上药集团', '九州通', '华润医药']),
            'order_date': order_date,
            'expected_date': order_date + timedelta(days=random.randint(3, 10)),
            'actual_date': order_date + timedelta(days=random.randint(2, 15)),
            'status': random.choice(['已完成', '已完成', '已完成', '配送中', '待收货']),
            'total_amount': round(random.uniform(500, 5000), 2),
            'created_by': random.choice(['采购员A', '采购员B', '采购员C']),
        })
        for j in range(random.randint(3, 8)):
            drug = drugs.sample(1).iloc[0]
            replenishment_items.append({
                'replenishment_order_item_id': len(replenishment_items) + 1,
                'order_id': ro_id,
                'drug_id': drug['drug_id'],
                'batch_no': f'B{random.randint(20240000, 20269999)}',
                'order_quantity': random.randint(20, 100),
                'received_quantity': random.randint(18, 100),
                'unit_price': drug['price'] * 0.6,
            })

    for sale_time in date_range:
        if random.random() < 0.3:
            continue

        store_id = random.choice(stores['store_id'])
        member_id = random.choice(members_df['member_id'])
        cashier_id = len(cashier_records) + 1
        is_prescription_sale = random.random() < 0.4

        items_count = random.randint(1, 5)
        total_amount = 0

        prescription_id = None
        if is_prescription_sale:
            prescription_id = len(prescriptions) + 1
            audit_status = random.choice(['已通过', '已通过', '已通过', '待审核', '已驳回'])
            is_clear = random.choice([True, True, True, True, False])
            audit_result = 'pass' if audit_status == '已通过' else ('pending' if audit_status == '待审核' else 'reject')

            prescriptions.append({
                'prescription_id': prescription_id,
                'prescription_no': f'RX{20240000 + len(prescriptions)}',
                'store_id': store_id,
                'member_id': member_id,
                'cashier_record_id': cashier_id,
                'doctor_name': fake.name(),
                'hospital': random.choice(['市第一医院', '市第二医院', '省人民医院', '中医院']),
                'department': random.choice(['内科', '心内科', '内分泌科', '呼吸科', '消化科']),
                'diagnosis': random.choice(['上呼吸道感染', '高血压', '2型糖尿病', '冠心病', '高血脂', '慢性胃炎']),
                'prescription_date': sale_time.date() - timedelta(days=random.randint(0, 3)),
                'issue_date': sale_time,
                'auditor': random.choice(['药师A', '药师B', '药师C', '药师D']),
                'audit_time': sale_time + timedelta(minutes=random.randint(5, 30)),
                'audit_status': audit_status,
                'audit_opinion': '处方合规' if audit_result == 'pass' else ('待审核' if audit_result == 'pending' else '处方信息不完整'),
                'is_clear': is_clear,
                'unclear_reason': None if is_clear else random.choice(['处方照片模糊', '医生签名不清', '药品名称手写无法辨认', '诊断信息不完整']),
                'review_status': random.choice(['已复盘', '已复盘', '待复盘']),
                'review_time': sale_time + timedelta(days=random.randint(1, 7)),
                'reviewer': random.choice(['主管药师A', '主管药师B']),
                'review_conclusion': random.choice(['审核流程规范', '需加强审核标准', '建议回访确认', '已退回重审']),
                'is_photo_provided': random.choice([True, True, False]),
                'photo_count': random.randint(0, 3),
                'created_at': sale_time,
            })

            for j in range(random.randint(1, 3)):
                drug = drugs[drugs['is_prescription']].sample(1).iloc[0]
                prescription_items.append({
                    'prescription_item_id': len(prescription_items) + 1,
                    'prescription_id': prescription_id,
                    'drug_id': drug['drug_id'],
                    'drug_name': drug['drug_name'],
                    'specification': drug['specification'],
                    'dosage': random.choice(['1片', '2片', '1粒', '2粒']),
                    'frequency': random.choice(['每日1次', '每日2次', '每日3次', '隔日1次']),
                    'duration': random.choice(['7天', '14天', '30天', '长期']),
                    'quantity': random.randint(1, 5),
                    'unit': drug.get('unit', '盒'),
                })

            if not is_clear:
                task_id = len(audit_tasks) + 1
                task_status = random.choice(['已完成', '已完成', '处理中', '待处理'])
                followup_needed = random.choice([True, True, False])
                followup_status = None
                if followup_needed and task_status == '已完成':
                    followup_status = random.choice(['已完成', '进行中'])

                audit_tasks.append({
                    'audit_task_id': task_id,
                    'task_no': f'TASK{20240000 + len(audit_tasks)}',
                    'prescription_id': prescription_id,
                    'store_id': store_id,
                    'task_type': '处方不清',
                    'task_reason': prescriptions[-1]['unclear_reason'],
                    'task_status': task_status,
                    'priority': random.choice(['高', '中', '低']),
                    'assigned_to': random.choice(['药师A', '药师B', '药师C']),
                    'assigned_time': sale_time + timedelta(minutes=10),
                    'completed_time': sale_time + timedelta(hours=random.randint(1, 48)) if task_status == '已完成' else None,
                    'completed_by': random.choice(['药师A', '药师B', '药师C']) if task_status == '已完成' else None,
                    'handling_conclusion': random.choice(['已联系患者补充处方信息', '已核实药品信息，确认无误', '已退回门店重新审核', '已与医生确认处方内容']) if task_status == '已完成' else None,
                    'followup_needed': followup_needed,
                    'followup_status': followup_status,
                    'followup_time': sale_time + timedelta(days=random.randint(2, 7)) if followup_status == '已完成' else None,
                    'followup_result': random.choice(['患者已确认用药情况', '已告知用药注意事项', '患者表示理解']) if followup_status == '已完成' else None,
                    'followup_operator': random.choice(['客服A', '客服B', '客服C']) if followup_status == '已完成' else None,
                    'created_at': sale_time,
                })

                if followup_needed:
                    followup_records.append({
                        'followup_record_id': len(followup_records) + 1,
                        'task_id': task_id,
                        'prescription_id': prescription_id,
                        'member_id': member_id,
                        'store_id': store_id,
                        'followup_type': '处方不清回访',
                        'followup_channel': random.choice(['电话', '短信', '微信']),
                        'followup_time': sale_time + timedelta(days=random.randint(1, 7)),
                        'followup_operator': random.choice(['客服A', '客服B', '客服C']),
                        'contact_result': random.choice(['成功联系', '无人接听', '关机', '挂断']),
                        'followup_content': random.choice(['确认处方信息', '用药指导', '提醒复诊', '健康咨询']),
                        'member_feedback': random.choice(['已了解', '感谢提醒', '有疑问已解答', '无其他问题']),
                        'followup_status': followup_status or '进行中',
                        'next_followup_time': sale_time + timedelta(days=random.randint(7, 30)) if followup_status != '已完成' else None,
                    })

        for j in range(items_count):
            if is_prescription_sale and j == 0 and prescription_id is not None:
                drug = drugs[drugs['is_prescription']].sample(1).iloc[0]
            else:
                drug = drugs.sample(1).iloc[0]

            qty = random.randint(1, 5)
            price = drug['price']
            subtotal = round(qty * price, 2)
            total_amount += subtotal

            matched_inv = [inv for inv in inventory if inv['drug_id'] == drug['drug_id'] and inv['store_id'] == store_id]
            inv_id = random.choice(matched_inv)['inventory_id'] if matched_inv else None

            cashier_items.append({
                'cashier_item_id': len(cashier_items) + 1,
                'cashier_record_id': cashier_id,
                'drug_id': drug['drug_id'],
                'inventory_id': inv_id,
                'batch_no': random.choice(matched_inv)['batch_no'] if matched_inv else f'B{random.randint(20240000, 20269999)}',
                'quantity': qty,
                'unit_price': price,
                'subtotal': subtotal,
                'is_prescription': drug['is_prescription'],
                'prescription_id': prescription_id if (drug['is_prescription'] and is_prescription_sale) else None,
                'created_at': sale_time,
            })

        insurance_amount = round(total_amount * random.uniform(0.3, 0.8), 2) if random.random() < 0.7 else 0
        self_pay_amount = round(total_amount - insurance_amount, 2)

        cashier_records.append({
            'cashier_record_id': cashier_id,
            'receipt_no': f'S{2024000000 + cashier_id}',
            'store_id': store_id,
            'member_id': member_id,
            'cashier': random.choice(['收银员A', '收银员B', '收银员C', '收银员D']),
            'sale_time': sale_time,
            'total_amount': round(total_amount, 2),
            'payment_method': random.choice(['医保', '微信', '支付宝', '现金', '银行卡']),
            'insurance_amount': insurance_amount,
            'self_pay_amount': self_pay_amount,
            'is_insurance_settled': insurance_amount > 0,
            'created_at': sale_time,
        })

        if insurance_amount > 0:
            insurance_records.append({
                'insurance_record_id': len(insurance_records) + 1,
                'insurance_no': f'INS{20240000 + len(insurance_records)}',
                'cashier_record_id': cashier_id,
                'store_id': store_id,
                'member_id': member_id,
                'settlement_time': sale_time + timedelta(minutes=random.randint(1, 10)),
                'insurance_type': random.choice(['职工医保', '居民医保', '新农合']),
                'policy_holder_name': members_df[members_df['member_id'] == member_id]['name'].values[0],
                'total_amount': round(total_amount, 2),
                'insurance_pay': insurance_amount,
                'self_pay': self_pay_amount,
                'reimbursement_ratio': round(insurance_amount / total_amount, 2) if total_amount > 0 else 0,
                'status': random.choice(['成功', '成功', '成功', '待结算']),
                'created_at': sale_time,
            })

    return {
        'stores': stores,
        'drugs': drugs,
        'members': members_df,
        'prescriptions': pd.DataFrame(prescriptions),
        'prescription_items': pd.DataFrame(prescription_items),
        'cashier_records': pd.DataFrame(cashier_records),
        'cashier_items': pd.DataFrame(cashier_items),
        'insurance_records': pd.DataFrame(insurance_records),
        'audit_tasks': pd.DataFrame(audit_tasks),
        'followup_records': pd.DataFrame(followup_records),
        'inventory': pd.DataFrame(inventory),
        'replenishment_orders': pd.DataFrame(replenishment_orders),
        'replenishment_items': pd.DataFrame(replenishment_items),
    }


mock_data = generate_mock_data()
