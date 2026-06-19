"""seed initial data

Revision ID: 0003_seed_data
Revises: 0002_make_handler_id_nullable
Create Date: 2026-06-19 00:00:02.000000

"""
from typing import Sequence, Union
import uuid
from datetime import date, datetime, timedelta

from alembic import op
import sqlalchemy as sa

revision: str = '0003_seed_data'
down_revision: Union[str, None] = '0002_make_handler_id_nullable'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


handler_table = sa.table(
    'handler',
    sa.column('id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('name', sa.String),
    sa.column('role', sa.String),
    sa.column('is_active', sa.Boolean),
)

complaint_table = sa.table(
    'complaint',
    sa.column('id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('title', sa.String),
    sa.column('description', sa.Text),
    sa.column('source_channel', sa.String),
    sa.column('status', sa.String),
    sa.column('priority', sa.String),
    sa.column('complainant_name', sa.String),
    sa.column('complainant_contact', sa.String),
    sa.column('homestay_name', sa.String),
    sa.column('room_number', sa.String),
    sa.column('check_in_date', sa.Date),
    sa.column('check_out_date', sa.Date),
    sa.column('handler_id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('created_at', sa.DateTime),
    sa.column('updated_at', sa.DateTime),
    sa.column('closed_at', sa.DateTime),
)

tag_table = sa.table(
    'complaint_tag',
    sa.column('id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('complaint_id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('tag', sa.String),
)

visit_table = sa.table(
    'visit_result',
    sa.column('id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('complaint_id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('visit_method', sa.String),
    sa.column('visitor_name', sa.String),
    sa.column('satisfaction', sa.String),
    sa.column('feedback', sa.Text),
    sa.column('visit_at', sa.DateTime),
)

resp_table = sa.table(
    'responsibility',
    sa.column('id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('complaint_id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('responsible_type', sa.String),
    sa.column('responsible_person', sa.String),
    sa.column('judgment_basis', sa.Text),
    sa.column('determined_by', sa.String),
    sa.column('determined_at', sa.DateTime),
)

record_table = sa.table(
    'handling_record',
    sa.column('id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('complaint_id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('handler_id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('action', sa.String),
    sa.column('description', sa.Text),
    sa.column('created_at', sa.DateTime),
)

review_table = sa.table(
    'review',
    sa.column('id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('complaint_id', sa.dialects.postgresql.UUID(as_uuid=True)),
    sa.column('review_tags', sa.String),
    sa.column('summary', sa.Text),
    sa.column('improvement_measures', sa.Text),
    sa.column('reviewer_name', sa.String),
    sa.column('reviewed_at', sa.DateTime),
)


def upgrade() -> None:
    conn = op.get_bind()

    result = conn.execute(sa.select(sa.func.count()).select_from(handler_table))
    if result.scalar() > 0:
        return

    h1 = uuid.uuid4()
    h2 = uuid.uuid4()
    h3 = uuid.uuid4()
    h4 = uuid.uuid4()

    op.bulk_insert(handler_table, [
        {'id': h1, 'name': '张伟', 'role': '前台主管', 'is_active': True},
        {'id': h2, 'name': '李娜', 'role': '客房经理', 'is_active': True},
        {'id': h3, 'name': '王强', 'role': '客服专员', 'is_active': True},
        {'id': h4, 'name': '赵敏', 'role': '店长', 'is_active': True},
    ])

    now = datetime.now()
    c1 = uuid.uuid4()
    c2 = uuid.uuid4()
    c3 = uuid.uuid4()
    c4 = uuid.uuid4()
    c5 = uuid.uuid4()

    op.bulk_insert(complaint_table, [
        {
            'id': c1,
            'title': '客房空调不制冷',
            'description': '客人入住后发现空调只出风不制冷，室外温度35度，室内温度一直30度降不下来。',
            'source_channel': '电话',
            'status': 'completed',
            'priority': 'high',
            'complainant_name': '陈先生',
            'complainant_contact': '138****1234',
            'homestay_name': '云栖山舍',
            'room_number': '203',
            'check_in_date': date.today() - timedelta(days=5),
            'check_out_date': date.today() - timedelta(days=3),
            'handler_id': h2,
            'created_at': now - timedelta(days=5),
            'updated_at': now - timedelta(days=3),
            'closed_at': now - timedelta(days=3),
        },
        {
            'id': c2,
            'title': '早餐品种太少',
            'description': '客人反映连续住3天，每天早餐基本一样，品种少，没有当地特色。',
            'source_channel': '平台',
            'status': 'processing',
            'priority': 'medium',
            'complainant_name': '林女士',
            'complainant_contact': '139****5678',
            'homestay_name': '湖畔居',
            'room_number': '105',
            'check_in_date': date.today() - timedelta(days=2),
            'check_out_date': date.today() + timedelta(days=1),
            'handler_id': h3,
            'created_at': now - timedelta(days=1),
            'updated_at': now - timedelta(hours=5),
            'closed_at': None,
        },
        {
            'id': c3,
            'title': '房间卫生问题：发现毛发',
            'description': '入住时在枕头下面和浴缸边缘发现疑似毛发，要求换房并退房费。',
            'source_channel': '现场',
            'status': 'missing_materials',
            'priority': 'urgent',
            'complainant_name': '周先生',
            'complainant_contact': '136****9999',
            'homestay_name': '云栖山舍',
            'room_number': '308',
            'check_in_date': date.today(),
            'check_out_date': None,
            'handler_id': h4,
            'created_at': now - timedelta(hours=2),
            'updated_at': now - timedelta(hours=1),
            'closed_at': None,
        },
        {
            'id': c4,
            'title': '预订信息不符',
            'description': '平台预订显示含接送站服务，到店后被告知不包含，需要额外付费。',
            'source_channel': '微信',
            'status': 'under_review',
            'priority': 'high',
            'complainant_name': '吴女士',
            'complainant_contact': '137****2222',
            'homestay_name': '江南小筑',
            'room_number': 'A栋201',
            'check_in_date': date.today() - timedelta(days=3),
            'check_out_date': date.today() - timedelta(days=1),
            'handler_id': h1,
            'created_at': now - timedelta(days=3),
            'updated_at': now - timedelta(hours=8),
            'closed_at': None,
        },
        {
            'id': c5,
            'title': '周边施工噪音影响休息',
            'description': '民宿隔壁楼盘夜间施工到23点，无法正常入睡，希望能协调解决或安排其他住宿。',
            'source_channel': '电话',
            'status': 'pending',
            'priority': 'urgent',
            'complainant_name': '郑先生',
            'complainant_contact': '135****8888',
            'homestay_name': '江南小筑',
            'room_number': 'B栋102',
            'check_in_date': date.today(),
            'check_out_date': None,
            'handler_id': None,
            'created_at': now - timedelta(minutes=30),
            'updated_at': None,
            'closed_at': None,
        },
    ])

    op.bulk_insert(tag_table, [
        {'id': uuid.uuid4(), 'complaint_id': c1, 'tag': '设施'},
        {'id': uuid.uuid4(), 'complaint_id': c2, 'tag': '服务'},
        {'id': uuid.uuid4(), 'complaint_id': c2, 'tag': '其他'},
        {'id': uuid.uuid4(), 'complaint_id': c3, 'tag': '卫生'},
        {'id': uuid.uuid4(), 'complaint_id': c3, 'tag': '服务'},
        {'id': uuid.uuid4(), 'complaint_id': c4, 'tag': '价格'},
        {'id': uuid.uuid4(), 'complaint_id': c4, 'tag': '服务'},
        {'id': uuid.uuid4(), 'complaint_id': c5, 'tag': '噪音'},
    ])

    op.bulk_insert(visit_table, [
        {
            'id': uuid.uuid4(),
            'complaint_id': c1,
            'visit_method': '电话',
            'visitor_name': '王强',
            'satisfaction': '满意',
            'feedback': '客人对处理速度和更换房间的安排表示满意，同意继续入住。',
            'visit_at': now - timedelta(days=4),
        },
        {
            'id': uuid.uuid4(),
            'complaint_id': c2,
            'visit_method': '现场',
            'visitor_name': '李娜',
            'satisfaction': '一般',
            'feedback': '客人希望尽快增加早餐品种，对已有处理回应表示理解但不满。',
            'visit_at': now - timedelta(hours=12),
        },
    ])

    op.bulk_insert(resp_table, [
        {
            'id': uuid.uuid4(),
            'complaint_id': c1,
            'responsible_type': '供应商',
            'responsible_person': '李娜',
            'judgment_basis': '空调维保单位每月检修未按时完成，导致故障未提前发现。客房经理协调维修不及时。',
            'determined_by': '赵敏',
            'determined_at': now - timedelta(days=4),
        },
        {
            'id': uuid.uuid4(),
            'complaint_id': c3,
            'responsible_type': '员工',
            'responsible_person': '张伟',
            'judgment_basis': None,
            'determined_by': '赵敏',
            'determined_at': now - timedelta(hours=1),
        },
    ])

    op.bulk_insert(record_table, [
        {
            'id': uuid.uuid4(),
            'complaint_id': c1,
            'handler_id': h2,
            'action': '联系维修',
            'description': '立即联系空调维修师傅上门检修，师傅反馈压缩机故障，需要更换零件。',
            'created_at': now - timedelta(days=5, hours=-1),
        },
        {
            'id': uuid.uuid4(),
            'complaint_id': c1,
            'handler_id': h2,
            'action': '安排换房',
            'description': '为客人临时升级到相邻的205豪华房（同价位但已确认空调正常），客人已入住。',
            'created_at': now - timedelta(days=5, hours=-2),
        },
        {
            'id': uuid.uuid4(),
            'complaint_id': c2,
            'handler_id': h3,
            'action': '当面沟通',
            'description': '与客人沟通，了解具体诉求，客人希望增加中式早点和当地小吃。已记录反馈给后厨。',
            'created_at': now - timedelta(hours=8),
        },
        {
            'id': uuid.uuid4(),
            'complaint_id': c3,
            'handler_id': h4,
            'action': '现场核查',
            'description': '已前往308房间核实，确实发现浴室玻璃门边缘有毛发。正在核实清洁排班记录。',
            'created_at': now - timedelta(hours=1, minutes=-30),
        },
    ])

    op.bulk_insert(review_table, [
        {
            'id': uuid.uuid4(),
            'complaint_id': c1,
            'review_tags': '设施维保,应急响应',
            'summary': '空调压缩机故障导致客诉，需优化设备巡检流程。',
            'improvement_measures': '1. 空调维保周期从每月一次改为每两周一次；2. 入住前30分钟前台电话确认房间设施正常；3. 备1台临时移动空调应对紧急情况。',
            'reviewer_name': '赵敏',
            'reviewed_at': now - timedelta(days=3),
        },
    ])


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.delete(review_table))
    conn.execute(sa.delete(record_table))
    conn.execute(sa.delete(resp_table))
    conn.execute(sa.delete(visit_table))
    conn.execute(sa.delete(tag_table))
    conn.execute(sa.delete(complaint_table))
    conn.execute(sa.delete(handler_table))
