from __future__ import annotations

import json
from datetime import datetime, timedelta
from typing import Optional, List

import streamlit as st
import polars as pl

from src.auth.permissions import (
    permission_manager,
    share_link_manager,
    UserRole,
    ROLE_LABELS,
    ROLE_HIERARCHY,
    VIEW_SCOPES,
)
from src.ui.charts import style_dataframe, status_badge, metric_card, safe_drop_columns, safe_select_columns


def render_share_page(event_id: Optional[str] = None) -> None:
    role = permission_manager.get_current_role()
    current_user = permission_manager.get_current_user()

    if role not in [UserRole.ORGANIZER, UserRole.TICKET_STAFF]:
        st.error("🔒 仅主办方和票务人员可管理分享链接")
        return

    st.markdown("## 🔗 分享链接管理")
    st.caption("按角色限制访问范围的分享链接，外部人员无法查看敏感明细数据")

    tab_create, tab_manage, tab_perm = st.tabs(["➕ 生成链接", "📋 管理链接", "🛡️ 权限说明"])

    with tab_create:
        _render_create_link_form(event_id, current_user)

    with tab_manage:
        _render_manage_links(event_id, role)

    with tab_perm:
        _render_permission_docs()


def _render_create_link_form(event_id: Optional[str], current_user: Optional[dict]) -> None:
    st.markdown("### ➕ 生成带权限的分享链接")

    with st.form("create_share_form"):
        c1, c2 = st.columns(2)
        with c1:
            scope = st.selectbox(
                "数据范围（分享页面）",
                options=list(VIEW_SCOPES.keys()),
                format_func=lambda x: VIEW_SCOPES[x],
                help="链接打开后跳转的页面和数据",
            )
            created_by = current_user.get("display_name") if current_user else "system"
            if event_id:
                st.info(f"当前活动限定：`{event_id[-8:]}`")
                use_event = event_id
            else:
                use_event = st.text_input("活动ID（可选，留空=不限定活动）", value="")

        with c2:
            all_roles = [UserRole.ATTENDEE, UserRole.GATE_STAFF, UserRole.TICKET_STAFF, UserRole.ORGANIZER]
            allowed_roles_input = st.multiselect(
                "允许访问的角色",
                options=[r.value for r in all_roles],
                default=[UserRole.TICKET_STAFF.value, UserRole.ORGANIZER.value],
                format_func=lambda x: ROLE_LABELS.get(UserRole(x), x),
                help="勾选的角色类型才能使用该链接，外部人员一律无权限",
            )
            exp_days = st.slider("有效天数", 1, 90, 30, 1)
            max_views = st.number_input("最大查看次数（0=不限制）", min_value=0, value=0, step=10)

        submitted = st.form_submit_button("🔐 生成分享链接", type="primary", use_container_width=True)

        if submitted:
            if not allowed_roles_input:
                st.error("请至少选择一个允许的角色")
                return

            try:
                result = share_link_manager.create_link(
                    event_id=use_event or None,
                    view_scope=scope,
                    allowed_roles=[UserRole(r) for r in allowed_roles_input],
                    expires_days=exp_days,
                    max_views=int(max_views) if max_views > 0 else None,
                    created_by=created_by,
                )
                st.success("✅ 链接创建成功！请保存以下信息：")
                sc1, sc2 = st.columns([3, 1])
                with sc1:
                    st.code(f"https://your-domain.com/{result['share_url']}")
                    st.caption("Token：")
                    st.code(result["token"], language="text")
                with sc2:
                    st.metric("数据范围", result["scope_label"])
                    st.metric("允许角色", f"{len(result['allowed_roles'])}种")
                    st.metric("有效期", f"{exp_days}天")
            except Exception as e:
                st.error(f"创建失败：{e}")


def _render_manage_links(event_id: Optional[str], role: UserRole) -> None:
    st.markdown("### 📋 所有分享链接")

    links_df = share_link_manager.list_links(event_id)

    if links_df.height == 0:
        st.info("暂无分享链接")
        return

    total = links_df.height
    active = links_df.filter(
        (pl.col("expires_at").is_null() | (pl.col("expires_at") > datetime.now()))
    ).height
    total_views = int(links_df["current_views"].sum() or 0)

    mc1, mc2, mc3 = st.columns(3)
    mc1.metric("链接总数", total)
    mc2.metric("有效链接", active)
    mc3.metric("累计查看", total_views)

    st.divider()

    display_links = links_df.with_columns(
        pl.col("expires_at").map_elements(
            lambda x: status_badge("有效", "success")
            if (x is None or (hasattr(x, '__gt__') and x > datetime.now()))
            else status_badge("已过期", "error"),
            return_dtype=str,
        ).alias("状态"),
        pl.col("view_scope").replace(VIEW_SCOPES).alias("数据范围"),
        pl.col("allowed_roles").map_elements(
            lambda x: _format_roles(x),
            return_dtype=str,
        ).alias("允许角色"),
        pl.concat_str([
            pl.col("current_views").cast(str),
            pl.lit(" / "),
            pl.col("max_views").fill_null("∞").cast(str),
        ]).alias("查看次数"),
    )

    show_cols = [c for c in [
        "状态", "scope_label", "数据范围", "允许角色",
        "查看次数", "expires_at", "created_by", "created_at",
        "share_url", "link_id",
    ] if c in display_links.columns]

    rename = {
        "expires_at": "过期时间",
        "created_by": "创建人",
        "created_at": "创建时间",
    }
    display = safe_drop_columns(
        display_links.select(show_cols).rename(rename),
        ["link_id"],
    )
    style_dataframe(display, height=400)

    st.markdown("---")
    if links_df.height > 0:
        st.markdown("### 🛠️ 链接操作")
        link_options = [
            (row.get("link_id"), f"{row.get('scope_label') or row.get('view_scope')} | {row.get('created_by')} | {str(row.get('created_at'))[:16]}")
            for row in links_df.iter_rows(named=True)
        ]
        valid_opts = [(lid, lbl) for lid, lbl in link_options if lid]
        if valid_opts:
            idx = st.selectbox(
                "选择链接进行操作",
                range(len(valid_opts)),
                format_func=lambda i: valid_opts[i][1],
                key="share_link_op",
            )
            sel_lid = valid_opts[idx][0]
            link_detail = links_df.filter(pl.col("link_id") == sel_lid)
            if link_detail.height > 0:
                ld = link_detail.row(0, named=True)
                with st.container(border=True):
                    oc1, oc2 = st.columns(2)
                    with oc1:
                        st.markdown(f"**链接Token**：")
                        st.code(ld["link_token"], language="text")
                        st.markdown(f"**访问URL**：")
                        st.code(f"https://app.example.com/?share={ld['link_token']}")
                    with oc2:
                        st.metric("范围", VIEW_SCOPES.get(ld.get("view_scope"), ld.get("view_scope")))
                        st.metric("查看次数", f"{ld.get('current_views', 0)} / {ld.get('max_views') or '∞'}")

                if st.button("⛔ 立即撤销/过期此链接", type="secondary", key="revoke_link_btn"):
                    if share_link_manager.revoke_link(sel_lid):
                        st.success("✅ 链接已撤销")
                        st.rerun()
                    else:
                        st.error("撤销失败")


def _format_roles(roles_json) -> str:
    try:
        roles = json.loads(roles_json) if isinstance(roles_json, str) else roles_json or []
        labels = [ROLE_LABELS.get(UserRole(r), r) for r in roles]
        return " / ".join(labels) if labels else "-"
    except Exception:
        return str(roles_json)


def _render_permission_docs() -> None:
    st.markdown("### 🛡️ 权限与访问控制说明")

    st.markdown("#### 🎭 角色体系（从高到低）")
    roles_ordered = sorted(ROLE_HIERARCHY.items(), key=lambda x: -x[1])
    for r, level in roles_ordered:
        label = ROLE_LABELS.get(r, r.value)
        bars = "█" * level + "░" * (4 - level)
        st.markdown(f"- **{label}**（`{r.value}`） L{level} `{bars}`")

    st.divider()

    st.markdown("#### 👁️ 各角色可访问模块")
    access_matrix = [
        ("总览看板", True, True, True, True),
        ("赞助清单", True, True, False, False),
        ("票种规则", True, True, True, True),
        ("核销记录", True, True, True, False),
        ("闸机原始记录", True, True, False, False),
        ("退票争议", True, True, False, False),
        ("分享链接管理", True, True, False, False),
        ("查看敏感字段（手机/邮箱/票码/流水）", True, True, False, False),
    ]
    header = ["模块", "主办方", "票务人员", "检票员", "观众/外部"]
    df = pl.DataFrame(access_matrix, schema=header)
    st.dataframe(
        df.to_pandas().replace({True: "✅", False: "🔒"}),
        use_container_width=True,
        hide_index=True,
    )

    st.divider()

    st.markdown("#### 🔗 分享链接工作原理")
    with st.container(border=True):
        st.markdown(
            """
1. **创建时**：选择【数据范围】+【允许角色】+【有效期】
2. **生成时**：系统生成唯一随机Token（SHA256哈希存储，仅创建时可见一次）
3. **访问时**：
   - 系统验证Token有效性（存在/未过期/次数未满）
   - 校验当前用户角色是否在【允许角色】中
   - 自动跳转到对应【数据范围】页面
   - 查看计数器 +1
4. **数据脱敏**：无论是否通过链接访问，**敏感字段均按当前登录角色严格脱敏**，
   即便是链接分享给外部人员，也无法看到手机号、邮箱、完整票码、交易流水等
5. **安全兜底**：
   - 链接可随时手动撤销
   - 支持设置最大查看次数（防止扩散）
   - 默认有效期不超过90天
            """
        )

    st.divider()
    st.markdown("#### 🧪 测试用户账号（Demo）")
    demo_users = [
        ("admin001", "主办方（全部权限）", UserRole.ORGANIZER),
        ("ticket_mgr", "票务人员（含敏感数据）", UserRole.TICKET_STAFF),
        ("gate_lead", "检票员（仅看核销）", UserRole.GATE_STAFF),
        ("viewer001", "观众用户（仅总览）", UserRole.ATTENDEE),
    ]
    demo_df = pl.DataFrame(demo_users, schema=["用户名", "说明", "角色"])
    demo_df = demo_df.with_columns(
        pl.col("角色").map_elements(lambda r: status_badge(ROLE_LABELS.get(r, r.value), "info"), return_dtype=str).alias("角色标识")
    )
    st.dataframe(safe_drop_columns(demo_df, ["角色"]).to_pandas(), use_container_width=True, hide_index=True)
