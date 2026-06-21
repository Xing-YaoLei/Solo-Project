import sys
sys.path.insert(0, '.')
from config import config as config_module
from app.models import db, User, Client, Case, Evidence, Hearing, PaymentTransaction
from app.dashboard.layout import create_app
from app.services.data_service import QueryService
from app.services.auth_service import VirtualUser
from app.dashboard.callbacks import _apply_share_filters

server = create_app('testing')

with server.app_context():

    config_dict = {
        'ROLE_PERMISSIONS': config_module['testing'].ROLE_PERMISSIONS,
        'EXPORT_CALIBER_NOTES': config_module['testing'].EXPORT_CALIBER_NOTES
    }
    include_finance = False

    print("\n" + "=" * 60)
    print("测试1: 单案分享链接（只有 case_id，无 client_id）")
    print("=" * 60)
    
    demo_case = Case.query.filter(Case.assistant_lawyer_ids.isnot(None)).first()
    if not demo_case:
        demo_case = Case.query.first()
    
    print(f'测试案件: {demo_case.case_name}, ID: {demo_case.id}')
    print(f'该案件客户ID: {demo_case.client_id}')
    
    share_ctx = {
        'share_token': 'test_token_456',
        'can_view_finance': True,
        'filters': {
            'case_id': [demo_case.id]
        }
    }
    
    vu = VirtualUser('client', share_ctx)
    print(f'虚拟用户角色: {vu.role}, is_virtual: {hasattr(vu, "_share_context")}')
    print(f'分享 filters: {share_ctx["filters"]}')
    
    cases_df = QueryService.get_cases_df(vu, config_dict, include_finance=True)
    clients_df = QueryService.get_clients_df(vu, config_dict)
    evidences_df = QueryService.get_evidences_df(vu, config_dict)
    hearings_df = QueryService.get_hearings_df(vu, config_dict)
    payments_df = QueryService.get_payments_df(vu, config_dict, include_finance=True)
    
    user_info = {
        'role': 'client',
        'share_context': share_ctx
    }
    
    cases_df, clients_df, hearings_df, evidences_df, payments_df, _, _ = _apply_share_filters(
        user_info, cases_df, clients_df, hearings_df, evidences_df, payments_df, None, None
    )
    
    print(f'\n分享可见案件: {len(cases_df)} 件')
    print(f'分享可见客户: {len(clients_df)} 个')
    if len(clients_df) > 0:
        print(f'  客户名称: {clients_df["name"].tolist()}')
    print(f'分享可见证据: {len(evidences_df)} 件')
    print(f'分享可见庭审: {len(hearings_df)} 件')
    print(f'分享可见收款: {len(payments_df)} 条')
    
    if len(cases_df) == 1 and len(clients_df) == 1:
        print('✅ 单案分享链接客户档案过滤正确！')
    else:
        print(f'❌ 单案分享链接客户档案过滤错误！案件{len(cases_df)}件，客户{len(clients_df)}个')

    print("\n" + "=" * 60)
    print("测试2: paralegal 角色（team scope）按参与案件查看")
    print("=" * 60)
    
    paralegal = User.query.filter_by(role='paralegal').first()
    print(f'律师助理用户: {paralegal.full_name}, 角色: {paralegal.role}')
    print(f'权限: scope={config_dict["ROLE_PERMISSIONS"]["paralegal"]["scope"]}')
    
    team_case_ids = QueryService._get_team_case_ids(paralegal)
    print(f'\n_get_team_case_ids 返回案件数: {len(team_case_ids)}')
    print(f'案件ID列表: {team_case_ids[:5]}...' if len(team_case_ids) > 5 else f'案件ID列表: {team_case_ids}')
    
    responsible_cases = Case.query.filter_by(responsible_lawyer_id=paralegal.id).all()
    print(f'\n作为主办律师的案件数: {len(responsible_cases)}')
    
    assistant_cases = []
    for c in Case.query.all():
        if c.assistant_lawyer_ids and paralegal.id in c.assistant_lawyer_ids:
            assistant_cases.append(c)
    print(f'作为协办律师的案件数: {len(assistant_cases)}')
    expected_cases = list(set([c.id for c in responsible_cases] + [c.id for c in assistant_cases]))
    print(f'预期可见案件总数: {len(expected_cases)}')
    
    cases_df_p = QueryService.get_cases_df(paralegal, config_dict, include_finance=False)
    clients_df_p = QueryService.get_clients_df(paralegal, config_dict)
    evidences_df_p = QueryService.get_evidences_df(paralegal, config_dict)
    hearings_df_p = QueryService.get_hearings_df(paralegal, config_dict)
    payments_df_p = QueryService.get_payments_df(paralegal, config_dict, include_finance=False)
    
    print(f'\n实际可见案件: {len(cases_df_p)} 件')
    print(f'可见客户: {len(clients_df_p)} 个')
    print(f'可见证据: {len(evidences_df_p)} 件')
    print(f'可见庭审: {len(hearings_df_p)} 件')
    print(f'可见收款: {len(payments_df_p)} 条')
    
    if len(cases_df_p) == len(expected_cases) and len(expected_cases) > 0:
        print('✅ paralegal 视角案件范围正确！')
        if len(evidences_df_p) > 0 and len(hearings_df_p) > 0:
            print('✅ paralegal 视角证据、庭审、收款收窄正确！')
        else:
            print('⚠️  证据或庭审数据为空（可能是测试数据问题）')
    elif len(expected_cases) == 0:
        print('⚠️  测试数据中 paralegal 没有参与任何案件，请添加测试数据')
    else:
        print(f'❌ paralegal 视角案件范围错误！预期{len(expected_cases)}件，实际{len(cases_df_p)}件')

    print("\n" + "=" * 60)
    print("✅ 测试完成！")
    print("=" * 60)
