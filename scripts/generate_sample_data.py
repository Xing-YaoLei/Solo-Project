#!/usr/bin/env python
"""生成示例数据并导入，用于快速体验报表效果"""
import os
import sys
import random
import pandas as pd
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import config


def generate_crm_properties(output_path):
    projects = ['阳光花园', '水岸豪庭', '翠湖天地', '金茂府', '滨江一号', '御景台']
    districts = ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '通州区']
    room_types = ['一室一厅', '两室一厅', '两室两厅', '三室一厅', '三室两厅', '四室两厅']
    statuses = ['draft', 'pending_review', 'published', 'published', 'published', 'offline']

    records = []
    for i in range(1, 251):
        project = random.choice(projects)
        district = random.choice(districts)
        building = f"{random.randint(1, 20)}号楼"
        unit = f"{random.randint(1, 3)}单元"
        room_no = f"{random.randint(1, 33):02d}{random.randint(1, 4):02d}"
        floor = random.randint(1, 33)
        area = round(random.uniform(35, 180), 1)
        photo_count = random.choice([0, 1, 2, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25])
        status = random.choice(statuses)
        manager_id = random.choice([None, 2, 3, 4, 5])
        publish_time = None
        if status == 'published':
            publish_time = datetime(2024, random.randint(1, 12), random.randint(1, 28))

        records.append({
            '房源编号': f"PROP{i:06d}",
            '项目名称': project,
            '楼栋': f"{building}-{unit}",
            '房号': room_no,
            '楼层': floor,
            '户型': random.choice(room_types),
            '面积': area,
            '区域': district,
            '地址': f"北京市{district}{project}{building}{room_no}室",
            '照片数量': photo_count,
            '上架状态': {
                'draft': '草稿', 'pending_review': '待审核',
                'published': '已发布', 'offline': '已下架'
            }.get(status, status),
            '发布时间': publish_time.strftime('%Y-%m-%d') if publish_time else '',
            '负责人': manager_id,
        })

    df = pd.DataFrame(records)
    df.to_excel(output_path, index=False)
    print(f"✅ 生成CRM房源数据: {len(records)} 条 -> {output_path}")
    return output_path


def generate_crm_tenants(output_path):
    names = ['张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆', '赵敏', '黄磊', '周婷', '吴昊']
    stages = ['意向', '看房', '意向金', '签约中', '已入住', '已入住', '已入住', '已退租']
    companies = ['百度', '阿里', '腾讯', '字节跳动', '美团', '京东', '小米', '华为']
    occupations = ['程序员', '产品经理', '设计师', '运营', '销售', '教师', '医生', '金融']

    records = []
    for i in range(1, 301):
        name = random.choice(names) + random.choice(['', 'A', 'B', 'C', '明', '红', '强', '丽'])
        stage = random.choice(stages)
        records.append({
            '租客编号': f"TEN{i:06d}",
            '姓名': name,
            '身份证': f"1101{random.randint(100000000000, 999999999999)}",
            '手机号': f"13{random.randint(0, 9)}{random.randint(10000000, 99999999)}",
            '性别': random.choice(['男', '女']),
            '年龄': random.randint(20, 45),
            '职业': random.choice(occupations),
            '公司': random.choice(companies),
            '紧急联系人': f"13{random.randint(0, 9)}{random.randint(10000000, 99999999)}",
            '档案阶段': stage,
            '信用分': random.randint(550, 850),
        })

    df = pd.DataFrame(records)
    df.to_excel(output_path, index=False)
    print(f"✅ 生成CRM租客数据: {len(records)} 条 -> {output_path}")
    return output_path


def generate_contracts(output_path, prop_count=250, tenant_count=300):
    versions = ['V1.0', 'V1.1', 'V2.0', 'V2.1', 'V3.0']
    methods = ['月付', '季付', '季付', '半年付', '年付']
    statuses = ['pending', 'signing', 'active', 'active', 'active', 'active', 'expired', 'terminated']

    records = []
    active_contracts = 0
    contract_idx = 1
    for i in range(1, prop_count + 1):
        status = random.choice(statuses)
        if status == 'active':
            active_contracts += 1
        else:
            if random.random() < 0.3:
                continue

        version = random.choice(versions)
        start = datetime(2023, random.randint(1, 12), random.randint(1, 28))
        months = random.randint(6, 36)
        end = start + timedelta(days=months * 30)
        rent = random.choice([2500, 3200, 4000, 4800, 5500, 6500, 8000, 10000, 12000])
        method = random.choice(methods)
        tenant_id = f"TEN{random.randint(1, tenant_count):06d}"

        overdue_status = 'normal'
        overdue_days = 0
        overdue_amount = 0
        if status == 'active' and random.random() < 0.15:
            overdue_status = 'overdue'
            overdue_days = random.randint(1, 90)
            if method == '月付':
                overdue_amount = rent * (overdue_days // 30 + 1)
            elif method == '季付':
                overdue_amount = rent * 3 if overdue_days > 90 else 0
            else:
                overdue_amount = rent

        records.append({
            '合同编号': f"CT{contract_idx:08d}",
            '合同版本': version,
            '房源编号': f"PROP{i:06d}",
            '租客编号': tenant_id,
            '合同类型': '长租',
            '月租金': rent,
            '押金金额': rent * random.choice([1, 2, 3]),
            '开始日期': start.strftime('%Y-%m-%d'),
            '结束日期': end.strftime('%Y-%m-%d'),
            '付款方式': method,
            '合同状态': {
                'pending': '待签署', 'signing': '签署中',
                'active': '履行中', 'expired': '已到期', 'terminated': '已终止'
            }.get(status, status),
            '签署时间': (start - timedelta(days=random.randint(1, 14))).strftime('%Y-%m-%d'),
            '电子合同链接': f"https://esign.example.com/contract/CT{contract_idx:08d}",
            '逾期状态': '逾期' if overdue_status == 'overdue' else '正常',
            '逾期天数': overdue_days,
            '逾期金额': overdue_amount,
        })
        contract_idx += 1

    df = pd.DataFrame(records)
    df.to_excel(output_path, index=False)
    print(f"✅ 生成电子合同数据: {len(records)} 条 -> {output_path}")
    return output_path


def generate_meter_readings(output_path, contract_file):
    contracts_df = pd.read_excel(contract_file)
    active = contracts_df[contracts_df['合同状态'] == '履行中']
    meter_types = [
        ('水', 4.5, random.uniform(5, 30)),
        ('电', 0.55, random.uniform(100, 800)),
        ('燃气', 2.6, random.uniform(10, 80)),
    ]

    records = []
    reading_id = 1
    today = datetime.today()
    for month_offset in range(6):
        period_date = today - timedelta(days=month_offset * 30)
        period = period_date.strftime('%Y%m')
        read_date = period_date.replace(day=28)

        for _, contract in active.iterrows():
            if random.random() > 0.7:
                continue
            for mtype, price, base_usage in meter_types:
                last_read = random.uniform(100, 5000)
                usage = base_usage * random.uniform(0.7, 1.3)
                curr_read = last_read + usage
                amount = usage * price

                records.append({
                    '抄表编号': f"MR{reading_id:08d}",
                    '合同编号': contract['合同编号'],
                    '房源编号': contract['房源编号'],
                    '账期': period,
                    '表类型': mtype,
                    '上次读数': round(last_read, 2),
                    '当前读数': round(curr_read, 2),
                    '用量': round(usage, 2),
                    '单价': price,
                    '金额': round(amount, 2),
                    '抄表日期': read_date.strftime('%Y-%m-%d'),
                })
                reading_id += 1

    df = pd.DataFrame(records)
    df.to_excel(output_path, index=False)
    print(f"✅ 生成抄表数据: {len(records)} 条 -> {output_path}")
    return output_path


def generate_repairs(output_path, prop_count=250):
    repair_types = ['水电维修', '管道疏通', '家电维修', '家具维修', '门锁维修',
                    '墙面修补', '空调维修', '热水器维修', '网络故障', '其他']
    statuses = ['待处理', '处理中', '已完成', '已完成', '已完成', '已关闭']
    repairers = ['李师傅', '王师傅', '张师傅', '赵师傅', '钱师傅', '孙师傅']

    records = []
    repair_id = 1
    today = datetime.today()
    for month_offset in range(6):
        base_date = today - timedelta(days=month_offset * 30)
        repairs_this_month = random.randint(30, 80)

        for _ in range(repairs_this_month):
            rtype = random.choice(repair_types)
            status = random.choice(statuses)
            report = base_date + timedelta(
                days=random.randint(0, 29),
                hours=random.randint(8, 20),
                minutes=random.randint(0, 59)
            )
            assign = report + timedelta(hours=random.randint(1, 48))
            complete = None
            cost = 0
            satisfaction = None
            if status in ('已完成', '已关闭'):
                complete = assign + timedelta(hours=random.randint(1, 120))
                cost = round(random.uniform(30, 2000), 2)
                satisfaction = random.randint(3, 5)

            records.append({
                '工单编号': f"RP{repair_id:08d}",
                '房源编号': f"PROP{random.randint(1, prop_count):06d}",
                '维修类型': rtype,
                '问题描述': f"{rtype}-{random.choice(['日常报修', '紧急报修', '定期保养'])}",
                '报修时间': report.strftime('%Y-%m-%d %H:%M'),
                '派单时间': assign.strftime('%Y-%m-%d %H:%M'),
                '完成时间': complete.strftime('%Y-%m-%d %H:%M') if complete else '',
                '维修状态': status,
                '维修费用': cost,
                '维修人员': random.choice(repairers),
                '满意度': satisfaction if satisfaction else '',
            })
            repair_id += 1

    df = pd.DataFrame(records)
    df.to_excel(output_path, index=False)
    print(f"✅ 生成维修记录数据: {len(records)} 条 -> {output_path}")
    return output_path


def main():
    os.makedirs(config.EXPORT_DIR, exist_ok=True)

    print("=" * 60)
    print("生成示例数据文件...")
    print("=" * 60)

    prop_file = os.path.join(config.EXPORT_DIR, '示例_CRM房源.xlsx')
    tenant_file = os.path.join(config.EXPORT_DIR, '示例_CRM租客.xlsx')
    contract_file = os.path.join(config.EXPORT_DIR, '示例_电子合同.xlsx')
    meter_file = os.path.join(config.EXPORT_DIR, '示例_抄表数据.xlsx')
    repair_file = os.path.join(config.EXPORT_DIR, '示例_维修记录.xlsx')

    generate_crm_properties(prop_file)
    generate_crm_tenants(tenant_file)
    generate_contracts(contract_file, prop_count=250, tenant_count=300)
    generate_meter_readings(meter_file, contract_file)
    generate_repairs(repair_file, prop_count=250)

    print()
    print("=" * 60)
    print("示例数据生成完成！请在系统的【数据导入】页面依次导入：")
    print("  1️⃣", prop_file)
    print("  2️⃣", tenant_file)
    print("  3️⃣", contract_file)
    print("  4️⃣", meter_file)
    print("  5️⃣", repair_file)
    print("=" * 60)


if __name__ == '__main__':
    main()
