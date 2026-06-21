import pandas as pd
from datetime import date, datetime, time
from sqlalchemy import text
from ticket_dashboard.db.session import SessionLocal
from ticket_dashboard.db.models import SlotConflict
from ticket_dashboard.data.loader import load_reservation_data, load_capacity_data


def detect_capacity_conflicts(scenic_area_id=None, target_date=None):
    if target_date is None:
        target_date = date.today()

    reservation_df = load_reservation_data(
        scenic_area_id=scenic_area_id, start_date=target_date, end_date=target_date
    )
    capacity_df = load_capacity_data(
        scenic_area_id=scenic_area_id, start_date=target_date, end_date=target_date
    )

    if reservation_df.empty or capacity_df.empty:
        return []

    conflicts = []
    with SessionLocal() as session:
        for _, cap_row in capacity_df.iterrows():
            area_id = cap_row["scenic_area_id"]
            slot_start = cap_row["time_slot_start"]
            slot_end = cap_row["time_slot_end"]
            max_cap = cap_row["max_capacity"]
            overflow = cap_row["overflow_capacity"]
            rule_name = cap_row.get("capacity_rule_name", "")

            mask = (
                (reservation_df["scenic_area_id"] == area_id)
                & (reservation_df["time_slot_start"] == slot_start)
                & (reservation_df["time_slot_end"] == slot_end)
            )
            slot_reservations = reservation_df[mask]
            total_reserved = slot_reservations["reserved_count"].sum()

            if total_reserved > max_cap + overflow:
                affected_ids = slot_reservations["id"].tolist()
                conflict = SlotConflict(
                    scenic_area_id=area_id,
                    conflict_date=target_date,
                    conflict_time_start=slot_start,
                    conflict_time_end=slot_end,
                    conflict_type="capacity_overflow",
                    affected_reservation_ids=affected_ids,
                    description=(
                        f"时段 {slot_start}-{slot_end} 预约 {total_reserved} 人，"
                        f"超过容量上限 {max_cap + overflow}（规则: {rule_name}）"
                    ),
                    severity="critical" if total_reserved > max_cap + overflow + max_cap * 0.2 else "warning",
                )
                session.add(conflict)
                conflicts.append({
                    "scenic_area_id": area_id,
                    "time_slot": f"{slot_start}-{slot_end}",
                    "total_reserved": total_reserved,
                    "max_capacity": max_cap + overflow,
                    "conflict_type": "capacity_overflow",
                    "rule_name": rule_name,
                    "affected_ids": affected_ids,
                })

            elif total_reserved > max_cap:
                affected_ids = slot_reservations["id"].tolist()
                conflict = SlotConflict(
                    scenic_area_id=area_id,
                    conflict_date=target_date,
                    conflict_time_start=slot_start,
                    conflict_time_end=slot_end,
                    conflict_type="capacity_warning",
                    affected_reservation_ids=affected_ids,
                    description=(
                        f"时段 {slot_start}-{slot_end} 预约 {total_reserved} 人，"
                        f"超过标准容量 {max_cap}，进入溢出区间（规则: {rule_name}）"
                    ),
                    severity="warning",
                )
                session.add(conflict)
                conflicts.append({
                    "scenic_area_id": area_id,
                    "time_slot": f"{slot_start}-{slot_end}",
                    "total_reserved": total_reserved,
                    "max_capacity": max_cap,
                    "conflict_type": "capacity_warning",
                    "rule_name": rule_name,
                    "affected_ids": affected_ids,
                })

        session.commit()

    return conflicts


def detect_timeslot_overlaps(scenic_area_id=None, target_date=None):
    if target_date is None:
        target_date = date.today()

    reservation_df = load_reservation_data(
        scenic_area_id=scenic_area_id, start_date=target_date, end_date=target_date
    )

    if reservation_df.empty:
        return []

    conflicts = []
    with SessionLocal() as session:
        for area_id, group in reservation_df.groupby("scenic_area_id"):
            for ticket_type, type_group in group.groupby("ticket_type"):
                slots = type_group.sort_values("time_slot_start")
                for i in range(len(slots) - 1):
                    cur = slots.iloc[i]
                    nxt = slots.iloc[i + 1]
                    if cur["time_slot_end"] > nxt["time_slot_start"]:
                        conflict = SlotConflict(
                            scenic_area_id=area_id,
                            conflict_date=target_date,
                            conflict_time_start=cur["time_slot_start"],
                            conflict_time_end=nxt["time_slot_end"],
                            conflict_type="timeslot_overlap",
                            affected_reservation_ids=[int(cur["id"]), int(nxt["id"])],
                            description=(
                                f"票种 {ticket_type} 时段重叠: "
                                f"{cur['time_slot_start']}-{cur['time_slot_end']} 与 "
                                f"{nxt['time_slot_start']}-{nxt['time_slot_end']}"
                            ),
                            severity="warning",
                        )
                        session.add(conflict)
                        conflicts.append({
                            "scenic_area_id": area_id,
                            "ticket_type": ticket_type,
                            "conflict_type": "timeslot_overlap",
                            "slot_a": f"{cur['time_slot_start']}-{cur['time_slot_end']}",
                            "slot_b": f"{nxt['time_slot_start']}-{nxt['time_slot_end']}",
                        })

        session.commit()

    return conflicts


def get_conflict_affected_time_range(conflicts):
    if not conflicts:
        return None

    earliest_start = None
    latest_end = None

    for c in conflicts:
        slot_str = c.get("time_slot") or c.get("slot_a", "")
        if "-" in slot_str:
            parts = slot_str.split("-")
            start_part = parts[0].strip()
            end_part = parts[-1].strip()
            if earliest_start is None or start_part < earliest_start:
                earliest_start = start_part
            if latest_end is None or end_part > latest_end:
                latest_end = end_part

    if earliest_start and latest_end:
        return f"{earliest_start} ~ {latest_end}"
    return None
