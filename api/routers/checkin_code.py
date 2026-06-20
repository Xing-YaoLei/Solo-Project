from fastapi import APIRouter

from api.schemas.common import ApiResponse

router = APIRouter()


@router.get("/caliber", response_model=ApiResponse[dict])
async def get_checkin_code_caliber():
    caliber_data = {
        "title": "签到码口径说明",
        "rules": [
            {
                "phase": "生成",
                "description": "订单支付成功后，系统自动生成唯一签到码（格式: CI+6位数字），与订单唯一绑定",
                "conditions": [
                    "订单状态必须为 paid 或 used",
                    "每个订单仅生成一个签到码",
                    "签到码在支付成功后立即生效",
                ],
            },
            {
                "phase": "核验",
                "description": "现场扫码核验签到码，核验通过后订单状态变更为 used",
                "conditions": [
                    "签到码必须为该活动有效订单的签到码",
                    "同一签到码只能核验一次（防重复入场）",
                    "核验时需记录扫码人、扫码地点、扫码时间",
                ],
            },
            {
                "phase": "失效",
                "description": "以下情况签到码失效，无法通过核验",
                "conditions": [
                    "订单已退款（status = refunded）",
                    "订单存在争议且争议状态为 processing（暂冻结）",
                    "签到码已被成功核验（防重复使用）",
                    "活动已结束超过可入场时间",
                ],
            },
        ],
        "caliberVersions": [
            {
                "version": "v1.0",
                "name": "基础版本",
                "rule": "仅依据签到记录判定签到码是否有效",
                "effectiveDate": "2024-01-01",
            },
            {
                "version": "v2.0",
                "name": "精确版本",
                "rule": "需同时满足签到记录和闸机通过记录才判定为有效核验（取交集）",
                "effectiveDate": "2024-05-15",
            },
        ],
    }
    return ApiResponse(data=caliber_data)
