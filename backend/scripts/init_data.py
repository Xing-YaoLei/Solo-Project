"""
初始化脚本：创建演示用户与示例数据

使用方式：
    cd backend
    python scripts/init_data.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models import (
    User, RoleEnum, GuideRoute, HeatPoint, GuideContent,
    Performance, PerformanceSession, Seat, Merchant, MerchantContract,
    RecordStatusEnum,
)
from app.core.security import get_password_hash
from datetime import datetime, timedelta


def init_users(db):
    users = [
        {
            'username': 'admin',
            'password': 'admin123',
            'full_name': '超级管理员',
            'phone': '13800000001',
            'email': 'admin@scenic.com',
            'role': RoleEnum.ADMIN,
        },
        {
            'username': 'operation01',
            'password': 'op123456',
            'full_name': '运营主管-李娜',
            'phone': '13800000002',
            'email': 'lina@scenic.com',
            'role': RoleEnum.OPERATION,
        },
        {
            'username': 'patrol01',
            'password': 'pa123456',
            'full_name': '巡场员-王强',
            'phone': '13800000003',
            'email': 'wangqiang@scenic.com',
            'role': RoleEnum.PATROL,
        },
        {
            'username': 'ticket01',
            'password': 'tk123456',
            'full_name': '票务员-赵敏',
            'phone': '13800000004',
            'email': 'zhaomin@scenic.com',
            'role': RoleEnum.TICKET_CLERK,
        },
        {
            'username': 'tourist01',
            'password': 'tu123456',
            'full_name': '游客-陈浩',
            'phone': '13900000001',
            'email': 'chenhao@test.com',
            'role': RoleEnum.TOURIST,
        },
    ]
    created = 0
    for u in users:
        if db.query(User).filter(User.username == u['username']).first():
            continue
        db.add(User(
            username=u['username'],
            email=u['email'],
            hashed_password=get_password_hash(u['password']),
            full_name=u['full_name'],
            phone=u['phone'],
            role=u['role'],
        ))
        created += 1
    print(f'[用户] 创建 {created} 个演示账户')
    print('     admin / admin123       - 超级管理员')
    print('     operation01 / op123456  - 运营')
    print('     patrol01 / pa123456     - 巡场')
    print('     ticket01 / tk123456     - 票务员')
    print('     tourist01 / tu123456    - 游客')


def init_routes(db):
    op_user = db.query(User).filter(User.username == 'operation01').first()
    uid = op_user.id if op_user else 1
    routes_data = [
        {
            'name': '经典一日游', 'code': 'ROUTE-001',
            'description': '涵盖景区核心景点，约60分钟走完全程',
            'duration_minutes': 60, 'distance_meters': 2800, 'sort_order': 1,
            'status': RecordStatusEnum.APPROVED,
        },
        {
            'name': '深度文化游', 'code': 'ROUTE-002',
            'description': '深度体验历史文化景点，适合文化爱好者',
            'duration_minutes': 120, 'distance_meters': 4500, 'sort_order': 2,
            'status': RecordStatusEnum.APPROVED,
        },
        {
            'name': '亲子欢乐游', 'code': 'ROUTE-003',
            'description': '亲子互动主题路线，涵盖游乐设施与动物表演',
            'duration_minutes': 90, 'distance_meters': 3200, 'sort_order': 3,
            'status': RecordStatusEnum.PENDING,
        },
    ]
    created = 0
    for r in routes_data:
        if db.query(GuideRoute).filter(GuideRoute.code == r['code']).first():
            continue
        db.add(GuideRoute(**r, created_by=uid))
        created += 1
    print(f'[导览路线] 创建 {created} 条')


def init_heat_points(db):
    pa_user = db.query(User).filter(User.username == 'patrol01').first()
    uid = pa_user.id if pa_user else 1
    route1 = db.query(GuideRoute).filter(GuideRoute.code == 'ROUTE-001').first()
    if not route1:
        return
    rid = route1.id
    points = [
        ('主入口', 'HP-001', 31.2304, 121.4737, 80, '景区游客中心及安检入口', 1, RecordStatusEnum.APPROVED),
        ('迎宾广场', 'HP-002', 31.2308, 121.4742, 60, '音乐喷泉与导览图', 2, RecordStatusEnum.APPROVED),
        ('千年古樟', 'HP-003', 31.2312, 121.4748, 40, '800年古樟树，历史地标', 3, RecordStatusEnum.PENDING),
        ('状元桥', 'HP-004', 31.2318, 121.4752, 50, '古代石拱桥，拍照打卡点', 4, RecordStatusEnum.PENDING),
        ('民俗馆', 'HP-005', 31.2322, 121.4758, 100, '本地民俗文化展示馆', 5, RecordStatusEnum.APPROVED),
        ('山顶观景台', 'HP-006', 31.2330, 121.4765, 70, '360度全景观景平台', 6, RecordStatusEnum.DRAFT),
        ('游船码头', 'HP-007', 31.2326, 121.4770, 60, '水上观光游船起点', 7, RecordStatusEnum.PENDING),
    ]
    created = 0
    for name, code, lat, lng, radius, desc, sort, status in points:
        if db.query(HeatPoint).filter(HeatPoint.code == code).first():
            continue
        db.add(HeatPoint(
            route_id=rid, name=name, code=code, latitude=lat, longitude=lng,
            radius_meters=radius, description=desc, sort_order=sort, status=status,
            verified_at=datetime.utcnow() if status == RecordStatusEnum.APPROVED else None,
            verified_by=uid if status == RecordStatusEnum.APPROVED else None,
            created_by=uid,
        ))
        created += 1
    print(f'[热力点位] 创建 {created} 个')


def init_guide_contents(db):
    op_user = db.query(User).filter(User.username == 'operation01').first()
    uid = op_user.id if op_user else 1
    route1 = db.query(GuideRoute).filter(GuideRoute.code == 'ROUTE-001').first()
    if not route1:
        return
    rid = route1.id
    contents = [
        ('欢迎来到景区', 'text', '您现在所在的位置是景区主入口，这里是游客集散中心...', 'zh-CN', 1, RecordStatusEnum.APPROVED),
        ('迎宾广场音乐喷泉介绍', 'audio', None, 'zh-CN', 2, RecordStatusEnum.APPROVED),
        ('千年古樟树传说', 'text', '这棵古樟树植于南宋年间，距今已有800余年历史...', 'zh-CN', 3, RecordStatusEnum.PENDING),
        ('Welcome to the Scenic Area', 'text', 'Welcome! You are now at the main entrance...', 'en-US', 1, RecordStatusEnum.DRAFT),
        ('山顶观景台导览', 'video', None, 'zh-CN', 6, RecordStatusEnum.PENDING),
    ]
    created = 0
    for title, ctype, text, lang, sort, status in contents:
        db.add(GuideContent(
            route_id=rid, title=title, content_type=ctype, content_text=text,
            language=lang, sort_order=sort, status=status,
            verified_at=datetime.utcnow() if status == RecordStatusEnum.APPROVED else None,
            verified_by=uid if status == RecordStatusEnum.APPROVED else None,
            created_by=uid,
        ))
        created += 1
    print(f'[导览内容] 创建 {created} 条')


def init_performances(db):
    op_user = db.query(User).filter(User.username == 'operation01').first()
    uid = op_user.id if op_user else 1
    perfs = [
        {
            'name': '梦回千年·大型实景演出', 'code': 'PERF-001',
            'venue': '山水剧场', 'duration_minutes': 70,
            'description': '以景区千年历史为背景，200名演员倾情演绎',
        },
        {
            'name': '民俗非遗表演', 'code': 'PERF-002',
            'venue': '民俗馆戏台', 'duration_minutes': 45,
            'description': '地方戏曲、皮影戏、木偶戏等非遗项目展演',
        },
        {
            'name': '森林动物剧场', 'code': 'PERF-003',
            'venue': '动物表演场', 'duration_minutes': 40,
            'description': '可爱动物明星互动演出',
        },
    ]
    perf_ids = {}
    for p in perfs:
        perf = db.query(Performance).filter(Performance.code == p['code']).first()
        if not perf:
            perf = Performance(**p, created_by=uid)
            db.add(perf)
            db.flush()
            print(f'[演出] 创建: {p["name"]}')
        perf_ids[p['code']] = perf.id

    for code, pid in perf_ids.items():
        # 为每个演出创建未来3天的场次
        existing = db.query(PerformanceSession).filter(PerformanceSession.performance_id == pid).count()
        if existing > 0:
            continue
        for day in range(1, 4):
            for hour in [10, 14, 19]:
                start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0) \
                    + timedelta(days=day, hours=hour)
                perf = db.query(Performance).filter(Performance.id == pid).first()
                duration = perf.duration_minutes if perf else 60
                sess = PerformanceSession(
                    performance_id=pid,
                    start_time=start,
                    end_time=start + timedelta(minutes=duration),
                    total_seats=0,
                    status=RecordStatusEnum.PENDING,
                    created_by=uid,
                )
                db.add(sess)
                db.flush()
                # 创建座位
                rows = ['A', 'B', 'C', 'D', 'E']
                zones = {'A': 'VIP', 'B': 'VIP', 'C': '普通', 'D': '普通', 'E': '普通'}
                prices = {'A': 288, 'B': 288, 'C': 168, 'D': 168, 'E': 168}
                for row in rows:
                    for n in range(1, 13):
                        seat = Seat(
                            session_id=sess.id,
                            row=row, number=str(n), zone=zones[row], price=prices[row],
                            is_available=True, is_verified=False,
                        )
                        db.add(seat)
                sess.total_seats = 60
    print(f'[演出场次+座位] 初始化完成')


def init_merchants_and_contracts(db):
    op_user = db.query(User).filter(User.username == 'operation01').first()
    uid = op_user.id if op_user else 1
    merchants_data = [
        {'name': '老街食府', 'category': '餐饮', 'contact_name': '张老板', 'contact_phone': '13811110001', 'address': '景区商业街1号'},
        {'name': '文创礼品专卖店', 'category': '纪念品', 'contact_name': '刘经理', 'contact_phone': '13811110002', 'address': '出口大厅东侧'},
        {'name': '山景度假酒店', 'category': '住宿', 'contact_name': '陈总', 'contact_phone': '13811110003', 'address': '景区西翼'},
        {'name': '观光缆车服务站', 'category': '交通', 'contact_name': '黄主任', 'contact_phone': '13811110004'},
    ]
    created_merchants = 0
    for m in merchants_data:
        if db.query(Merchant).filter(Merchant.name == m['name']).first():
            continue
        db.add(Merchant(**m, created_by=uid))
        created_merchants += 1
    db.flush()
    print(f'[商户] 创建 {created_merchants} 家')

    # 创建合同
    today = datetime.utcnow().date()
    merchants = db.query(Merchant).all()
    contracts_data = [
        {
            'contract_no': 'HT-2024-0001',
            'title': '2024年度老街食府场地租赁合同',
            'start_date': today.replace(month=1, day=1),
            'end_date': today.replace(month=12, day=31),
            'amount': 180000.00,
            'status': RecordStatusEnum.APPROVED,
            'content': '租赁商业街1号场地，年租金18万元，按月支付',
        },
        {
            'contract_no': 'HT-2024-0002',
            'title': '文创礼品销售分成协议',
            'start_date': today,
            'end_date': today + timedelta(days=365),
            'amount': 60000.00,
            'status': RecordStatusEnum.PENDING,
            'content': '景区提供场地，分成比例按销售额15%计算',
        },
        {
            'contract_no': 'HT-2024-0003',
            'title': '山景度假酒店合作推广',
            'start_date': today.replace(month=6, day=1),
            'end_date': today.replace(year=today.year + 1, month=5, day=31),
            'amount': 120000.00,
            'status': RecordStatusEnum.DRAFT,
        },
    ]
    created_contracts = 0
    for i, c in enumerate(contracts_data):
        if db.query(MerchantContract).filter(MerchantContract.contract_no == c['contract_no']).first():
            continue
        merchant = merchants[i % len(merchants)]
        db.add(MerchantContract(
            merchant_id=merchant.id, **c,
            verified_at=datetime.utcnow() if c['status'] == RecordStatusEnum.APPROVED else None,
            verified_by=uid if c['status'] == RecordStatusEnum.APPROVED else None,
            created_by=uid,
        ))
        created_contracts += 1
    print(f'[合同] 创建 {created_contracts} 份')


def main():
    print('=' * 50)
    print('景区运营导览跟进台 - 初始化演示数据')
    print('=' * 50)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        init_users(db)
        init_routes(db)
        init_heat_points(db)
        init_guide_contents(db)
        init_performances(db)
        init_merchants_and_contracts(db)
        db.commit()
        print()
        print('✅ 初始化完成！')
        print('   启动后端: cd backend && uvicorn app.main:app --reload')
        print('   启动前端: cd frontend && npm run dev')
    except Exception as e:
        db.rollback()
        print('❌ 初始化失败:', e)
        raise
    finally:
        db.close()


if __name__ == '__main__':
    main()
