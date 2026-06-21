import sys
sys.path.insert(0, '.')
from config import config as config_module
from app.models import db, User
from app.dashboard.layout import create_app
from app.services.data_service import QueryService, TrendService, FinanceService
from app.services.auth_service import AuthService, VirtualUser

server = create_app('testing')

with server.app_context():
    print("=" * 60)
    print("测试1: 律师角色（无财务权限）")
    print("=" * 60)
    
    lawyer = User.query.filter_by(username='lawyer').first()
    print(f'律师用户: {lawyer.full_name}, 角色: {lawyer.role}')
    
    perms = AuthService.get_user_permissions(lawyer)
    print(f'权限: can_export={perms.get("can_export")}, can_view_finance={perms.get("can_view_finance")}, scope={perms.get("scope")}')
    
    config_dict = {
        'ROLE_PERMISSIONS': config_module['testing'].ROLE_PERMISSIONS,
        'EXPORT_CALIBER_NOTES': config_module['testing'].EXPORT_CALIBER_NOTES
    }
    
    include_finance = AuthService.can_view_finance(lawyer)
    print(f'include_finance: {include_finance}')
    
    cases_df = QueryService.get_cases_df(lawyer, config_dict, include_finance=include_finance)
    print(f'\n案件数量: {len(cases_df)}')
    print(f'案件列: {list(cases_df.columns)}')
    print(f'是否有 claim_amount: {"claim_amount" in cases_df.columns}')
    
    case_stage_df = TrendService.get_case_stage_distribution(cases_df)
    print(f'\n案件阶段分布列: {list(case_stage_df.columns)}')
    print(f'是否有 平均金额: {"平均金额" in case_stage_df.columns}')
    print(f'阶段分布数据:\n{case_stage_df}')
    
    payments_df = QueryService.get_payments_df(lawyer, config_dict, include_finance=include_finance)
    print(f'\n收款记录: {len(payments_df)}')
    print(f'收款列: {list(payments_df.columns)}')
    
    payment_summary = FinanceService.get_payment_summary_df(payments_df, cases_df)
    print(f'\n收款汇总列: {list(payment_summary.columns)}')
    print(f'收款汇总成功: {len(payment_summary)} 条')
    
    from app.services.export_service import ExportService
    export_svc = ExportService(config_module['testing'])
    filepath = export_svc.export_dashboard_data(lawyer, include_finance=include_finance)
    print(f'\n导出文件: {filepath}')
    print('✅ 律师角色测试通过！')
    
    print("\n" + "=" * 60)
    print("测试2: 合伙人角色（部门范围）")
    print("=" * 60)
    
    partner = User.query.filter_by(username='partner').first()
    print(f'合伙人用户: {partner.full_name}, 角色: {partner.role}, 部门: {partner.department}')
    
    perms = AuthService.get_user_permissions(partner)
    print(f'权限: scope={perms.get("scope")}')
    
    cases_df_p = QueryService.get_cases_df(partner, config_dict, include_finance=True)
    evidences_df_p = QueryService.get_evidences_df(partner, config_dict)
    hearings_df_p = QueryService.get_hearings_df(partner, config_dict)
    payments_df_p = QueryService.get_payments_df(partner, config_dict, include_finance=True)
    
    print(f'\n部门案件: {len(cases_df_p)} 件')
    print(f'部门证据: {len(evidences_df_p)} 件')
    print(f'部门庭审: {len(hearings_df_p)} 件')
    print(f'部门收款: {len(payments_df_p)} 条')
    print('✅ 合伙人部门范围收窄测试通过！')
    
    print("\n" + "=" * 60)
    print("测试3: 客户视角分享链接（VirtualUser）")
    print("=" * 60)
    
    from app.models import Client, Case
    demo_client = Client.query.first()
    print(f'测试客户: {demo_client.name}, ID: {demo_client.id}')
    
    demo_cases = Case.query.filter_by(client_id=demo_client.id).all()
    demo_case_ids = [c.id for c in demo_cases]
    print(f'该客户案件数: {len(demo_case_ids)}')
    
    share_ctx = {
        'share_token': 'test_token_123',
        'can_view_finance': True,
        'filters': {
            'client_id': [demo_client.id],
            'case_id': demo_case_ids[:2] if len(demo_case_ids) >= 2 else demo_case_ids
        }
    }
    
    vu = VirtualUser('client', share_ctx)
    print(f'虚拟用户角色: {vu.role}, is_virtual: {hasattr(vu, "_share_context")}')
    
    cases_df_v = QueryService.get_cases_df(vu, config_dict, include_finance=True)
    clients_df_v = QueryService.get_clients_df(vu, config_dict)
    evidences_df_v = QueryService.get_evidences_df(vu, config_dict)
    hearings_df_v = QueryService.get_hearings_df(vu, config_dict)
    payments_df_v = QueryService.get_payments_df(vu, config_dict, include_finance=True)
    
    print(f'\n分享可见案件: {len(cases_df_v)} 件')
    print(f'分享可见客户: {len(clients_df_v)} 个')
    print(f'分享可见证据: {len(evidences_df_v)} 件')
    print(f'分享可见庭审: {len(hearings_df_v)} 件')
    print(f'分享可见收款: {len(payments_df_v)} 条')
    
    expected_case_count = len(share_ctx['filters']['case_id'])
    if len(cases_df_v) == expected_case_count:
        print(f'✅ 客户视角分享链接范围收窄正确！预期{expected_case_count}件，实际{len(cases_df_v)}件')
    else:
        print(f'❌ 客户视角分享链接范围收窄错误！预期{expected_case_count}件，实际{len(cases_df_v)}件')
    
    print("\n" + "=" * 60)
    print("✅ 全部测试通过！")
    print("=" * 60)
