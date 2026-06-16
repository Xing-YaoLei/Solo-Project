"""
药店连锁处方审核趋势看板应用包。

注：项目根目录还有一个 app.py（启动入口）。为避免命名冲突、方便从 app
包导入 create_app，这里从根 app.py 重导出 create_app 函数。
"""
from app.models import (
    Base, engine, get_session,
    User, Pharmacy, Member, Prescription, PrescriptionItem,
    PrescriptionPhoto, PharmacistReview, PrescriptionNote, FollowUp,
    InsuranceSettlement, ImportBatch,
    ImportSource, BatchStatus, UserRole, PrescriptionStatus,
    PharmacistOpinion, FollowUpStatus,
    init_default_users, verify_user_credentials,
)

from app.data import (
    generate_batch_no, create_batch, update_batch_stats,
    import_pos_data, import_member_data, link_members_to_prescriptions,
    import_insurance_data, sync_insurance_api,
)

from app.dashboards import (
    get_prescription_summary, get_prescription_trend,
    get_photo_distribution, get_photo_quality_detail,
    get_pharmacist_funnel, get_expiry_ranking,
    get_member_changes, get_follow_up_tasks,
    get_pharmacy_stats, get_prescription_notes, get_batch_history,
    submit_pharmacist_review, resolve_note, get_pending_review_list,
    create_trend_chart, create_amount_trend, create_photo_distribution_chart,
    create_photo_quality_pie, create_pharmacist_funnel,
    create_expiry_ranking_chart, create_member_change_chart,
    create_pharmacy_comparison, create_status_pie, create_kpi_card,
    build_management_layout, register_management_callbacks,
    build_executor_layout, register_executor_callbacks,
)

__all__ = [
    # 数据库模型 & Enum
    "Base", "engine", "get_session",
    "User", "Pharmacy", "Member", "Prescription", "PrescriptionItem",
    "PrescriptionPhoto", "PharmacistReview", "PrescriptionNote", "FollowUp",
    "InsuranceSettlement", "ImportBatch",
    "ImportSource", "BatchStatus", "UserRole", "PrescriptionStatus",
    "PharmacistOpinion", "FollowUpStatus",
    "init_default_users", "verify_user_credentials",
    # 数据导入
    "generate_batch_no", "create_batch", "update_batch_stats",
    "import_pos_data", "import_member_data", "link_members_to_prescriptions",
    "import_insurance_data", "sync_insurance_api",
    # 看板
    "get_prescription_summary", "get_prescription_trend",
    "get_photo_distribution", "get_photo_quality_detail",
    "get_pharmacist_funnel", "get_expiry_ranking",
    "get_member_changes", "get_follow_up_tasks",
    "get_pharmacy_stats", "get_prescription_notes", "get_batch_history",
    "submit_pharmacist_review", "resolve_note", "get_pending_review_list",
    "create_trend_chart", "create_amount_trend", "create_photo_distribution_chart",
    "create_photo_quality_pie", "create_pharmacist_funnel",
    "create_expiry_ranking_chart", "create_member_change_chart",
    "create_pharmacy_comparison", "create_status_pie", "create_kpi_card",
    "build_management_layout", "register_management_callbacks",
    "build_executor_layout", "register_executor_callbacks",
]
