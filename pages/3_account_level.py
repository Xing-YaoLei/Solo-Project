st.header("💰 账户流水与等级变化")
st.markdown("---")

selected_regions = st.session_state.get("selected_regions", [])
start_date = st.session_state.get("start_date", datetime.now() - timedelta(days=90))
end_date = st.session_state.get("end_date", datetime.now())

tab1, tab2 = st.tabs(["📊 账户流水分析", "📈 等级变化分析"])

with tab1:
    st.subheader("📊 账户流水 - 同环比分析")
    
    try:
        tx_df = st.session_state.metric_analyzer.get_account_transactions_with_mom_yoy(days=90)
        
        if len(tx_df) > 0 and selected_regions:
            tx_df = tx_df.filter(pl.col("region").is_in(selected_regions))
        
        if len(tx_df) > 0:
            col1, col2, col3, col4 = st.columns(4)
            
            total_amount = tx_df["total_amount"].sum()
            total_txs = tx_df["transaction_count"].sum()
            tx_types = tx_df["transaction_type"].unique().to_list()
            
            with col1:
                render_metric_card("总交易笔数", f"{total_txs:,}", None)
            with col2:
                render_metric_card("总交易金额", f"¥{total_amount:,.2f}", None)
            with col3:
                render_metric_card("交易类型", f"{len(tx_types)} 种", None)
            with col4:
                latest_month = tx_df["transaction_month"].max()
                latest_amount = tx_df.filter(pl.col("transaction_month") == latest_month)["total_amount"].sum()
                prev_month = tx_df["transaction_month"].unique().sort()[-2] if len(tx_df["transaction_month"].unique()) > 1 else latest_month
                prev_amount = tx_df.filter(pl.col("transaction_month") == prev_month)["total_amount"].sum()
                mom_pct = ((latest_amount - prev_amount) / prev_amount * 100) if prev_amount > 0 else 0
                render_metric_card("本月交易额", f"¥{latest_amount:,.2f}", mom_pct, "环比")
            
            st.markdown("---")
            
            st.subheader("📈 交易金额同环比")
            
            display_df = tx_df.sort("transaction_month", descending=True).head(12).sort("transaction_month")
            
            display_df = display_df.with_columns([
                pl.when(pl.col("total_amount_mom_pct").is_null()).then(0)
                  .otherwise(pl.col("total_amount_mom_pct")).alias("环比变化(%)"),
                pl.when(pl.col("total_amount_yoy_pct").is_null()).then(0)
                  .otherwise(pl.col("total_amount_yoy_pct")).alias("同比变化(%)")
            ])
            
            col1, col2 = st.columns(2)
            
            with col1:
                tx_agg = display_df.group_by("transaction_month").agg([
                    pl.sum("total_amount").alias("交易金额"),
                    pl.sum("transaction_count").alias("交易笔数")
                ]).sort("transaction_month")
                
                fig = render_bar_chart(tx_agg, "transaction_month", "交易金额",
                                        title="月度交易金额趋势",
                                        orientation="v")
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                yoy_mom_df = display_df.group_by("transaction_month").agg([
                    pl.mean("环比变化(%)").alias("环比变化(%)"),
                    pl.mean("同比变化(%)").alias("同比变化(%)")
                ]).sort("transaction_month")
                
                yoy_mom_pd = yoy_mom_df.to_pandas()
                import plotly.graph_objects as go
                fig = go.Figure()
                fig.add_trace(go.Bar(x=yoy_mom_pd["transaction_month"], 
                                     y=yoy_mom_pd["环比变化(%)"], 
                                     name="环比(%)",
                                     marker_color="#2196F3"))
                fig.add_trace(go.Bar(x=yoy_mom_pd["transaction_month"], 
                                     y=yoy_mom_pd["同比变化(%)"], 
                                     name="同比(%)",
                                     marker_color="#4CAF50"))
                fig.update_layout(title="交易金额同环比变化 (%)", barmode="group")
                fig.add_hline(y=0, line_dash="dash", line_color="gray")
                st.plotly_chart(fig, use_container_width=True)
            
            st.markdown("---")
            
            st.subheader("📊 按交易类型分析")
            
            type_agg = tx_df.group_by("transaction_type").agg([
                pl.sum("total_amount").alias("total_amount"),
                pl.sum("transaction_count").alias("transaction_count")
            ]).sort("total_amount", descending=True)
            
            col1, col2 = st.columns(2)
            
            with col1:
                fig = render_pie_chart(type_agg, "transaction_type", "total_amount",
                                        title="各交易类型金额占比")
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                type_mapping = {
                    "purchase": "购买课程",
                    "refund": "退款",
                    "top_up": "账户充值",
                    "redeem": "积分兑换",
                    "bonus": "奖励发放"
                }
                type_display = type_agg.with_columns([
                    pl.col("transaction_type").map_dict(type_mapping).alias("交易类型"),
                    pl.col("total_amount").alias("交易金额"),
                    pl.col("transaction_count").alias("交易笔数")
                ])
                fig = render_bar_chart(type_display, "交易类型", "交易金额",
                                        title="各交易类型金额对比",
                                        orientation="h")
                st.plotly_chart(fig, use_container_width=True)
            
            st.subheader("📋 交易明细")
            detail_query = f"""
                SELECT 
                    transaction_id,
                    student_id,
                    student_name,
                    transaction_type,
                    amount,
                    balance_after,
                    transaction_time,
                    region
                FROM account_transactions
                WHERE transaction_time >= '{start_date}' 
                AND transaction_time <= '{end_date}'
                {f"AND region IN ({','.join([f'\'{r}\'' for r in selected_regions])})" if selected_regions else ""}
                ORDER BY transaction_time DESC
                LIMIT 500
            """
            detail_df = st.session_state.db_client.query_to_polars(detail_query)
            if len(detail_df) > 0:
                type_filter = st.multiselect("筛选交易类型", 
                                              detail_df["transaction_type"].unique().to_list(),
                                              default=detail_df["transaction_type"].unique().to_list())
                filtered_detail = detail_df.filter(pl.col("transaction_type").is_in(type_filter))
                st.dataframe(filtered_detail.to_pandas(), use_container_width=True, hide_index=True)
            else:
                st.info("暂无交易明细数据")
        else:
            st.info("暂无账户流水数据")
            
    except Exception as e:
        st.error(f"账户流水数据加载失败: {e}")

with tab2:
    st.subheader("📈 等级变化 - 数据缺口染色")
    
    try:
        level_df = st.session_state.anomaly_detector.get_data_gap_colored_level_changes(days=90)
        
        if len(level_df) > 0 and selected_regions:
            level_df = level_df.filter(pl.col("region").is_in(selected_regions))
        
        if len(level_df) > 0:
            col1, col2, col3, col4 = st.columns(4)
            
            total_changes = len(level_df)
            level_ups = len(level_df.filter(pl.col("change_type") == "level_up"))
            level_drops = len(level_df.filter(pl.col("change_type") == "level_drop"))
            gaps = len(level_df.filter(pl.col("change_type") == "data_gap"))
            
            with col1:
                render_metric_card("总等级变化次数", f"{total_changes}", None)
            with col2:
                render_metric_card("等级提升", f"{level_ups} 次", 
                                   (level_ups / total_changes * 100) if total_changes > 0 else 0)
            with col3:
                render_metric_card("等级下降", f"{level_drops} 次", 
                                   (level_drops / total_changes * 100) if total_changes > 0 else 0,
                                   delta_label="占比")
            with col4:
                render_metric_card("数据缺口", f"{gaps} 个", 
                                   (gaps / total_changes * 100) if total_changes > 0 else 0,
                                   delta_label="占比")
            
            st.markdown("---")
            
            st.info("🔴 数据缺口 | 🟠 等级下降 | 🟢 等级提升")
            
            show_gaps_only = st.checkbox("只显示数据缺口记录", value=False)
            
            display_level_df = level_df.clone()
            if show_gaps_only:
                display_level_df = display_level_df.filter(pl.col("has_data_gap") == True)
            
            if len(display_level_df) > 0:
                st.subheader("📋 等级变化明细（数据缺口已染色）")
                
                render_colored_dataframe(
                    display_level_df.select([
                        "change_id", "student_id", "student_name", 
                        "old_level", "new_level", "change_reason",
                        "change_time", "region", "gap_days", 
                        "change_type", "row_color", "highlight"
                    ]).rename({
                        "change_id": "变更ID",
                        "student_id": "学员ID",
                        "student_name": "学员姓名",
                        "old_level": "原等级",
                        "new_level": "新等级",
                        "change_reason": "变更原因",
                        "change_time": "变更时间",
                        "region": "区域",
                        "gap_days": "缺口天数",
                        "change_type": "变更类型",
                        "row_color": "row_color",
                        "highlight": "highlight"
                    }),
                    color_col="row_color",
                    highlight_col="highlight"
                )
            else:
                st.info("没有符合条件的等级变化记录")
            
            st.markdown("---")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("📊 等级变化类型分布")
                type_dist = level_df.group_by("change_type").agg([
                    pl.count().alias("count")
                ])
                type_mapping = {
                    "data_gap": "数据缺口",
                    "level_drop": "等级下降",
                    "level_up": "等级提升",
                    "no_change": "无变化"
                }
                type_dist = type_dist.with_columns([
                    pl.col("change_type").map_dict(type_mapping).alias("变更类型")
                ])
                fig = render_pie_chart(type_dist, "变更类型", "count",
                                        title="等级变化类型分布")
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                st.subheader("📈 等级下降趋势（含异常检测）")
                anomaly_df = st.session_state.anomaly_detector.detect_level_drop_anomalies(30)
                if len(anomaly_df) > 0 and selected_regions:
                    anomaly_df = anomaly_df.filter(pl.col("region").is_in(selected_regions))
                
                if len(anomaly_df) > 0:
                    anomaly_pd = anomaly_df.to_pandas()
                    fig = go.Figure()
                    
                    normal_df = anomaly_df.filter(~pl.col("is_anomaly"))
                    anomaly_points = anomaly_df.filter(pl.col("is_anomaly"))
                    
                    if len(normal_df) > 0:
                        normal_pd = normal_df.to_pandas()
                        fig.add_trace(go.Scatter(
                            x=normal_pd["change_date"],
                            y=normal_pd["drop_rate"] * 100,
                            mode="lines+markers",
                            name="正常",
                            marker=dict(color="#4CAF50")
                        ))
                    
                    if len(anomaly_points) > 0:
                        anomaly_pd = anomaly_points.to_pandas()
                        fig.add_trace(go.Scatter(
                            x=anomaly_pd["change_date"],
                            y=anomaly_pd["drop_rate"] * 100,
                            mode="markers",
                            name="异常",
                            marker=dict(color="#F44336", size=12, symbol="star"),
                            text=anomaly_pd.apply(lambda x: f"区域: {x['region']}<br>下降率: {x['drop_rate']*100:.2f}%", axis=1)
                        ))
                    
                    fig.update_layout(title="等级下降率异常检测 (%)",
                                      xaxis_title="日期",
                                      yaxis_title="等级下降率 (%)")
                    st.plotly_chart(fig, use_container_width=True)
                    
                    if len(anomaly_points) > 0:
                        st.warning(f"⚠️ 检测到 {len(anomaly_points)} 个异常点，建议关注")
                        st.dataframe(
                            anomaly_points.select(["change_date", "region", "drop_rate", "total_changes", "drop_count"]).to_pandas(),
                            use_container_width=True,
                            hide_index=True
                        )
                else:
                    st.info("暂无异常检测数据")
        else:
            st.info("暂无等级变化数据")
            
    except Exception as e:
        st.error(f"等级变化数据加载失败: {e}")
