import streamlit as st
import polars as pl
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import pandas as pd

from config import settings
from database import db
from analytics import analytics
from version_control import version_ctrl
from test_data_generator import data_gen
from minio_storage import minio_mgr

st.set_page_config(
    page_title="旅游民宿套餐售卖漏斗报表",
    page_icon="🏨",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .main-header {font-size: 2rem; font-weight: bold; color: #1e3a5f; margin-bottom: 1rem;}
    .section-header {font-size: 1.3rem; font-weight: bold; color: #2c5282; margin-top: 1rem; margin-bottom: 0.5rem; 
                     border-left: 4px solid #3182ce; padding-left: 0.8rem;}
    .metric-card {background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; 
                  padding: 1rem; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);}
    .warning-card {background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; 
                   padding: 1rem; border-radius: 10px;}
    .success-card {background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; 
                   padding: 1rem; border-radius: 10px;}
    .oversold-tag {background: #fee2e2; color: #991b1b; padding: 0.25rem 0.75rem; 
                   border-radius: 20px; font-weight: bold; font-size: 0.85rem;}
    .gap-tag {background: #fef3c7; color: #92400e; padding: 0.25rem 0.75rem; 
              border-radius: 20px; font-weight: bold; font-size: 0.85rem;}
    .normal-tag {background: #d1fae5; color: #065f46; padding: 0.25rem 0.75rem; 
                 border-radius: 20px; font-weight: bold; font-size: 0.85rem;}
    .inconsistent-tag {background: #ffedd5; color: #9a3412; padding: 0.25rem 0.75rem; 
                       border-radius: 20px; font-weight: bold; font-size: 0.85rem;}
    .consistent-tag {background: #dcfce7; color: #166534; padding: 0.25rem 0.75rem; 
                     border-radius: 20px; font-weight: bold; font-size: 0.85rem;}
    .pending-tag {background: #dbeafe; color: #1e40af; padding: 0.25rem 0.75rem; 
                  border-radius: 20px; font-weight: bold; font-size: 0.85rem;}
    .resolved-tag {background: #e9d5ff; color: #6b21a8; padding: 0.25rem 0.75rem; 
                   border-radius: 20px; font-weight: bold; font-size: 0.85rem;}
</style>
""", unsafe_allow_html=True)

with st.sidebar:
    st.markdown('<p class="main-header">🏨 民宿报表系统</p>', unsafe_allow_html=True)
    st.markdown("---")
    
    if st.button("🔄 生成/重置测试数据", type="primary", use_container_width=True):
        with st.spinner("正在生成测试数据..."):
            data_gen.generate_all()
        st.success("测试数据生成完成！")
    
    st.markdown("---")
    page = st.radio(
        "选择报表模块",
        [
            "📊 销售漏斗总览",
            "📈 转化率分析与复盘",
            "⚠️ 超卖检测与缺口",
            "💬 客服口径一致性",
            "✅ 核销记录总览",
            "💰 押金与库存联动",
            "📡 渠道异常分析",
            "📝 备注任务管理",
            "📚 数据版本追溯"
        ],
        index=0
    )
    
    st.markdown("---")
    date_range = st.date_input(
        "数据日期范围",
        value=(datetime.now() - timedelta(days=30), datetime.now()),
        max_value=datetime.now()
    )
    
    package_options = db.get_conn().execute("SELECT package_id, package_name FROM packages").fetchall()
    package_dict = {f"{pid} - {pname}": pid for pid, pname in package_options}
    package_dict["全部套餐"] = None
    
    selected_package_display = st.selectbox("选择套餐", list(package_dict.keys()), index=0)
    selected_package = package_dict[selected_package_display]
    
    st.markdown("---")
    st.markdown(f"**阈值设置**: 转化率阈值 = **{settings.CONVERSION_RATE_THRESHOLD:.1%}**")

st.markdown(f'<p class="main-header">{page}</p>', unsafe_allow_html=True)

date_start = datetime.combine(date_range[0], datetime.min.time()) if isinstance(date_range, tuple) and len(date_range) > 0 else None
date_end = datetime.combine(date_range[1], datetime.max.time()) if isinstance(date_range, tuple) and len(date_range) > 1 else None
date_tuple = (date_start, date_end) if date_start and date_end else None

if page == "📊 销售漏斗总览":
    st.markdown('<p class="section-header">漏斗转化全览</p>', unsafe_allow_html=True)
    
    try:
        conversion_df = analytics.get_conversion_rates(selected_package, date_tuple)
    except Exception as e:
        st.error(f"数据查询出错: {e}")
        st.info("请先生成测试数据（点击侧边栏按钮）")
        st.stop()
    
    if conversion_df.height == 0:
        st.warning("暂无数据，请先生成测试数据")
        st.stop()
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        total_browse = conversion_df['浏览人数'].sum()
        st.markdown(f'<div class="metric-card"><div style="font-size:0.85rem;opacity:0.9;">总浏览人数</div><div style="font-size:1.8rem;font-weight:bold;">{total_browse:,}</div></div>', unsafe_allow_html=True)
    with col2:
        total_pay = conversion_df['支付人数'].sum()
        st.markdown(f'<div class="metric-card"><div style="font-size:0.85rem;opacity:0.9;">总支付人数</div><div style="font-size:1.8rem;font-weight:bold;">{total_pay:,}</div></div>', unsafe_allow_html=True)
    with col3:
        total_verify = conversion_df['核销人数'].sum()
        st.markdown(f'<div class="success-card"><div style="font-size:0.85rem;opacity:0.9;">总核销人数</div><div style="font-size:1.8rem;font-weight:bold;">{total_verify:,}</div></div>', unsafe_allow_html=True)
    with col4:
        avg_conv = float(conversion_df['整体转化率'].mean()) if conversion_df.height > 0 else 0
        st.markdown(f'<div class="warning-card"><div style="font-size:0.85rem;opacity:0.9;">平均整体转化率</div><div style="font-size:1.8rem;font-weight:bold;">{avg_conv:.2%}</div></div>', unsafe_allow_html=True)

    st.markdown('<p class="section-header">各阶段漏斗图</p>', unsafe_allow_html=True)
    
    stages = settings.FUNNEL_STAGES
    stage_counts = []
    
    for idx, stage in enumerate(stages):
        col_map = {0: '浏览人数', 1: '加购人数', 2: '下单人数', 3: '支付人数', 4: '预约人数', 5: '核销人数'}
        count = int(conversion_df[col_map[idx]].sum())
        stage_counts.append(count)
    
    fig_funnel = go.Figure(go.Funnel(
        y=stages,
        x=stage_counts,
        textposition="inside",
        textinfo="value+percent initial",
        marker=dict(
            color=["#4facfe", "#43e97b", "#fa709a", "#fee140", "#a8edea", "#f6d365"],
            line=dict(width=2, color="white")
        ),
        connector=dict(line=dict(color="#cbd5e0", width=3))
    ))
    
    fig_funnel.update_layout(
        title="套餐售卖漏斗转化图",
        height=500,
        margin=dict(l=150)
    )
    st.plotly_chart(fig_funnel, use_container_width=True)

    st.markdown('<p class="section-header">各套餐转化率对比</p>', unsafe_allow_html=True)
    
    fig_compare = go.Figure()
    
    fig_compare.add_trace(go.Bar(
        x=conversion_df['package_name'],
        y=conversion_df['整体转化率'] * 100,
        name='整体转化率(%)',
        marker_color='#667eea',
        text=[f'{v:.2f}%' for v in conversion_df['整体转化率'] * 100],
        textposition='auto'
    ))
    
    fig_compare.add_trace(go.Scatter(
        x=conversion_df['package_name'],
        y=conversion_df['端到端转化率'] * 100,
        name='端到端转化率(%)',
        mode='lines+markers+text',
        marker_color='#f5576c',
        line=dict(width=3),
        text=[f'{v:.2f}%' for v in conversion_df['端到端转化率'] * 100],
        textposition='top center'
    ))
    
    fig_compare.add_hline(
        y=settings.CONVERSION_RATE_THRESHOLD * 100,
        line_dash="dash",
        line_color="#e53e3e",
        annotation_text=f"阈值 {settings.CONVERSION_RATE_THRESHOLD:.0%}",
        annotation_position="bottom right"
    )
    
    fig_compare.update_layout(
        title="各套餐转化率对比分析",
        xaxis_title="套餐名称",
        yaxis_title="转化率 (%)",
        height=450,
        hovermode="x unified",
        barmode='group'
    )
    st.plotly_chart(fig_compare, use_container_width=True)

    try:
        remark_tasks_df = analytics.get_pending_remark_tasks()
        resolved_remarks = remark_tasks_df.filter(
            (pl.col('status') == '已处理') & (pl.col('task_type') == '转化率超阈值') & (pl.col('conclusion').is_not_null())
        )
        if resolved_remarks.height > 0:
            pkg_ids_in_view = set(conversion_df['package_id'].to_list()) if conversion_df.height > 0 else set()
            relevant = resolved_remarks.filter(pl.col('package_id').is_in(list(pkg_ids_in_view)))
            if relevant.height > 0:
                st.markdown('<p class="section-header">📋 转化率超阈值备注结论（图表旁留存）</p>', unsafe_allow_html=True)
                for row in relevant.iter_rows(named=True):
                    pkg_name = row.get('package_name') or row['package_id']
                    trigger_val = float(row['trigger_value'])
                    handler = row.get('handler') or '未指定'
                    conclusion = row['conclusion']
                    resolved_time = row.get('resolved_time') or '未知'
                    st.markdown(f"""
                    <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:0.8rem; margin-bottom:0.5rem;">
                        <strong style="color:#166534;">📌 {pkg_name}</strong> 
                        <span style="color:#6b7280; font-size:0.85rem;">| 触发值 {trigger_val:.2%} | 处理人 {handler} | {resolved_time}</span>
                        <div style="margin-top:0.4rem; padding:0.4rem; background:#dcfce7; border-radius:4px;">
                            💬 <strong>结论</strong>：{conclusion}
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
    except Exception:
        pass

    col_left, col_right = st.columns([2, 1])
    
    with col_left:
        st.markdown('<p class="section-header">各套餐详细转化数据</p>', unsafe_allow_html=True)
        
        display_df = conversion_df.select([
            'package_name', '浏览人数', '加购人数', '下单人数', '支付人数', '预约人数', '核销人数',
            '加购转化率', '下单转化率', '支付转化率', '预约转化率', '核销转化率', '整体转化率'
        ])
        
        def format_percent(val):
            try:
                return f"{float(val):.2%}"
            except:
                return val
        
        styled = display_df.to_pandas()
        for col in ['加购转化率', '下单转化率', '支付转化率', '预约转化率', '核销转化率', '整体转化率']:
            styled[col] = styled[col].apply(format_percent)
        
        st.dataframe(
            styled,
            hide_index=True,
            use_container_width=True,
            height=400
        )
    
    with col_right:
        st.markdown('<p class="section-header">分阶段转化</p>', unsafe_allow_html=True)
        
        avg_row = {
            '阶段': ['加购', '下单', '支付', '预约', '核销'],
            '平均转化率': [
                float(conversion_df['加购转化率'].mean()),
                float(conversion_df['下单转化率'].mean()),
                float(conversion_df['支付转化率'].mean()),
                float(conversion_df['预约转化率'].mean()),
                float(conversion_df['核销转化率'].mean())
            ]
        }
        avg_df = pl.DataFrame(avg_row)
        
        fig_stage = px.bar(
            avg_df.to_pandas(),
            x='阶段',
            y='平均转化率',
            color='平均转化率',
            color_continuous_scale='RdYlGn',
            text_auto='.2%',
            height=400
        )
        fig_stage.update_layout(yaxis_tickformat='.0%')
        st.plotly_chart(fig_stage, use_container_width=True)

elif page == "📈 转化率分析与复盘":
    st.markdown('<p class="section-header">转化率趋势复盘</p>', unsafe_allow_html=True)
    
    try:
        new_tasks = analytics.check_conversion_threshold_and_create_task()
        if new_tasks:
            with st.expander(f"🔔 新生成 {len(new_tasks)} 个超阈值备注任务", expanded=True):
                for task in new_tasks:
                    st.info(f"""
                        **任务ID**: {task['task_id']}  
                        **套餐**: {task['package_name']} ({task['package_id']})  
                        **当前转化率**: {task['conversion_rate']:.2%} (阈值: {settings.CONVERSION_RATE_THRESHOLD:.0%})  
                        → 请前往'备注任务管理'处理
                    """)
        
        trend_df = analytics.get_conversion_trend(selected_package, days=30)
        conversion_df = analytics.get_conversion_rates(selected_package, date_tuple)
    except Exception as e:
        st.error(f"数据查询出错: {e}")
        st.info("请先生成测试数据")
        st.stop()
    
    if trend_df.height == 0:
        st.warning("暂无趋势数据")
    else:
        trend_pd = trend_df.to_pandas()
        trend_pd['stat_date'] = pd.to_datetime(trend_pd['stat_date'])
        
        fig_trend = make_subplots(
            rows=2, cols=1,
            shared_xaxes=True,
            vertical_spacing=0.08,
            subplot_titles=("每日转化率趋势", "每日浏览/支付/核销人数")
        )
        
        if selected_package:
            pkg_trend = trend_pd[trend_pd['package_id'].notna()]
            fig_trend.add_trace(go.Scatter(
                x=pkg_trend['stat_date'],
                y=pkg_trend['daily_conversion'],
                mode='lines+markers',
                name='日转化率',
                line=dict(color='#667eea', width=2)
            ), row=1, col=1)
        else:
            daily_agg = trend_pd.groupby('stat_date').agg({
                'daily_browse': 'sum',
                'daily_pay': 'sum',
                'daily_verify': 'sum'
            }).reset_index()
            daily_agg['daily_conversion'] = (
                daily_agg['daily_pay'] / daily_agg['daily_browse'].replace(0, 1)
            )
            fig_trend.add_trace(go.Scatter(
                x=daily_agg['stat_date'],
                y=daily_agg['daily_conversion'],
                mode='lines+markers',
                name='整体日转化率',
                line=dict(color='#667eea', width=2),
                fill='tonexty',
                fillcolor='rgba(102, 126, 234, 0.1)'
            ), row=1, col=1)
            
            trend_pd = daily_agg
        
        fig_trend.add_hline(
            y=settings.CONVERSION_RATE_THRESHOLD,
            line_dash="dash",
            line_color="#e53e3e",
            row=1, col=1
        )
        
        fig_trend.add_trace(go.Bar(
            x=trend_pd['stat_date'],
            y=trend_pd['daily_browse'],
            name='浏览人数',
            marker_color='#4facfe'
        ), row=2, col=1)
        
        fig_trend.add_trace(go.Bar(
            x=trend_pd['stat_date'],
            y=trend_pd['daily_pay'],
            name='支付人数',
            marker_color='#43e97b'
        ), row=2, col=1)
        
        fig_trend.add_trace(go.Bar(
            x=trend_pd['stat_date'],
            y=trend_pd['daily_verify'],
            name='核销人数',
            marker_color='#fa709a'
        ), row=2, col=1)
        
        fig_trend.update_layout(
            height=600,
            hovermode="x unified",
            showlegend=True,
            yaxis1_tickformat='.0%'
        )
        st.plotly_chart(fig_trend, use_container_width=True)

    try:
        remark_tasks_all = analytics.get_pending_remark_tasks()
        resolved_here = remark_tasks_all.filter(
            (pl.col('status') == '已处理') & (pl.col('task_type') == '转化率超阈值') & (pl.col('conclusion').is_not_null())
        )
        if resolved_here.height > 0:
            if selected_package:
                resolved_here = resolved_here.filter(pl.col('package_id') == selected_package)
            if resolved_here.height > 0:
                st.markdown('<p class="section-header">📋 超阈值备注结论（留存于转化率图表旁）</p>', unsafe_allow_html=True)
                for row in resolved_here.iter_rows(named=True):
                    pkg_name = row.get('package_name') or row['package_id']
                    trigger_val = float(row['trigger_value'])
                    handler = row.get('handler') or '未指定'
                    conclusion = row['conclusion']
                    resolved_time = row.get('resolved_time') or '未知'
                    st.markdown(f"""
                    <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:0.8rem; margin-bottom:0.5rem;">
                        <strong style="color:#166534;">📌 {pkg_name}</strong> 
                        <span style="color:#6b7280; font-size:0.85rem;">| 触发值 {trigger_val:.2%} | 处理人 {handler} | {resolved_time}</span>
                        <div style="margin-top:0.4rem; padding:0.4rem; background:#dcfce7; border-radius:4px;">
                            💬 <strong>结论</strong>：{conclusion}
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
    except Exception:
        pass

    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown('<p class="section-header">转化改善分析 - 各环节转化率</p>', unsafe_allow_html=True)
        
        if conversion_df.height > 0:
            stage_rates = [
                ("加购转化率", float(conversion_df['加购转化率'].mean())),
                ("下单转化率", float(conversion_df['下单转化率'].mean())),
                ("支付转化率", float(conversion_df['支付转化率'].mean())),
                ("预约转化率", float(conversion_df['预约转化率'].mean())),
                ("核销转化率", float(conversion_df['核销转化率'].mean())),
            ]
            
            worst_stage = min(stage_rates, key=lambda x: x[1])
            best_stage = max(stage_rates, key=lambda x: x[1])
            
            st.warning(f"⚠️ **最薄弱环节**: {worst_stage[0]} 仅 {worst_stage[1]:.2%}，建议重点优化")
            st.success(f"✅ **表现最佳**: {best_stage[0]} 达到 {best_stage[1]:.2%}")
            
            gauge_figs = make_subplots(
                rows=2, cols=3,
                subplot_titles=[s[0] for s in stage_rates],
                specs=[[{'type': 'indicator'}, {'type': 'indicator'}, {'type': 'indicator'}],
                       [{'type': 'indicator'}, {'type': 'indicator'}, {'type': 'indicator'}]]
            )
            
            colors = ['#ef4444', '#f59e0b', '#10b981']
            for idx, (name, rate) in enumerate(stage_rates):
                row = idx // 3 + 1
                col = idx % 3 + 1
                color_idx = 0 if rate < 0.4 else (1 if rate < 0.7 else 2)
                
                gauge_figs.add_trace(go.Indicator(
                    mode="gauge+number",
                    value=rate * 100,
                    domain={'x': [0, 1], 'y': [0, 1]},
                    gauge={
                        'axis': {'range': [0, 100], 'ticksuffix': '%'},
                        'bar': {'color': colors[color_idx]},
                        'steps': [
                            {'range': [0, 40], 'color': '#fef2f2'},
                            {'range': [40, 70], 'color': '#fffbeb'},
                            {'range': [70, 100], 'color': '#ecfdf5'}
                        ],
                        'threshold': {
                            'line': {'color': '#dc2626', 'width': 2},
                            'thickness': 0.8,
                            'value': 65
                        }
                    },
                    number={'suffix': '%', 'font': {'size': 24}}
                ), row=row, col=col)
            
            gauge_figs.update_layout(height=450, margin=dict(l=20, r=20, t=60, b=20))
            st.plotly_chart(gauge_figs, use_container_width=True)

    with col2:
        st.markdown('<p class="section-header">复盘建议 - 改善路径</p>', unsafe_allow_html=True)
        
        if conversion_df.height > 0:
            for idx, row in enumerate(conversion_df.iter_rows(named=True)):
                pkg_name = row['package_name']
                overall = float(row['整体转化率'])
                end2end = float(row['端到端转化率'])
                
                with st.expander(f"📋 {pkg_name} - 整体转化率: {overall:.2%}", expanded=(idx < 2)):
                    suggestions = []
                    
                    if float(row['加购转化率']) < 0.5:
                        suggestions.append("🔴 **加购环节**：转化率偏低，建议优化商品详情页、增加限时优惠提示、强化套餐卖点")
                    elif float(row['加购转化率']) < 0.7:
                        suggestions.append("🟡 **加购环节**：可进一步优化，尝试增加用户评价展示、关联套餐推荐")
                    else:
                        suggestions.append("🟢 **加购环节**：表现良好")
                    
                    if float(row['下单转化率']) < 0.5:
                        suggestions.append("🔴 **下单环节**：流失严重，可能是价格敏感、结账流程复杂，建议简化流程、提供分期支付")
                    elif float(row['下单转化率']) < 0.7:
                        suggestions.append("🟡 **下单环节**：可优化结账页面，增加信任背书、减少填写项")
                    else:
                        suggestions.append("🟢 **下单环节**：表现良好")
                    
                    if float(row['支付转化率']) < 0.7:
                        suggestions.append("🔴 **支付环节**：异常流失，请检查支付网关稳定性、增加更多支付方式")
                    else:
                        suggestions.append("🟢 **支付环节**：表现良好")
                    
                    if float(row['预约转化率']) < 0.6:
                        suggestions.append("🔴 **预约环节**：支付后未预约，建议加强客服跟进、发送预约提醒短信")
                    else:
                        suggestions.append("🟢 **预约环节**：表现良好")
                    
                    if float(row['核销转化率']) < 0.8:
                        suggestions.append("🟡 **核销环节**：预约后未完成入住，关注No-show情况，可收取保证金降低损失")
                    else:
                        suggestions.append("🟢 **核销环节**：表现良好")
                    
                    for s in suggestions:
                        st.markdown(f"- {s}")
                    
                    st.markdown("---")
                    st.markdown(f"💡 **综合评估**: 端到端转化率 **{end2end:.2%}**，")
                    if end2end >= 0.15:
                        st.success("优秀，整体运营效率很高！")
                    elif end2end >= 0.08:
                        st.info("中等水平，存在优化空间")
                    else:
                        st.error("偏低，建议系统性优化各环节流程")

elif page == "⚠️ 超卖检测与缺口":
    st.markdown('<p class="section-header">套餐超卖预警</p>', unsafe_allow_html=True)
    
    try:
        oversold_df = analytics.detect_oversold_packages()
        linkage_df = analytics.get_deposit_inventory_linkage(selected_package)
    except Exception as e:
        st.error(f"数据查询出错: {e}")
        st.stop()
    
    col1, col2, col3 = st.columns(3)
    
    oversold_count = oversold_df.height
    total_gap = abs(int(oversold_df['stock_gap'].sum())) if oversold_count > 0 else 0
    
    with col1:
        st.markdown(f'<div class="warning-card"><div style="font-size:0.85rem;opacity:0.9;">超卖套餐数</div><div style="font-size:1.8rem;font-weight:bold;">{oversold_count} 个</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div class="warning-card"><div style="font-size:0.85rem;opacity:0.9;">总缺口数量</div><div style="font-size:1.8rem;font-weight:bold;">{total_gap} 份</div></div>', unsafe_allow_html=True)
    with col3:
        total_stock = int(linkage_df['original_stock'].sum()) if linkage_df.height > 0 else 0
        st.markdown(f'<div class="metric-card"><div style="font-size:0.85rem;opacity:0.9;">总库存数</div><div style="font-size:1.8rem;font-weight:bold;">{total_stock:,} 份</div></div>', unsafe_allow_html=True)

    if oversold_df.height == 0:
        st.success("✅ 暂无超卖套餐，库存状态健康")
    else:
        st.error(f"⚠️ 检测到 {oversold_df.height} 个套餐存在超卖或库存缺口！")
        
        oversold_pd = oversold_df.to_pandas()
        
        def status_tag(row):
            if bool(row['is_oversold']) or int(row['stock_gap']) < 0:
                return f'<span class="oversold-tag">🔴 超卖 {abs(int(row["stock_gap"]))}份</span>'
            elif int(row['stock_gap']) <= 5:
                return f'<span class="gap-tag">🟡 库存紧张 剩{int(row["stock_gap"])}份</span>'
            else:
                return f'<span class="normal-tag">🟢 正常</span>'
        
        oversold_pd['状态'] = oversold_pd.apply(status_tag, axis=1)
        
        display = oversold_pd[['package_name', 'original_stock', 'current_stock', 'paid_orders', 'stock_gap', '状态']]
        display.columns = ['套餐名称', '原始库存', '当前库存', '已支付订单', '库存缺口', '状态标记']
        
        st.markdown(display.to_html(escape=False, index=False, classes='dataframe'), unsafe_allow_html=True)

    st.markdown('<p class="section-header">库存健康度热力图</p>', unsafe_allow_html=True)
    
    health_data = []
    for row in linkage_df.iter_rows(named=True):
        stock_rate = float(row.get('stock_remaining_rate', 0))
        health_data.append({
            '套餐': row['package_name'],
            '库存剩余率': stock_rate,
            '原始库存': row['original_stock'],
            '当前库存': row['current_stock'],
            '健康度': '危险' if stock_rate < 0.1 else ('警告' if stock_rate < 0.3 else '健康')
        })
    
    health_df = pd.DataFrame(health_data)
    
    if len(health_df) > 0:
        fig_heatmap = px.bar(
            health_df,
            x='套餐',
            y='库存剩余率',
            color='健康度',
            color_discrete_map={
                '危险': '#ef4444',
                '警告': '#f59e0b',
                '健康': '#10b981'
            },
            text_auto='.0%',
            height=400
        )
        fig_heatmap.add_hline(y=0.1, line_dash="dash", line_color="#ef4444", annotation_text="警戒线 10%")
        fig_heatmap.add_hline(y=0.3, line_dash="dash", line_color="#f59e0b", annotation_text="警告线 30%")
        fig_heatmap.update_layout(yaxis_tickformat='.0%')
        st.plotly_chart(fig_heatmap, use_container_width=True)

    st.markdown('<p class="section-header">超卖影响分析与建议</p>', unsafe_allow_html=True)
    
    if oversold_df.height > 0:
        for row in oversold_df.iter_rows(named=True):
            gap = abs(int(row['stock_gap']))
            pkg_name = row['package_name']
            
            with st.expander(f"🔴 {pkg_name} - 超卖 {gap} 份处理方案", expanded=True):
                st.warning(f"""
                    **影响评估**: 超卖 {gap} 份，可能影响 {gap} 位客户的入住体验，
                    存在客户投诉、渠道处罚、品牌声誉受损风险。
                """)
                
                st.markdown("**处理建议优先级**:")
                st.markdown("1. 🔴 **紧急联系客服**：逐一联系受影响客户，提供以下方案：")
                st.markdown("   - 升级到同级或更高级房型（优先）")
                st.markdown("   - 更换入住日期并提供额外折扣")
                st.markdown("   - 全额退款 + 补偿优惠券（下次可用）")
                st.markdown("2. 🟡 **排查原因**：检查是否为渠道库存同步延迟、人工操作失误、系统Bug")
                st.markdown("3. 🟢 **预防措施**：设置库存安全阈值（建议保留5%-10%安全库存）")
    else:
        st.info("💡 建议持续监控以下指标：")
        st.markdown("- 设置库存预警阈值，剩余10%时自动提醒")
        st.markdown("- 各渠道库存实时同步，避免异步更新造成超卖")
        st.markdown("- 大促活动期间额外增加安全库存")

elif page == "💬 客服口径一致性":
    st.markdown('<p class="section-header">客服消息口径对照检查</p>', unsafe_allow_html=True)
    
    try:
        consistency_df = analytics.get_cs_message_consistency_check()
    except Exception as e:
        st.error(f"数据查询出错: {e}")
        st.stop()
    
    total = consistency_df.height
    inconsistent = len([r for r in consistency_df.iter_rows(named=True) if r['consistency_status'] != '一致'])
    consistent = total - inconsistent
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown(f'<div class="metric-card"><div style="font-size:0.85rem;opacity:0.9;">检查订单数</div><div style="font-size:1.8rem;font-weight:bold;">{total}</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div class="success-card"><div style="font-size:0.85rem;opacity:0.9;">口径一致</div><div style="font-size:1.8rem;font-weight:bold;">{consistent}</div></div>', unsafe_allow_html=True)
    with col3:
        st.markdown(f'<div class="warning-card"><div style="font-size:0.85rem;opacity:0.9;">口径不一致</div><div style="font-size:1.8rem;font-weight:bold;">{inconsistent}</div></div>', unsafe_allow_html=True)

    if total == 0:
        st.info("暂无客服消息数据")
        st.stop()
    
    consistent_rate = consistent / total if total > 0 else 0
    
    fig_pie = go.Figure(data=[go.Pie(
        labels=['口径一致', '口径不一致'],
        values=[consistent, inconsistent],
        marker=dict(colors=['#10b981', '#ef4444']),
        textinfo='label+percent',
        hole=0.4
    )])
    fig_pie.update_layout(title="客服口径一致性分布", height=350)
    st.plotly_chart(fig_pie, use_container_width=True)

    st.markdown('<p class="section-header">不一致详情 - 逐条对照</p>', unsafe_allow_html=True)
    
    inconsistent_df = consistency_df.filter(pl.col('consistency_status') != '一致')
    
    if inconsistent_df.height == 0:
        st.success("✅ 所有客服消息口径一致，服务标准化执行良好")
    else:
        st.warning(f"⚠️ 发现 {inconsistent_df.height} 条口径不一致记录，请及时处理")
        
        for idx, row in enumerate(inconsistent_df.iter_rows(named=True)):
            with st.expander(f"❌ [{row['consistency_status']}] 订单号: {row['order_id']} | 套餐: {row['package_id']}", expanded=(idx < 3)):
                col_a, col_b = st.columns(2)
                
                with col_a:
                    st.markdown("**📝 客服承诺口径**")
                    refund_policies = row.get('refund_policies') or []
                    delivery_times = row.get('delivery_times') or []
                    
                    if refund_policies:
                        st.markdown("**退款政策承诺历史**：")
                        for i, rp in enumerate(refund_policies):
                            tag = '🔴' if i > 0 else '🟡'
                            st.markdown(f"{tag} 版本{i+1}: {rp}")
                    
                    if delivery_times:
                        st.markdown("**入住时间承诺历史**：")
                        for i, dt in enumerate(delivery_times):
                            tag = '🔴' if i > 0 else '🟡'
                            st.markdown(f"{tag} 版本{i+1}: {dt}")
                
                with col_b:
                    st.markdown("**📋 实际履约情况**")
                    st.markdown(f"- **实际入住时间**: {row.get('actual_checkin', '未知')}")
                    st.markdown(f"- **实际退款金额**: ¥{row.get('actual_refund', 0)}")
                    st.markdown(f"- **消息总数**: {row.get('message_count', 0)} 条")
                    st.markdown(f"- **最后消息时间**: {row.get('last_message', '未知')}")
                
                st.markdown("---")
                st.info("💡 **处理建议**: 请客服主管介入，统一对客户的答复口径，避免法律纠纷")

    st.markdown('<p class="section-header">一致订单抽样查看</p>', unsafe_allow_html=True)
    
    consistent_only = consistency_df.filter(pl.col('consistency_status') == '一致').head(10)
    if consistent_only.height > 0:
        display = consistent_only.select([
            'order_id', 'package_id', 'consistency_status', 'message_count', 'last_message'
        ]).to_pandas()
        display.columns = ['订单号', '套餐ID', '一致性状态', '消息数', '最后消息时间']
        display['一致性状态'] = display['一致性状态'].apply(
            lambda x: f'<span class="consistent-tag">✅ 一致</span>' if x == '一致' else f'<span class="inconsistent-tag">❌ {x}</span>'
        )
        st.markdown(display.to_html(escape=False, index=False), unsafe_allow_html=True)

elif page == "✅ 核销记录总览":
    st.markdown('<p class="section-header">核销总览统计</p>', unsafe_allow_html=True)
    
    try:
        verify_df = analytics.get_verification_overview(date_tuple)
    except Exception as e:
        st.error(f"数据查询出错: {e}")
        st.stop()
    
    if verify_df.height == 0:
        st.warning("暂无核销记录")
        st.stop()
    
    total_verify = int(verify_df['verify_count'].sum())
    total_amount = float(verify_df['total_amount'].sum())
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(f'<div class="metric-card"><div style="font-size:0.85rem;opacity:0.9;">总核销次数</div><div style="font-size:1.8rem;font-weight:bold;">{total_verify:,}</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div class="success-card"><div style="font-size:0.85rem;opacity:0.9;">核销总金额</div><div style="font-size:1.8rem;font-weight:bold;">¥{total_amount:,.2f}</div></div>', unsafe_allow_html=True)
    with col3:
        pkg_count = verify_df.select(pl.n_unique('package_id')).item()
        st.markdown(f'<div class="metric-card"><div style="font-size:0.85rem;opacity:0.9;">涉及套餐数</div><div style="font-size:1.8rem;font-weight:bold;">{pkg_count}</div></div>', unsafe_allow_html=True)
    with col4:
        avg_amount = total_amount / max(total_verify, 1)
        st.markdown(f'<div class="warning-card"><div style="font-size:0.85rem;opacity:0.9;">客单价</div><div style="font-size:1.8rem;font-weight:bold;">¥{avg_amount:,.2f}</div></div>', unsafe_allow_html=True)

    col_a, col_b = st.columns(2)
    
    with col_a:
        st.markdown('<p class="section-header">核销方式分布</p>', unsafe_allow_html=True)
        
        type_agg = verify_df.group_by('verification_type').agg([
            pl.sum('verify_count').alias('count')
        ]).to_pandas()
        
        fig_type = px.pie(
            type_agg,
            names='verification_type',
            values='count',
            color_discrete_sequence=px.colors.qualitative.Set3,
            hole=0.4,
            height=380
        )
        st.plotly_chart(fig_type, use_container_width=True)
    
    with col_b:
        st.markdown('<p class="section-header">各套餐核销次数</p>', unsafe_allow_html=True)
        
        pkg_agg = verify_df.group_by(['package_id', 'package_name']).agg([
            pl.sum('verify_count').alias('count')
        ]).sort('count', descending=True).to_pandas()
        
        fig_pkg = px.bar(
            pkg_agg,
            x='package_name',
            y='count',
            color='count',
            color_continuous_scale='Blues',
            text_auto=True,
            height=380
        )
        fig_pkg.update_layout(xaxis_title="套餐", yaxis_title="核销次数")
        st.plotly_chart(fig_pkg, use_container_width=True)

    st.markdown('<p class="section-header">每日核销趋势</p>', unsafe_allow_html=True)
    
    daily_agg = verify_df.group_by('verify_date').agg([
        pl.sum('verify_count').alias('count'),
        pl.sum('total_amount').alias('amount')
    ]).sort('verify_date').to_pandas()
    daily_agg['verify_date'] = pd.to_datetime(daily_agg['verify_date'])
    
    fig_daily = make_subplots(specs=[[{"secondary_y": True}]])
    
    fig_daily.add_trace(
        go.Bar(x=daily_agg['verify_date'], y=daily_agg['count'], name="核销次数", marker_color='#667eea'),
        secondary_y=False
    )
    
    fig_daily.add_trace(
        go.Scatter(x=daily_agg['verify_date'], y=daily_agg['amount'], name="核销金额", 
                   mode='lines+markers', line=dict(color='#f5576c', width=3)),
        secondary_y=True
    )
    
    fig_daily.update_layout(
        height=450,
        hovermode="x unified",
        xaxis_title="日期",
        yaxis_title="核销次数",
        yaxis2_title="核销金额 (元)"
    )
    st.plotly_chart(fig_daily, use_container_width=True)

    st.markdown('<p class="section-header">核销明细</p>', unsafe_allow_html=True)
    
    detail_df = db.get_conn().execute("""
        SELECT 
            vr.verification_id,
            vr.order_id,
            p.package_name,
            vr.verification_time,
            vr.verification_type,
            vr.operator,
            vr.remarks,
            p.price
        FROM verification_records vr
        LEFT JOIN packages p ON vr.package_id = p.package_id
        ORDER BY vr.verification_time DESC
        LIMIT 200
    """).pl().to_pandas()
    
    if len(detail_df) > 0:
        detail_df['verification_time'] = pd.to_datetime(detail_df['verification_time']).dt.strftime('%Y-%m-%d %H:%M')
        detail_df.columns = ['核销ID', '订单号', '套餐名称', '核销时间', '核销方式', '操作人', '备注', '套餐价格']
        st.dataframe(detail_df, hide_index=True, use_container_width=True, height=400)

elif page == "💰 押金与库存联动":
    st.markdown('<p class="section-header">押金-库存联动分析</p>', unsafe_allow_html=True)
    
    try:
        linkage_df = analytics.get_deposit_inventory_linkage(selected_package)
    except Exception as e:
        st.error(f"数据查询出错: {e}")
        st.stop()
    
    if linkage_df.height == 0:
        st.warning("暂无数据")
        st.stop()

    st.markdown("**🔗 联动筛选器**")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        stock_rate_min, stock_rate_max = st.slider(
            "库存剩余率范围 (%)",
            min_value=0,
            max_value=100,
            value=(0, 100)
        )
    
    with col2:
        deposit_status = st.multiselect(
            "押金状态",
            ['已支付', '已退款', '部分退款'],
            default=['已支付', '已退款', '部分退款']
        )
    
    with col3:
        min_deposit = st.number_input("最小押金总额(元)", min_value=0.0, value=0.0, step=100.0)

    filtered_df = linkage_df.filter(
        (pl.col('stock_remaining_rate') >= stock_rate_min / 100) &
        (pl.col('stock_remaining_rate') <= stock_rate_max / 100) &
        (pl.col('total_deposit_paid') >= min_deposit)
    )
    
    linkage_pd = filtered_df.to_pandas()

    col_a, col_b, col_c, col_d = st.columns(4)
    with col_a:
        total_deposit = float(filtered_df['total_deposit_paid'].sum())
        st.markdown(f'<div class="metric-card"><div style="font-size:0.85rem;opacity:0.9;">押金总额</div><div style="font-size:1.8rem;font-weight:bold;">¥{total_deposit:,.2f}</div></div>', unsafe_allow_html=True)
    with col_b:
        refunded = float(filtered_df['total_deposit_refunded'].sum())
        st.markdown(f'<div class="success-card"><div style="font-size:0.85rem;opacity:0.9;">已退押金</div><div style="font-size:1.8rem;font-weight:bold;">¥{refunded:,.2f}</div></div>', unsafe_allow_html=True)
    with col_c:
        frozen = total_deposit - refunded
        st.markdown(f'<div class="warning-card"><div style="font-size:0.85rem;opacity:0.9;">冻结押金</div><div style="font-size:1.8rem;font-weight:bold;">¥{frozen:,.2f}</div></div>', unsafe_allow_html=True)
    with col_d:
        refund_rate = refunded / max(total_deposit, 0.01)
        st.markdown(f'<div class="metric-card"><div style="font-size:0.85rem;opacity:0.9;">押金退还率</div><div style="font-size:1.8rem;font-weight:bold;">{refund_rate:.1%}</div></div>', unsafe_allow_html=True)

    st.markdown('<p class="section-header">库存 vs 押金 散点图</p>', unsafe_allow_html=True)
    
    fig_scatter = px.scatter(
        linkage_pd,
        x='current_stock',
        y='total_deposit_paid',
        size='paid_deposit_count',
        color='stock_remaining_rate',
        hover_name='package_name',
        color_continuous_scale='RdYlGn_r',
        labels={
            'current_stock': '当前剩余库存',
            'total_deposit_paid': '押金总额(元)',
            'stock_remaining_rate': '库存剩余率',
            'paid_deposit_count': '押金单数'
        },
        height=450
    )
    st.plotly_chart(fig_scatter, use_container_width=True)

    col_left, col_right = st.columns(2)
    
    with col_left:
        st.markdown('<p class="section-header">各套餐押金构成</p>', unsafe_allow_html=True)
        
        fig_stack = go.Figure()
        fig_stack.add_trace(go.Bar(
            x=linkage_pd['package_name'],
            y=linkage_pd['total_deposit_refunded'],
            name='已退押金',
            marker_color='#10b981'
        ))
        fig_stack.add_trace(go.Bar(
            x=linkage_pd['package_name'],
            y=linkage_pd['total_deposit_paid'] - linkage_pd['total_deposit_refunded'],
            name='冻结押金',
            marker_color='#f59e0b'
        ))
        fig_stack.update_layout(
            barmode='stack',
            height=400,
            yaxis_title="金额(元)",
            xaxis_title="套餐"
        )
        st.plotly_chart(fig_stack, use_container_width=True)
    
    with col_right:
        st.markdown('<p class="section-header">库存状态分布</p>', unsafe_allow_html=True)
        
        def get_stock_status(rate):
            if rate < 0.1:
                return '🔴 危险'
            elif rate < 0.3:
                return '🟡 紧张'
            elif rate < 0.6:
                return '🟢 正常'
            else:
                return '💚 充足'
        
        linkage_pd['库存状态'] = linkage_pd['stock_remaining_rate'].apply(get_stock_status)
        status_counts = linkage_pd['库存状态'].value_counts().reset_index()
        status_counts.columns = ['状态', '数量']
        
        fig_status = px.pie(
            status_counts,
            names='状态',
            values='数量',
            color_discrete_map={
                '🔴 危险': '#ef4444',
                '🟡 紧张': '#f59e0b',
                '🟢 正常': '#10b981',
                '💚 充足': '#059669'
            },
            height=400,
            hole=0.3
        )
        st.plotly_chart(fig_status, use_container_width=True)

    st.markdown('<p class="section-header">押金-库存联动明细表</p>', unsafe_allow_html=True)
    
    display = linkage_pd.copy()
    display['库存状态'] = display['stock_remaining_rate'].apply(get_stock_status)
    display['stock_remaining_rate'] = (display['stock_remaining_rate'] * 100).round(2).astype(str) + '%'
    display['total_deposit_paid'] = display['total_deposit_paid'].apply(lambda x: f"¥{x:,.2f}")
    display['total_deposit_refunded'] = display['total_deposit_refunded'].apply(lambda x: f"¥{x:,.2f}")
    
    display = display[['package_name', 'original_stock', 'current_stock', 'stock_remaining_rate', '库存状态',
                       'paid_deposit_count', 'refunded_deposit_count', 'total_deposit_paid', 'total_deposit_refunded']]
    display.columns = ['套餐名称', '原始库存', '当前库存', '库存剩余率', '库存状态',
                       '已支付押金单数', '已退款押金单数', '押金总额', '已退总额']
    
    st.dataframe(display, hide_index=True, use_container_width=True, height=350)

    st.markdown('<p class="section-header">押金明细查询</p>', unsafe_allow_html=True)
    
    deposit_detail = db.get_conn().execute("""
        SELECT 
            d.deposit_id,
            d.order_id,
            p.package_name,
            d.deposit_amount,
            d.paid_time,
            d.status,
            d.refund_amount,
            d.refund_time,
            d.reason
        FROM deposit_records d
        LEFT JOIN packages p ON d.package_id = p.package_id
        ORDER BY d.paid_time DESC
        LIMIT 200
    """).pl().to_pandas()
    
    if len(deposit_detail) > 0:
        status_filter = st.multiselect(
            "按押金状态筛选明细",
            list(deposit_detail['status'].unique()),
            default=list(deposit_detail['status'].unique())
        )
        filtered_detail = deposit_detail[deposit_detail['status'].isin(status_filter)]
        filtered_detail['deposit_amount'] = filtered_detail['deposit_amount'].apply(lambda x: f"¥{x:,.2f}")
        filtered_detail['refund_amount'] = filtered_detail['refund_amount'].apply(lambda x: f"¥{x:,.2f}" if pd.notna(x) else '-')
        filtered_detail.columns = ['押金ID', '订单号', '套餐名称', '押金金额', '支付时间', '状态', '退款金额', '退款时间', '原因']
        st.dataframe(filtered_detail, hide_index=True, use_container_width=True, height=350)

elif page == "📡 渠道异常分析":
    st.markdown('<p class="section-header">渠道异常概览</p>', unsafe_allow_html=True)
    
    try:
        abnormal_df = analytics.get_channel_abnormal_analysis()
    except Exception as e:
        st.error(f"数据查询出错: {e}")
        st.stop()
    
    total_channels = db.get_conn().execute("SELECT COUNT(DISTINCT channel_name) FROM channel_orders").fetchone()[0]
    total_orders = db.get_conn().execute("SELECT COUNT(*) FROM channel_orders").fetchone()[0]
    abnormal_total = int(abnormal_df['abnormal_count'].sum()) if abnormal_df.height > 0 else 0
    abnormal_rate = abnormal_total / max(total_orders, 1)
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown(f'<div class="metric-card"><div style="font-size:0.85rem;opacity:0.9;">接入渠道数</div><div style="font-size:1.8rem;font-weight:bold;">{total_channels}</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div class="success-card"><div style="font-size:0.85rem;opacity:0.9;">渠道订单总数</div><div style="font-size:1.8rem;font-weight:bold;">{total_orders:,}</div></div>', unsafe_allow_html=True)
    with col3:
        st.markdown(f'<div class="warning-card"><div style="font-size:0.85rem;opacity:0.9;">异常订单数</div><div style="font-size:1.8rem;font-weight:bold;">{abnormal_total:,}</div></div>', unsafe_allow_html=True)
    with col4:
        st.markdown(f'<div class="warning-card"><div style="font-size:0.85rem;opacity:0.9;">整体异常率</div><div style="font-size:1.8rem;font-weight:bold;">{abnormal_rate:.2%}</div></div>', unsafe_allow_html=True)

    col_a, col_b = st.columns(2)
    
    with col_a:
        st.markdown('<p class="section-header">各渠道异常率对比</p>', unsafe_allow_html=True)
        
        if abnormal_df.height > 0:
            channel_agg = abnormal_df.group_by('channel_name').agg([
                pl.sum('total_orders').alias('total'),
                pl.sum('abnormal_count').alias('abnormal')
            ]).to_pandas()
            channel_agg['abnormal_rate'] = channel_agg['abnormal'] / channel_agg['total']
            channel_agg = channel_agg.sort_values('abnormal_rate', ascending=False)
            
            fig_channel = go.Figure()
            fig_channel.add_trace(go.Bar(
                x=channel_agg['channel_name'],
                y=channel_agg['abnormal_rate'] * 100,
                marker_color=channel_agg['abnormal_rate'].apply(
                    lambda x: '#ef4444' if x > 0.2 else ('#f59e0b' if x > 0.1 else '#10b981')
                ),
                text=[f'{r:.2%}' for r in channel_agg['abnormal_rate']],
                textposition='auto'
            ))
            fig_channel.update_layout(
                yaxis_tickformat='.0%',
                yaxis_title="异常率",
                height=400
            )
            st.plotly_chart(fig_channel, use_container_width=True)
        else:
            st.success("✅ 暂无渠道异常数据")
    
    with col_b:
        st.markdown('<p class="section-header">异常原因分布</p>', unsafe_allow_html=True)
        
        all_reasons = []
        for row in abnormal_df.iter_rows(named=True):
            reasons = row.get('abnormal_reasons') or []
            for r in reasons:
                if r:
                    all_reasons.append(r)
        
        if all_reasons:
            from collections import Counter
            reason_counts = Counter(all_reasons).most_common()
            reason_df = pd.DataFrame(reason_counts, columns=['原因', '次数'])
            
            fig_reason = px.bar(
                reason_df,
                x='次数',
                y='原因',
                orientation='h',
                color='次数',
                color_continuous_scale='Reds',
                text_auto=True,
                height=400
            )
            st.plotly_chart(fig_reason, use_container_width=True)
        else:
            st.info("暂无异常原因统计")

    st.markdown('<p class="section-header">渠道异常详情 - 异常点解释</p>', unsafe_allow_html=True)
    
    if abnormal_df.height == 0:
        st.success("✅ 当前无异常渠道订单，各渠道运行稳定")
    else:
        for row in abnormal_df.iter_rows(named=True):
            channel = row['channel_name']
            pkg_name = row['package_name']
            abn_rate = float(row['abnormal_rate'])
            abn_count = int(row['abnormal_count'])
            reasons = row.get('abnormal_reasons') or []
            avg_amt = float(row['avg_order_amount'])
            
            tag = '🔴 高危' if abn_rate > 0.2 else ('🟡 警告' if abn_rate > 0.1 else '🟢 轻微')
            
            with st.expander(f"{tag} [{channel}] {pkg_name} - 异常 {abn_count} 单 ({abn_rate:.2%})", expanded=(abn_rate > 0.15)):
                col_exp1, col_exp2, col_exp3 = st.columns(3)
                with col_exp1:
                    st.metric("异常订单数", f"{abn_count} 单")
                with col_exp2:
                    st.metric("异常率", f"{abn_rate:.2%}")
                with col_exp3:
                    st.metric("渠道均价", f"¥{avg_amt:,.2f}")
                
                st.markdown("**📋 异常原因分析**：")
                unique_reasons = set(r for r in reasons if r)
                for reason in unique_reasons:
                    rcnt = reasons.count(reason)
                    st.markdown(f"- ❗ **{reason}**: 出现 {rcnt} 次")
                
                st.markdown("**💡 排查建议**：")
                suggestions_map = {
                    "渠道价格与官网不一致": "检查渠道API价格同步机制，设置价格变动告警",
                    "订单状态同步延迟": "优化渠道Webhook回调，增加补偿轮询机制",
                    "库存信息不一致导致超卖": "检查渠道库存扣减时序，建议增加分布式锁",
                    "渠道佣金计算异常": "复核佣金配置规则，与渠道对账系统做差异对比",
                    "订单金额与支付金额不符": "检查优惠、券码等抵扣逻辑是否正确映射",
                    "用户信息缺失": "验证渠道返回字段映射，必填项做校验"
                }
                
                for reason in unique_reasons:
                    if reason in suggestions_map:
                        st.markdown(f"- **{reason}** → {suggestions_map[reason]}")

    st.markdown('<p class="section-header">各渠道订单总览</p>', unsafe_allow_html=True)
    
    channel_overview = db.get_conn().execute("""
        SELECT 
            co.channel_name,
            COUNT(*) as 订单数,
            ROUND(AVG(co.order_amount), 2) as 平均金额,
            ROUND(SUM(co.order_amount), 2) as 订单总额,
            COUNT(CASE WHEN co.is_abnormal = TRUE THEN 1 END) as 异常数,
            COUNT(CASE WHEN co.status = '成功' THEN 1 END) as 成功数
        FROM channel_orders co
        GROUP BY co.channel_name
        ORDER BY 订单数 DESC
    """).pl().to_pandas()
    
    if len(channel_overview) > 0:
        st.dataframe(channel_overview, hide_index=True, use_container_width=True)

elif page == "📝 备注任务管理":
    st.markdown('<p class="section-header">阈值触发任务列表</p>', unsafe_allow_html=True)
    
    try:
        tasks_df = analytics.get_pending_remark_tasks()
    except Exception as e:
        st.error(f"数据查询出错: {e}")
        st.stop()
    
    pending_count = 0
    resolved_count = 0
    for r in tasks_df.iter_rows(named=True):
        if r['status'] == '待处理':
            pending_count += 1
        else:
            resolved_count += 1
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown(f'<div class="warning-card"><div style="font-size:0.85rem;opacity:0.9;">待处理任务</div><div style="font-size:1.8rem;font-weight:bold;">{pending_count}</div></div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div class="success-card"><div style="font-size:0.85rem;opacity:0.9;">已处理任务</div><div style="font-size:1.8rem;font-weight:bold;">{resolved_count}</div></div>', unsafe_allow_html=True)
    with col3:
        total_tasks = pending_count + resolved_count
        st.markdown(f'<div class="metric-card"><div style="font-size:0.85rem;opacity:0.9;">任务总数</div><div style="font-size:1.8rem;font-weight:bold;">{total_tasks}</div></div>', unsafe_allow_html=True)

    st.markdown(f"""
    <div style="background:#f0f9ff; padding:1rem; border-radius:10px; border-left:4px solid #0284c7; margin-bottom:1rem;">
        <strong>📌 自动触发规则</strong>：当套餐 <strong>整体转化率</strong> 超过阈值 <strong>{settings.CONVERSION_RATE_THRESHOLD:.0%}</strong> 时，
        系统自动生成备注任务，提醒运营分析原因并记录复盘结论。处理结论将留存于关联图表旁供复盘参考。
    </div>
    """, unsafe_allow_html=True)

    if tasks_df.height == 0:
        st.info("暂无备注任务，当套餐转化率超过阈值时会自动生成")
    else:
        st.markdown('<p class="section-header">待处理任务 - 需填写处理结论</p>', unsafe_allow_html=True)
        
        pending = tasks_df.filter(pl.col('status') == '待处理')
        
        if pending.height == 0:
            st.success("✅ 所有任务已处理完毕")
        else:
            for idx, row in enumerate(pending.iter_rows(named=True)):
                task_id = row['task_id']
                pkg_name = row['package_name'] or row['package_id']
                trigger_val = float(row['trigger_value'])
                threshold = float(row['threshold'])
                task_type = row['task_type']
                trigger_time = row['trigger_time']
                
                with st.form(f"pending_task_{task_id}"):
                    st.markdown(f"""
                    <div style="background:#fff7ed; border:1px solid #fdba74; border-radius:10px; padding:1rem; margin-bottom:0.5rem;">
                        <span class="pending-tag">待处理</span>
                        <strong style="margin-left:0.5rem;">{pkg_name}</strong>
                        <span style="color:#6b7280; margin-left:1rem;">触发时间: {trigger_time}</span>
                        <br/>
                        <div style="margin-top:0.5rem;">
                            <span style="background:#dbeafe; padding:0.25rem 0.5rem; border-radius:5px;">{task_type}</span>
                            当前值 <strong>{trigger_val:.2%}</strong> > 阈值 <strong>{threshold:.0%}</strong>
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    col_t1, col_t2 = st.columns([3, 1])
                    with col_t1:
                        conclusion = st.text_area(
                            "📝 请填写处理结论（异常原因分析、改善措施、后续跟进计划等）",
                            key=f"conclusion_{task_id}",
                            height=80,
                            placeholder="例：转化率异常升高是因为周末大促活动，配合达人直播带来精准流量。后续建议每周五做活动预热..."
                        )
                    with col_t2:
                        handler = st.text_input(
                            "处理人",
                            key=f"handler_{task_id}",
                            placeholder="运营-张三"
                        )
                    
                    if st.form_submit_button(f"✅ 提交处理结论 - {task_id}", type="primary"):
                        if len(conclusion.strip()) < 10:
                            st.error("请填写详细的处理结论（至少10个字）")
                        else:
                            analytics.update_remark_task(task_id, conclusion, handler)
                            st.success(f"任务 {task_id} 已处理！结论已保留在关联图表旁")
                            st.rerun()

        st.markdown('<p class="section-header">已处理任务 - 历史结论（图表旁留存）</p>', unsafe_allow_html=True)
        
        resolved = tasks_df.filter(pl.col('status') != '待处理')
        
        if resolved.height == 0:
            st.info("暂无已处理任务")
        else:
            for row in resolved.iter_rows(named=True):
                task_id = row['task_id']
                pkg_name = row['package_name'] or row['package_id']
                trigger_val = float(row['trigger_value'])
                conclusion = row['conclusion']
                handler = row.get('handler') or '未指定'
                resolved_time = row.get('resolved_time') or '未知'
                anchor = row.get('chart_anchor') or ''
                
                anchor_display = f" (关联图表锚点: {anchor})" if anchor else ''
                with st.expander(f"✅ [{resolved_time}] {pkg_name} - {handler}{anchor_display}", expanded=False):
                    st.markdown(f"""
                    **任务ID**: {task_id}  
                    **触发值**: {trigger_val:.2%} (阈值 {settings.CONVERSION_RATE_THRESHOLD:.0%})  
                    **处理人**: {handler}  
                    **解决时间**: {resolved_time}  
                    **图表锚点**: {anchor or '无'}
                    """)
                    st.markdown("---")
                    st.markdown(f"**📋 处理结论（留存于图表旁）**：")
                    st.markdown(f"> {conclusion}")
        
        st.markdown('<p class="section-header">任务完成率仪表盘</p>', unsafe_allow_html=True)
        
        if total_tasks > 0:
            fig_completion = go.Figure(go.Indicator(
                mode="gauge+number+delta",
                value=resolved_count,
                delta={'reference': total_tasks, 'increasing': {'color': "#10b981"}},
                gauge={
                    'axis': {'range': [0, total_tasks]},
                    'bar': {'color': "#667eea"},
                    'steps': [
                        {'range': [0, resolved_count], 'color': '#dcfce7'},
                        {'range': [resolved_count, total_tasks], 'color': '#fee2e2'}
                    ]
                },
                domain={'x': [0, 1], 'y': [0, 1]},
                title={'text': "已完成任务数"}
            ))
            fig_completion.update_layout(height=300)
            st.plotly_chart(fig_completion, use_container_width=True)

elif page == "📚 数据版本追溯":
    st.markdown('<p class="section-header">收款流水 & 门锁记录版本管理</p>', unsafe_allow_html=True)
    
    st.info("本模块支持收款流水(payment_records)和门锁记录(door_lock_records)的版本追溯。每次数据更新前，系统自动保存前一版本快照到 MinIO 和 DuckDB 的 data_versions 表，支持双版本对照和差异分析。")
    
    tab1, tab2 = st.tabs(["💳 收款流水版本追溯", "🔐 门锁记录版本追溯"])
    
    with tab1:
        st.markdown("**步骤1: 选择要追溯的收款流水记录**")
        
        payments = db.get_conn().execute("""
            SELECT payment_id, order_id, package_id, amount, status, version, payment_time
            FROM payment_records
            ORDER BY payment_time DESC
            LIMIT 100
        """).pl().to_pandas()
        
        if len(payments) == 0:
            st.warning("暂无收款流水数据")
        else:
            payments_display = payments.copy()
            payments_display['payment_time'] = pd.to_datetime(payments_display['payment_time']).dt.strftime('%Y-%m-%d %H:%M')
            payments_display.columns = ['收款ID', '订单号', '套餐ID', '金额', '状态', '版本号', '支付时间']
            st.dataframe(payments_display, hide_index=True, use_container_width=True, height=250)
            
            selected_payment = st.selectbox(
                "选择收款ID查看版本历史",
                payments['payment_id'].tolist(),
                key="payment_select",
                format_func=lambda x: f"{x} (订单: {payments[payments['payment_id']==x]['order_id'].values[0]}, 金额: ¥{payments[payments['payment_id']==x]['amount'].values[0]:,.2f})"
            )
            
            st.markdown("**步骤2: 模拟版本更新（演示版本控制功能）**")
            with st.form("update_payment_demo"):
                col_up1, col_up2, col_up3 = st.columns(3)
                with col_up1:
                    new_status = st.selectbox("新状态", ["成功", "失败", "退款中", "已退款"])
                with col_up2:
                    change_reason = st.text_input("变更原因", placeholder="例：用户申请退款")
                with col_up3:
                    changed_by = st.text_input("操作人", placeholder="财务-李四")
                
                if st.form_submit_button("📝 创建新版本并保存快照"):
                    updates = {'status': new_status}
                    version_ctrl.update_payment_with_versioning(
                        selected_payment, updates, change_reason or "手动更新演示", changed_by or "system"
                    )
                    st.success(f"✅ 新版本创建成功！收款记录版本号已递增，历史快照已保存到 MinIO 和 DuckDB.data_versions（含 record_version）")
                    st.rerun()
            
            st.markdown("**步骤3: 查看历史版本**")
            payment_versions = version_ctrl.get_record_versions('payment_records', selected_payment)
            
            if len(payment_versions) == 0:
                st.info("该记录暂无历史版本（当前为V1），请先执行步骤2创建版本")
            else:
                st.success(f"找到 {len(payment_versions)} 个历史版本（MinIO + DuckDB），记录版本号已从 data_versions.record_version 读取")
                
                duckdb_count = sum(1 for v in payment_versions if v.get('source') == 'DuckDB')
                minio_count = sum(1 for v in payment_versions if v.get('source', 'MinIO') == 'MinIO')
                st.info(f"📦 DuckDB 快照: {duckdb_count} 条 | ☁️ MinIO 快照: {minio_count} 条")
                
                col_v1, col_v2 = st.columns(2)
                version_indices = []
                for i, v in enumerate(payment_versions):
                    source = v.get('source', 'MinIO')
                    ver = v.get('version', i+1)
                    ts = v.get('timestamp', '未知时间')
                    source_tag = '📦 DuckDB' if source == 'DuckDB' else '☁️ MinIO'
                    version_indices.append(f"📌 V{ver} ({source_tag}) - {ts}")
                
                with col_v1:
                    ver_a_idx = st.selectbox("选择版本A", range(len(version_indices)), format_func=lambda x: version_indices[x], key="ver_a_pay")
                with col_v2:
                    ver_b_idx = st.selectbox("选择版本B", range(len(version_indices)), format_func=lambda x: version_indices[x], key="ver_b_pay", index=min(1, len(version_indices)-1))
                
                if ver_a_idx != ver_b_idx:
                    comparison = version_ctrl.compare_versions(
                        payment_versions[ver_a_idx], payment_versions[ver_b_idx]
                    )
                    
                    if comparison['has_changes']:
                        st.warning(f"检测到 {len(comparison['differences'])} 处字段差异：")
                        diff_df = pd.DataFrame([
                            {
                                '字段名': k,
                                f'Version {comparison["version_a"]} 值': v['version_a_value'],
                                f'Version {comparison["version_b"]} 值': v['version_b_value']
                            }
                            for k, v in comparison['differences'].items()
                        ])
                        st.dataframe(diff_df, hide_index=True, use_container_width=True)
                    else:
                        st.info("两个版本内容完全一致")
                
                st.markdown("**各版本快照详情（含 DuckDB 持久化版本）**")
                for i, ver in enumerate(payment_versions):
                    ver_num = ver.get('version', i+1)
                    source = ver.get('source', 'MinIO')
                    is_duckdb = source == 'DuckDB'
                    source_badge = "🟢 📦 DuckDB持久化" if is_duckdb else "🔵 ☁️ MinIO缓存"
                    with st.expander(f"{source_badge} | 记录版本 V{ver_num} - {ver.get('timestamp', 'N/A')} | 变更原因: {ver.get('change_reason', '无')}"):
                        snapshot = ver.get('snapshot', {})
                        if is_duckdb:
                            st.markdown(f"<div style='background:#dcfce7; padding:0.5rem; border-radius:4px; margin-bottom:0.5rem;'><strong>✅ 这是从 DuckDB.data_versions 表读取的持久化版本（version_id 从 MAX(version_id)+1 生成）</strong></div>", unsafe_allow_html=True)
                        else:
                            st.markdown(f"<div style='background:#dbeafe; padding:0.5rem; border-radius:4px; margin-bottom:0.5rem;'><strong>ℹ️ 这是从 MinIO 读取的版本快照</strong></div>", unsafe_allow_html=True)
                        snap_df = pd.DataFrame([
                            {'字段': k, '值': str(v)} for k, v in snapshot.items()
                        ])
                        st.dataframe(snap_df, hide_index=True, width='stretch')
    
    with tab2:
        st.markdown("**门锁记录版本追溯**")
        
        locks = db.get_conn().execute("""
            SELECT lock_id, order_id, package_id, status, version, checkin_time, checkout_time
            FROM door_lock_records
            ORDER BY checkin_time DESC NULLS LAST
            LIMIT 100
        """).pl().to_pandas()
        
        if len(locks) == 0:
            st.warning("暂无门锁记录")
        else:
            locks_display = locks.copy()
            for col in ['checkin_time', 'checkout_time']:
                locks_display[col] = pd.to_datetime(locks_display[col], errors='coerce').dt.strftime('%Y-%m-%d %H:%M')
            locks_display.columns = ['门锁记录ID', '订单号', '套餐ID', '状态', '版本号', '入住时间', '退房时间']
            st.dataframe(locks_display, hide_index=True, use_container_width=True, height=250)
            
            selected_lock = st.selectbox(
                "选择门锁记录ID查看版本历史",
                locks['lock_id'].tolist(),
                key="lock_select",
                format_func=lambda x: f"{x} (订单: {locks[locks['lock_id']==x]['order_id'].values[0]}, 状态: {locks[locks['lock_id']==x]['status'].values[0]})"
            )
            
            st.markdown("**模拟门锁记录更新**")
            with st.form("update_lock_demo"):
                col_l1, col_l2, col_l3 = st.columns(3)
                with col_l1:
                    new_lock_status = st.selectbox("新状态", ["已预订", "已入住", "已退房", "已取消"])
                with col_l2:
                    open_count = st.number_input("增加开门次数", min_value=0, value=1)
                with col_l3:
                    lock_reason = st.text_input("变更原因", placeholder="例：客人已退房")
                
                if st.form_submit_button("🔐 创建门锁记录新版本"):
                    current = db.get_conn().execute(
                        "SELECT door_open_count FROM door_lock_records WHERE lock_id = ?",
                        [selected_lock]
                    ).fetchone()
                    current_count = current[0] if current else 0
                    
                    updates = {
                        'status': new_lock_status,
                        'door_open_count': current_count + open_count,
                        'last_open_time': datetime.now()
                    }
                    version_ctrl.update_door_lock_with_versioning(
                        selected_lock, updates, lock_reason or "手动更新演示"
                    )
                    st.success(f"✅ 门锁记录新版本创建成功！版本号已递增，历史快照已保存（含 record_version）")
                    st.rerun()
            
            st.markdown("**门锁记录历史版本**")
            lock_versions = version_ctrl.get_record_versions('door_lock_records', selected_lock)
            
            if len(lock_versions) == 0:
                st.info("该记录暂无历史版本，请先执行更新操作")
            else:
                duckdb_count = sum(1 for v in lock_versions if v.get('source') == 'DuckDB')
                minio_count = sum(1 for v in lock_versions if v.get('source', 'MinIO') == 'MinIO')
                st.success(f"找到 {len(lock_versions)} 个历史版本，版本号来自 data_versions.record_version")
                st.info(f"📦 DuckDB 持久化快照: {duckdb_count} 条 | ☁️ MinIO 缓存快照: {minio_count} 条")
                
                for i, ver in enumerate(lock_versions):
                    ver_num = ver.get('version', i+1)
                    source = ver.get('source', 'MinIO')
                    is_duckdb = source == 'DuckDB'
                    source_badge = "🟢 📦 DuckDB持久化" if is_duckdb else "🔵 ☁️ MinIO缓存"
                    with st.expander(f"{source_badge} | 🔒 记录版本 V{ver_num} - {ver.get('timestamp', 'N/A')} | {ver.get('change_reason', '无')}"):
                        snapshot = ver.get('snapshot', {})
                        if is_duckdb:
                            st.markdown(f"<div style='background:#dcfce7; padding:0.5rem; border-radius:4px; margin-bottom:0.5rem;'><strong>✅ 这是从 DuckDB.data_versions 表读取的持久化版本（version_id 从 MAX(version_id)+1 生成）</strong></div>", unsafe_allow_html=True)
                        else:
                            st.markdown(f"<div style='background:#dbeafe; padding:0.5rem; border-radius:4px; margin-bottom:0.5rem;'><strong>ℹ️ 这是从 MinIO 读取的版本快照</strong></div>", unsafe_allow_html=True)
                        snap_df = pd.DataFrame([
                            {'字段': k, '值': str(v)} for k, v in snapshot.items()
                        ])
                        st.dataframe(snap_df, hide_index=True, width='stretch')

st.markdown("---")
st.caption("""
🏨 旅游民宿套餐售卖漏斗报表系统 | 技术栈: Streamlit + Polars + DuckDB + MinIO  
数据版本双写: MinIO对象存储 + DuckDB data_versions表 | 支持字段级差异对照
""")