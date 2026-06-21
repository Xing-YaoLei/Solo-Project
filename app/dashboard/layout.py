import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
import logging

import dash
from dash import dcc, html, Input, Output, State, CallbackContext, ALL
import dash_bootstrap_components as dbc
import pandas as pd
import numpy as np
import plotly.graph_objects as go

from flask import Flask, session, request, redirect, url_for, send_from_directory, abort, make_response
from flask_login import LoginManager, login_user, logout_user, login_required, current_user

from config import config as config_module
from app.models import db, User, Case, Client, DashboardMaterializedView, ShareLink, PaymentTransaction, Hearing, Evidence
from app.services.data_service import (
    QueryService, TrendService, FinanceService, RefreshService
)
from app.services.auth_service import (
    AuthService, ShareLinkService, VirtualUser
)
from app.services.export_service import ExportService
from app.dashboard.charts import (
    ClientTrendChart, CaseStageChart, EvidenceTable, HearingAnomalyChart,
    COLOR_PALETTE, STAGE_COLORS, RISK_COLORS
)

login_manager = LoginManager()
login_manager.login_view = 'login'


@login_manager.user_loader
def load_user(user_id: str):
    if user_id.startswith('virtual_'):
        return None
    return User.query.get(user_id)


def create_app(config_name: str = None) -> Flask:
    config_name = config_name or os.environ.get('FLASK_ENV', 'default')
    cfg = config_module[config_name]

    server = Flask(__name__)
    server.config.from_object(cfg)
    server.config['SECRET_KEY'] = cfg.SECRET_KEY
    server.config['SQLALCHEMY_DATABASE_URI'] = cfg.SQLALCHEMY_DATABASE_URI
    server.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    db.init_app(server)
    login_manager.init_app(server)

    external_stylesheets = [
        dbc.themes.FLATLY,
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
    ]
    dash_app = dash.Dash(
        __name__,
        server=server,
        external_stylesheets=external_stylesheets,
        suppress_callback_exceptions=True,
        title='法律服务案件委托风险监测',
        update_title='数据更新中...',
        meta_tags=[
            {'name': 'viewport', 'content': 'width=device-width, initial-scale=1'},
            {'charset': 'UTF-8'}
        ],
        url_base_pathname='/dashboard/'
    )
    dash_app.config.suppress_callback_exceptions = True

    with server.app_context():
        db.create_all()
        _ensure_default_user(cfg)

    _register_flask_routes(server, cfg)

    from app.dashboard.components import build_full_layout
    dash_app.layout = build_full_layout(cfg)

    from app.dashboard.callbacks import register_callbacks
    register_callbacks(dash_app, cfg)

    server.config['DASH_APP'] = dash_app
    return server


def _ensure_default_user(cfg):
    if User.query.filter_by(username='admin').first() is None:
        users = [
            ('admin', 'admin@lawfirm.com', '系统管理员', 'admin', '管理部', 'admin123'),
            ('partner', 'partner@lawfirm.com', '李合伙人', 'partner', '诉讼一部', 'partner123'),
            ('lawyer', 'lawyer@lawfirm.com', '张律师', 'lawyer', '诉讼一部', 'lawyer123'),
            ('auditor', 'auditor@lawfirm.com', '王审计', 'auditor', '风控部', 'auditor123'),
        ]
        for uname, email, fname, role, dept, pwd in users:
            u = User(username=uname, email=email, full_name=fname,
                     role=role, department=dept, is_active=True)
            u.set_password(pwd)
            db.session.add(u)
        db.session.commit()
    _ensure_demo_data()


def _ensure_demo_data():
    if Client.query.count() > 0:
        return
    try:
        now = datetime.utcnow()
        demo_clients = [
            Client(client_code='C20260001', client_type='company', name='北京东方科技有限公司',
                   id_card_or_credit_code='91110108MA01XXXX12', contact_person='王总',
                   contact_phone='13800000001', contact_email='wang@dongfang.com',
                   industry='互联网科技', risk_level='normal'),
            Client(client_code='C20260002', client_type='company', name='上海恒信贸易股份有限公司',
                   id_card_or_credit_code='91310101MA02YYYY34', contact_person='李经理',
                   contact_phone='13800000002', contact_email='li@hengxin.com',
                   industry='进出口贸易', risk_level='medium'),
            Client(client_code='C20260003', client_type='individual', name='陈明',
                   id_card_or_credit_code='310101199001015678', contact_person='陈明',
                   contact_phone='13900000003', contact_email='chen@email.com',
                   industry='个人', risk_level='normal'),
            Client(client_code='C20260004', client_type='company', name='深圳海纳创新科技有限公司',
                   id_card_or_credit_code='91440300MA03ZZZZ56', contact_person='赵总',
                   contact_phone='13800000004', contact_email='zhao@hainc.com',
                   industry='人工智能', risk_level='high'),
            Client(client_code='C20260005', client_type='individual', name='刘洋',
                   id_card_or_credit_code='110101198505051234', contact_person='刘洋',
                   contact_phone='13700000005', contact_email='liu@email.com',
                   industry='个人', risk_level='low'),
            Client(client_code='C20260006', client_type='company', name='广州粤华地产集团',
                   id_card_or_credit_code='91440101MA04WWWW78', contact_person='周总监',
                   contact_phone='13800000006', contact_email='zhou@gzyuehua.com',
                   industry='房地产开发', risk_level='medium'),
        ]
        for c in demo_clients:
            db.session.add(c)
        db.session.flush()

        lawyer_id = User.query.filter_by(username='lawyer').first().id
        partner_id = User.query.filter_by(username='partner').first().id

        demo_cases = [
            Case(case_number='L2026-民-001', case_name='东方科技与某供应商合同纠纷案',
                 case_type='民事诉讼', case_category='合同纠纷',
                 client_id=demo_clients[0].id, opposing_party='杭州XX供应链有限公司',
                 responsible_lawyer_id=lawyer_id,
                 entrusted_at=datetime(2026, 1, 15), accepted_at=datetime(2026, 1, 18),
                 filed_at=datetime(2026, 2, 10), current_stage='举证',
                 stage_updated_at=datetime(2026, 2, 28),
                 court='北京市海淀区人民法院', presiding_judge='张法官',
                 claim_amount=5800000.00, risk_assessment='medium',
                 case_summary='原告东方科技向被告采购设备，对方逾期交货且质量不合格，主张违约金及损失赔偿。',
                 jurisdiction='北京海淀'),
            Case(case_number='L2026-民-002', case_name='恒信贸易信用证欺诈纠纷案',
                 case_type='民事诉讼', case_category='信用证纠纷',
                 client_id=demo_clients[1].id, opposing_party='香港XX国际贸易有限公司',
                 responsible_lawyer_id=partner_id, assistant_lawyer_ids=[lawyer_id],
                 entrusted_at=datetime(2026, 2, 1), accepted_at=datetime(2026, 2, 3),
                 filed_at=datetime(2026, 2, 20), current_stage='开庭',
                 stage_updated_at=datetime(2026, 3, 15),
                 court='上海市浦东新区人民法院', presiding_judge='王法官',
                 claim_amount=12500000.00, risk_assessment='high',
                 case_summary='恒信贸易申请开立信用证，对方伪造单据涉嫌欺诈，申请止付并索赔。',
                 jurisdiction='上海浦东'),
            Case(case_number='L2026-民-003', case_name='陈明离婚财产分割案',
                 case_type='民事诉讼', case_category='婚姻家庭纠纷',
                 client_id=demo_clients[2].id, opposing_party='王XX',
                 responsible_lawyer_id=lawyer_id,
                 entrusted_at=datetime(2026, 3, 1), accepted_at=datetime(2026, 3, 2),
                 filed_at=datetime(2026, 3, 10), current_stage='调解',
                 stage_updated_at=datetime(2026, 4, 20),
                 court='上海市黄浦区人民法院', presiding_judge='李法官',
                 claim_amount=3200000.00, risk_assessment='low',
                 case_summary='原告主张分割夫妻共同财产，含房产两套及股权投资。',
                 jurisdiction='上海黄浦'),
            Case(case_number='L2026-民-004', case_name='海纳创新专利侵权纠纷案',
                 case_type='民事诉讼', case_category='知识产权纠纷',
                 client_id=demo_clients[3].id, opposing_party='北京某AI科技公司',
                 responsible_lawyer_id=partner_id, assistant_lawyer_ids=[lawyer_id],
                 entrusted_at=datetime(2026, 1, 5), accepted_at=datetime(2026, 1, 8),
                 filed_at=datetime(2026, 1, 25), current_stage='上诉',
                 stage_updated_at=datetime(2026, 5, 1),
                 court='最高人民法院知识产权法庭', presiding_judge='刘法官',
                 claim_amount=28000000.00, risk_assessment='high',
                 case_summary='海纳创新核心算法专利被侵权，一审部分胜诉，双方均上诉。',
                 jurisdiction='最高院知产庭'),
            Case(case_number='L2026-民-005', case_name='刘洋房屋买卖合同纠纷案',
                 case_type='民事诉讼', case_category='房屋买卖',
                 client_id=demo_clients[4].id, opposing_party='北京某房地产经纪公司',
                 responsible_lawyer_id=lawyer_id,
                 entrusted_at=datetime(2026, 4, 5), accepted_at=datetime(2026, 4, 6),
                 filed_at=datetime(2026, 4, 18), current_stage='立案',
                 stage_updated_at=datetime(2026, 4, 18),
                 court='北京市朝阳区人民法院', presiding_judge='陈法官',
                 claim_amount=860000.00, risk_assessment='low',
                 case_summary='购买二手房，卖家违约拒绝过户，主张继续履行或赔偿。',
                 jurisdiction='北京朝阳'),
            Case(case_number='L2026-民-006', case_name='粤华地产建设工程施工合同纠纷',
                 case_type='民事诉讼', case_category='建设工程',
                 client_id=demo_clients[5].id, opposing_party='某建筑工程有限公司',
                 responsible_lawyer_id=partner_id, assistant_lawyer_ids=[lawyer_id],
                 entrusted_at=datetime(2026, 2, 10), accepted_at=datetime(2026, 2, 12),
                 filed_at=datetime(2026, 3, 1), current_stage='判决',
                 stage_updated_at=datetime(2026, 6, 1),
                 court='广东省广州市中级人民法院', presiding_judge='赵法官',
                 claim_amount=45000000.00, risk_assessment='medium',
                 case_summary='工程结算争议，鉴定意见作出，一审判决已送达。',
                 jurisdiction='广州中院'),
            Case(case_number='L2026-咨-001', case_name='某客户公司法律顾问咨询',
                 case_type='法律顾问', case_category='日常法律咨询',
                 client_id=demo_clients[0].id, opposing_party='-',
                 responsible_lawyer_id=lawyer_id,
                 entrusted_at=datetime(2026, 6, 1), current_stage='咨询',
                 stage_updated_at=datetime(2026, 6, 1),
                 risk_assessment='low', case_summary='公司法务日常咨询',
                 jurisdiction='-'),
        ]
        for c in demo_cases:
            db.session.add(c)
        db.session.flush()

        demo_hearings = [
            Hearing(case_id=demo_cases[0].id, hearing_round=1, hearing_type='举证质证',
                    scheduled_at=now + timedelta(days=3, hours=9),
                    scheduled_end_at=now + timedelta(days=3, hours=11, minutes=30),
                    court_room='海淀法院第12法庭', presiding_judge='张法官',
                    judge_panel=['张法官', '陪审员A', '陪审员B'], clerk='书记员小王',
                    attending_lawyers=[lawyer_id], location='北京市海淀区人民法院',
                    status='正常', anomalies=[], preparation_status='进行中',
                    checklist={'证据目录': True, '质证意见': False, '出庭函': True}),
            Hearing(case_id=demo_cases[1].id, hearing_round=2, hearing_type='一审开庭',
                    scheduled_at=now + timedelta(days=1, hours=14),
                    scheduled_end_at=now + timedelta(days=1, hours=17),
                    court_room='浦东法院第3法庭', presiding_judge='王法官',
                    judge_panel=['王法官', '李法官', '赵法官'], clerk='书记员小郑',
                    attending_lawyers=[partner_id, lawyer_id], location='上海市浦东新区人民法院',
                    status='正常', anomalies=[], preparation_status='进行中',
                    checklist={'证据原件': True, '代理词': False, '质证意见': True}),
            Hearing(case_id=demo_cases[2].id, hearing_round=1, hearing_type='调解谈话',
                    scheduled_at=now + timedelta(days=5, hours=10),
                    scheduled_end_at=now + timedelta(days=5, hours=11, minutes=30),
                    court_room='黄浦法院调解室2', presiding_judge='李法官',
                    attending_lawyers=[lawyer_id], location='上海市黄浦区人民法院',
                    status='正常', anomalies=[], preparation_status='未开始',
                    checklist={'调解方案': False}),
            Hearing(case_id=demo_cases[3].id, hearing_round=3, hearing_type='二审听证',
                    scheduled_at=now + timedelta(days=10, hours=9, minutes=30),
                    scheduled_end_at=now + timedelta(days=10, hours=12),
                    court_room='最高院知产庭第四法庭', presiding_judge='刘法官',
                    judge_panel=['刘法官', '周法官', '吴法官'], clerk='书记员小何',
                    attending_lawyers=[partner_id], location='最高人民法院知识产权法庭',
                    status='正常', anomalies=[], preparation_status='未开始',
                    checklist={'上诉状': True, '新证据': False, '庭审大纲': False}),
            Hearing(case_id=demo_cases[3].id, hearing_round=1, hearing_type='二审开庭(冲突演示)',
                    scheduled_at=now + timedelta(days=1, hours=9, minutes=30),
                    scheduled_end_at=now + timedelta(days=1, hours=11, minutes=30),
                    court_room='模拟冲突', presiding_judge='-',
                    attending_lawyers=[partner_id], location='北京',
                    status='正常', anomalies=[], preparation_status='未开始',
                    checklist={}),
            Hearing(case_id=demo_cases[5].id, hearing_round=1, hearing_type='宣判',
                    scheduled_at=now + timedelta(days=-1, hours=9),
                    scheduled_end_at=now + timedelta(days=-1, hours=10),
                    court_room='广州中院第8法庭', presiding_judge='赵法官',
                    attending_lawyers=[partner_id], location='广东省广州市中级人民法院',
                    status='已完成', anomalies=[], preparation_status='已完成',
                    checklist={}),
        ]
        for h in demo_hearings:
            db.session.add(h)
        db.session.flush()

        demo_evidences = [
            Evidence(case_id=demo_cases[0].id, evidence_code='EV001',
                     evidence_name='采购合同正本', evidence_type='书证',
                     evidence_category='合同类', status='已提交',
                     submitted_to_court=True, submitted_at=datetime(2026, 2, 20),
                     page_count=12, file_name='采购合同V2签署版.pdf', file_size=2456789,
                     authenticity_score=0.98, relevance_score=0.95,
                     notes='双方盖章扫描件'),
            Evidence(case_id=demo_cases[0].id, evidence_code='EV002',
                     evidence_name='交货验收记录', evidence_type='书证',
                     evidence_category='履行类', status='已质证',
                     submitted_to_court=True, submitted_at=datetime(2026, 2, 20),
                     page_count=8, file_name='检验报告汇总.pdf', file_size=1123456,
                     authenticity_score=0.92, relevance_score=0.9,
                     notes='第三方检验机构出具'),
            Evidence(case_id=demo_cases[0].id, evidence_code='EV003',
                     evidence_name='微信聊天记录', evidence_type='电子数据',
                     evidence_category='沟通类', status='已收集',
                     submitted_to_court=False, page_count=45,
                     file_name='与对方销售沟通记录.pdf', file_size=3856789,
                     authenticity_score=0.75, relevance_score=0.6,
                     notes='待公证，部分可佐证逾期交货'),
            Evidence(case_id=demo_cases[1].id, evidence_code='EV004',
                     evidence_name='信用证开证申请书', evidence_type='书证',
                     evidence_category='金融类', status='已提交',
                     submitted_to_court=True, page_count=4,
                     file_name='L/C Application.pdf', file_size=456789,
                     authenticity_score=0.99, relevance_score=0.98),
            Evidence(case_id=demo_cases[1].id, evidence_code='EV005',
                     evidence_name='对方提交单据全套', evidence_type='书证',
                     evidence_category='金融类', status='存疑',
                     submitted_to_court=True, page_count=28,
                     file_name='Presented Docs Bundle.pdf', file_size=8923456,
                     authenticity_score=0.4, relevance_score=0.85,
                     notes='提单日期涉嫌倒签，已申请鉴定'),
            Evidence(case_id=demo_cases[3].id, evidence_code='EV006',
                     evidence_name='发明专利证书', evidence_type='书证',
                     evidence_category='知识产权类', status='已质证',
                     submitted_to_court=True, page_count=6,
                     file_name='ZL20231XXXXXXX.X.pdf', file_size=987654,
                     authenticity_score=1.0, relevance_score=0.99),
            Evidence(case_id=demo_cases[3].id, evidence_code='EV007',
                     evidence_name='司法鉴定意见书', evidence_type='书证',
                     evidence_category='鉴定类', status='已质证',
                     submitted_to_court=True, page_count=120,
                     file_name='技术比对鉴定.pdf', file_size=15234567,
                     authenticity_score=0.95, relevance_score=0.97,
                     notes='一审中委托，认定落入保护范围'),
            Evidence(case_id=demo_cases[2].id, evidence_code='EV008',
                     evidence_name='房产证两份', evidence_type='书证',
                     evidence_category='物权类', status='已收集',
                     submitted_to_court=False, page_count=4,
                     file_name='房产权证合集.pdf', file_size=765432,
                     authenticity_score=1.0, relevance_score=0.98),
            Evidence(case_id=demo_cases[4].id, evidence_code='EV009',
                     evidence_name='房屋买卖合同', evidence_type='书证',
                     evidence_category='合同类', status='待收集',
                     submitted_to_court=False, file_name='', file_size=0,
                     notes='客户尚未提供，催要中'),
        ]
        for e in demo_evidences:
            db.session.add(e)
        db.session.flush()

        demo_payments = [
            PaymentTransaction(txn_id='PAY20260115001', case_id=demo_cases[0].id,
                               client_id=demo_clients[0].id, contract_amount=290000,
                               payment_stage='首期律师费', scheduled_amount=290000,
                               actual_amount=290000, payment_method='bank_transfer',
                               source='bank', scheduled_date=datetime(2026, 1, 15).date(),
                               actual_date=datetime(2026, 1, 15).date(), status='已结清',
                               reconciliation_status='已核对'),
            PaymentTransaction(txn_id='PAY20260210001', case_id=demo_cases[1].id,
                               client_id=demo_clients[1].id, contract_amount=625000,
                               payment_stage='首期律师费', scheduled_amount=312500,
                               actual_amount=312500, payment_method='bank_transfer',
                               source='bank', scheduled_date=datetime(2026, 2, 3).date(),
                               actual_date=datetime(2026, 2, 10).date(), status='部分收款',
                               reconciliation_status='已核对'),
            PaymentTransaction(txn_id='PAY20260301001', case_id=demo_cases[2].id,
                               client_id=demo_clients[2].id, contract_amount=80000,
                               payment_stage='首期律师费', scheduled_amount=50000,
                               actual_amount=50000, payment_method='alipay',
                               source='alipay', scheduled_date=datetime(2026, 3, 2).date(),
                               actual_date=datetime(2026, 3, 1).date(), status='部分收款',
                               reconciliation_status='已核对'),
            PaymentTransaction(txn_id='PAY20260105001', case_id=demo_cases[3].id,
                               client_id=demo_clients[3].id, contract_amount=1500000,
                               payment_stage='首期律师费', scheduled_amount=750000,
                               actual_amount=750000, payment_method='bank_transfer',
                               source='bank', scheduled_date=datetime(2026, 1, 8).date(),
                               actual_date=datetime(2026, 1, 5).date(), status='部分收款',
                               reconciliation_status='已核对'),
            PaymentTransaction(txn_id='PAY20260501001', case_id=demo_cases[3].id,
                               client_id=demo_clients[3].id, contract_amount=1500000,
                               payment_stage='风险代理费', scheduled_amount=500000,
                               actual_amount=0, payment_method='-', source='-',
                               scheduled_date=datetime(2026, 5, 1).date(),
                               status='逾期', is_overdue=True,
                               reconciliation_status='未核对',
                               notes='一审判决后应支付，已逾30天'),
            PaymentTransaction(txn_id='PAY20260210002', case_id=demo_cases[5].id,
                               client_id=demo_clients[5].id, contract_amount=1800000,
                               payment_stage='首期律师费', scheduled_amount=900000,
                               actual_amount=900000, payment_method='bank_transfer',
                               source='bank', scheduled_date=datetime(2026, 2, 12).date(),
                               actual_date=datetime(2026, 2, 10).date(), status='部分收款',
                               reconciliation_status='已核对'),
            PaymentTransaction(txn_id='PAY20260610001', case_id=demo_cases[5].id,
                               client_id=demo_clients[5].id, contract_amount=1800000,
                               payment_stage='二期律师费', scheduled_amount=600000,
                               actual_amount=0, payment_method='-', source='-',
                               scheduled_date=datetime(2026, 6, 10).date(),
                               status='逾期', is_overdue=True,
                               reconciliation_status='未核对',
                               notes='一审判决后应付，已逾10天'),
        ]
        for p in demo_payments:
            db.session.add(p)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        logging.error(f"Demo data init error: {e}")


def _register_flask_routes(server: Flask, cfg):

    @server.route('/')
    def index():
        return redirect('/dashboard/')

    @server.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            username = request.form.get('username', '')
            password = request.form.get('password', '')
            user = User.query.filter_by(username=username).first()
            if user and user.check_password(password) and user.is_active:
                login_user(user, remember=True)
                user.last_login = datetime.utcnow()
                db.session.commit()
                next_url = request.args.get('next') or '/dashboard/'
                return redirect(next_url)
            return '''
            <html><head><title>登录失败</title></head>
            <body style="font-family:Microsoft YaHei;padding:40px;text-align:center">
            <h2 style="color:#C00000">账号或密码错误</h2>
            <p>请返回重试。测试账号：admin/admin123、lawyer/lawyer123、partner/partner123、auditor/auditor123</p>
            <a href="/login" style="color:#1F4E79">返回登录</a>
            </body></html>
            '''
        return '''
        <!DOCTYPE html>
        <html><head><title>登录 | 法律服务案件风险监测</title>
        <style>
        body{font-family:"Microsoft YaHei",sans-serif;background:linear-gradient(135deg,#1F4E79,#2E75B6);margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center}
        .login-box{background:white;border-radius:16px;padding:48px;box-shadow:0 20px 60px rgba(0,0,0,0.3);width:420px}
        .logo{font-size:24px;font-weight:bold;color:#1F4E79;margin-bottom:8px;text-align:center}
        .subtitle{color:#808080;text-align:center;margin-bottom:32px;font-size:14px}
        .form-group{margin-bottom:20px}
        label{display:block;margin-bottom:6px;color:#333;font-size:13px;font-weight:500}
        input{width:100%;padding:12px 14px;border:1px solid #DDD;border-radius:8px;font-size:14px;box-sizing:border-box;transition:border 0.2s}
        input:focus{outline:none;border-color:#2E75B6;box-shadow:0 0 0 3px rgba(46,117,182,0.1)}
        button{width:100%;padding:13px;background:linear-gradient(135deg,#1F4E79,#2E75B6);color:white;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;transition:all 0.2s}
        button:hover{transform:translateY(-1px);box-shadow:0 8px 16px rgba(31,78,121,0.3)}
        .tip{margin-top:24px;padding:12px;background:#F5F9FC;border-radius:8px;font-size:12px;color:#666;line-height:1.8}
        </style></head><body>
        <div class="login-box">
        <div class="logo"><i class="fas fa-gavel" style="color:#2E75B6"></i> 案件风险监测平台</div>
        <div class="subtitle">Legal Case Risk Monitor Dashboard</div>
        <form method="POST">
        <div class="form-group"><label>用户名</label><input name="username" placeholder="请输入用户名" required autofocus></div>
        <div class="form-group"><label>密码</label><input type="password" name="password" placeholder="请输入密码" required></div>
        <button type="submit"><i class="fas fa-sign-in-alt"></i> 登 录</button>
        </form>
        <div class="tip"><b>测试账号：</b><br>
        admin / admin123（管理员·全量）<br>
        partner / partner123（合伙人·部门）<br>
        lawyer / lawyer123（律师·本人）<br>
        auditor / auditor123（审计·只读）</div>
        </div></body></html>
        '''

    @server.route('/logout')
    @login_required
    def logout():
        logout_user()
        session.pop('share_context', None)
        session.pop('virtual_user', None)
        return redirect('/login')

    @server.route('/share/<token>')
    def share_view(token: str):
        link = ShareLinkService.validate_share_link(token)
        if not link:
            return '''
            <div style="padding:60px;text-align:center;font-family:Microsoft YaHei">
            <h2 style="color:#C00000">链接已失效</h2>
            <p>该分享链接已过期或已被撤销，请联系分享人重新获取。</p>
            </div>
            '''
        ShareLinkService.record_view(link)
        context = ShareLinkService.get_share_link_context(link)
        vu = VirtualUser(link.role_scope, context)
        session['share_context'] = context
        session['virtual_user'] = vu.to_dict()
        return redirect('/dashboard/?share=1')

    @server.route('/download/<path:filename>')
    def download_file(filename: str):
        if not current_user.is_authenticated:
            sv = session.get('share_context')
            if not sv or not sv.get('can_download'):
                abort(403)
        export_dir = cfg.EXPORT_DIR
        filepath = os.path.join(export_dir, filename)
        if not os.path.exists(filepath):
            abort(404)
        return send_from_directory(export_dir, filename, as_attachment=True)

    @server.route('/api/export', methods=['POST'])
    def api_export():
        try:
            user = None
            if current_user.is_authenticated:
                user = current_user._get_current_object()
            elif session.get('virtual_user') and session.get('share_context'):
                user = VirtualUser(session['virtual_user']['role'], session['share_context'])
            if not user:
                return {'success': False, 'error': '未登录'}, 401
            data = request.get_json() or {}
            filters = data.get('filters', {})
            include_finance = data.get('include_finance')
            service = ExportService(cfg)
            filepath = service.export_dashboard_data(
                user, filters=filters, include_finance=include_finance
            )
            filename = os.path.basename(filepath)
            return {
                'success': True,
                'filename': filename,
                'download_url': f'/download/{filename}'
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
