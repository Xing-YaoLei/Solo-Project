from datetime import date, datetime
from typing import Literal

from dateutil.relativedelta import relativedelta

from app.models.payment_schedule import PaymentCycleType


def calculate_due_date(
    start_date: date,
    phase: int,
    cycle_type: PaymentCycleType | Literal["monthly", "quarterly", "half_yearly", "yearly", "milestone"],
    milestone_days: int | None = None,
) -> date:
    if cycle_type == PaymentCycleType.MONTHLY:
        return start_date + relativedelta(months=phase)
    elif cycle_type == PaymentCycleType.QUARTERLY:
        return start_date + relativedelta(months=phase * 3)
    elif cycle_type == PaymentCycleType.HALF_YEARLY:
        return start_date + relativedelta(months=phase * 6)
    elif cycle_type == PaymentCycleType.YEARLY:
        return start_date + relativedelta(years=phase)
    elif cycle_type == PaymentCycleType.MILESTONE:
        if milestone_days is None:
            raise ValueError("milestone_days is required for milestone cycle type")
        return start_date + relativedelta(days=milestone_days)
    else:
        raise ValueError(f"Unknown payment cycle type: {cycle_type}")


def generate_payment_schedule(
    total_amount: float,
    start_date: date,
    num_phases: int,
    cycle_type: PaymentCycleType,
    phase_names: list[str] | None = None,
    milestone_dates: list[date] | None = None,
) -> list[tuple[int, str, float, date]]:
    if num_phases <= 0:
        raise ValueError("num_phases must be greater than 0")

    base_amount = total_amount / num_phases
    schedule: list[tuple[int, str, float, date]] = []

    for i in range(1, num_phases + 1):
        phase_name = phase_names[i - 1] if phase_names else f"第{i}期"

        if cycle_type == PaymentCycleType.MILESTONE and milestone_dates:
            if i - 1 < len(milestone_dates):
                due_date = milestone_dates[i - 1]
            else:
                due_date = milestone_dates[-1]
        else:
            due_date = calculate_due_date(start_date, i, cycle_type)

        schedule.append((i, phase_name, base_amount, due_date))

    return schedule


def get_payment_status(
    due_date: date,
    actual_payment_date: date | None,
    current_date: date | None = None,
) -> str:
    current_date = current_date or date.today()

    if actual_payment_date:
        return "paid"
    elif due_date < current_date:
        return "overdue"
    else:
        return "pending"


def days_overdue(due_date: date, current_date: date | None = None) -> int:
    current_date = current_date or date.today()
    delta = current_date - due_date
    return max(0, delta.days)


def get_payment_cycle_description() -> str:
    return """
回款周期口径说明：

1. 月度回款（Monthly）：
   - 按自然月统计回款金额
   - 统计周期：每月1日至当月最后一天
   - 适用场景：常规月度对账

2. 季度回款（Quarterly）：
   - 按自然季度统计回款金额
   - 统计周期：每季度首月1日至季度末最后一天
   - 适用场景：季度业绩考核

3. 半年度回款（Half-yearly）：
   - 按半年统计回款金额
   - 统计周期：1月1日-6月30日，7月1日-12月31日
   - 适用场景：半年度总结报告

4. 年度回款（Yearly）：
   - 按自然年统计回款金额
   - 统计周期：每年1月1日至12月31日
   - 适用场景：年度财务审计

5. 里程碑回款（Milestone）：
   - 按项目里程碑节点统计
   - 统计周期：根据合同约定的里程碑日期
   - 适用场景：大型项目阶段性回款

注意事项：
- 实际回款日期以款项到账日期为准
- 逾期款项按实际回款日期计入对应周期
- 预收款按合同约定的服务期间分摊
"""


def get_role_label(role: str) -> str:
    role_labels: dict[str, str] = {
        "partner": "合伙人",
        "lawyer": "律师",
        "assistant": "助理",
        "client": "客户",
    }
    return role_labels.get(role, role)
