st.header("🎁 核销与退款分析")
st.markdown("---")

selected_regions = st.session_state.get("selected_regions", [])
start_date = st.session_state.get("start_date", datetime.now() - timedelta(days=90))
end_date = st.session_state.get("end_date", datetime.now())

tab1, tab2 = st.tabs(["🎟️ 核销记录分析", "💸 退款原因分析"])

with tab1:
    st.subheader("🎟️ 核销记录分析")
    
    try:
        redemption_df = st.session_state.refund_analyzer.get_redemption_details(
            start_date=start_date,
            end_date=end_date,
            selected_regions=selected_regions,
            days=90
        )
        
        if len(redemption_df) > 0:
            col1, col2, col3, col4 = st.columns(4)
            
            total_redemptions = len(redemption_df)
            total_points = redemption_df["points_used"].sum()
            completed = len(redemption_df.filter(pl.col("status") == "completed"))
            has_link = len(redemption_df.filter(pl.col("has_detail_link") == True))
            
            with col1:
                render_metric_card("总核销笔数", f"{total_redemptions}", None)
            with col2:
                render_metric_card("消耗积分总计", f"{total_points:,}", None)
            with col3:
                render_metric_card("完成核销", f"{completed}", 
                                   (completed / total_redemptions * 100) if total_redemptions > 0 else 0)
            with col4:
                render_metric_card("可跳转明细", f"{has_link}", 
                                   (has_link / total_redemptions * 100) if total_redemptions > 0 else 0)
            
            st.markdown("---")
            
            st.subheader("🔍 核销记录明细（可跳转明细）")
            
            status_filter = st.multiselect("筛选状态",
                                            redemption_df["status"].unique().to_list(),
                                            default=redemption_df["status"].unique().to_list())
            
            filtered_redemption = redemption_df.filter(pl.col("status").is_in(status_filter))
            
            if len(filtered_redemption) > 0:
                display_df = filtered_redemption.clone()
                
                st.dataframe(
                    display_df.select([
                        "redemption_id", "student_id", "student_name",
                        "course_name", "points_used", "redemption_time",
                        "status", "region", "has_detail_link"
                    ]).to_pandas(),
                    use_container_width=True,
                    hide_index=True,
                    column_config={
                        "has_detail_link": st.column_config.CheckboxColumn(
                            "可跳转",
                            help="是否可跳转到明细页面"
                        )
                    }
                )
                
                st.markdown("---")
                st.subheader("📋 查看核销明细")
                
                redemption_ids = filtered_redemption["redemption_id"].to_list()
                if redemption_ids:
                    selected_redemption = st.selectbox("选择核销ID查看详情", redemption_ids, index=0)
                    redemption_detail = filtered_redemption.filter(
                        pl.col("redemption_id") == selected_redemption
                    )
                    
                    if len(redemption_detail) > 0:
                        row = redemption_detail.to_pandas().iloc[0]
                        
                        col1, col2, col3 = st.columns(3)
                        with col1:
                            st.info(f"**学员**: {row['student_name']} ({row['student_id']})")
                        with col2:
                            st.info(f"**课程**: {row['course_name']}")
                        with col3:
                            st.info(f"**消耗积分**: {row['points_used']}")
                        
                        st.markdown(f"**核销时间**: `{row['redemption_time']}`")
                        st.markdown(f"**状态**: `{row['status']}`")
                        st.markdown(f"**区域**: `{row['region']}`")
                        
                        if row["detail_link"] and row["detail_link"] != "":
                            st.success(f"✅ 可跳转明细: [{row['detail_link']}]({row['detail_link']})")
                            
                            col1, col2 = st.columns(2)
                            with col1:
                                if st.button("🔗 跳转到明细", type="primary"):
                                    st.info(f"正在跳转到: {row['detail_link']}")
                                    st.toast(f"跳转至核销明细: {selected_redemption}")
                            with col2:
                                if st.button("📋 复制明细链接"):
                                    st.code(row["detail_link"], language=None)
                                    st.success("链接已复制")
                        else:
                            st.warning("⚠️ 该核销记录暂无明细链接")
                        
                        st.markdown("### 相关账户流水")
                        tx_query = f"""
                            SELECT 
                                transaction_id,
                                transaction_type,
                                amount,
                                balance_after,
                                transaction_time
                            FROM account_transactions
                            WHERE student_id = '{row['student_id']}'
                            AND transaction_type = 'redeem'
                            ORDER BY transaction_time DESC
                            LIMIT 5
                        """
                        try:
                            tx_detail = st.session_state.db_client.query_to_polars(tx_query)
                            if len(tx_detail) > 0:
                                st.dataframe(tx_detail.to_pandas(), use_container_width=True, hide_index=True)
                            else:
                                st.info("暂无相关流水记录")
                        except:
                            st.info("暂无相关流水记录")
            else:
                st.info("没有符合筛选条件的核销记录")
            
            st.markdown("---")
            
            col1, col2 = st.columns(2)
            
            with col1:
                st.subheader("📊 核销状态分布")
                status_dist = filtered_redemption.group_by("status").agg([
                    pl.count().alias("count")
                ])
                status_mapping = {
                    "completed": "已完成",
                    "pending": "处理中",
                    "failed": "失败"
                }
                status_dist = status_dist.with_columns([
                    pl.col("status").map_dict(status_mapping).alias("状态")
                ])
                fig = render_pie_chart(status_dist, "状态", "count",
                                        title="核销状态分布")
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                st.subheader("📈 每日核销趋势")
                daily_redemption = filtered_redemption.with_columns([
                    pl.col("redemption_time").dt.date().alias("redemption_date")
                ]).group_by("redemption_date").agg([
                    pl.count().alias("redemption_count"),
                    pl.sum("points_used").alias("total_points")
                ]).sort("redemption_date")
                
                fig = render_trend_chart(daily_redemption, "redemption_date", "redemption_count",
                                          title="每日核销笔数趋势",
                                          y_label="核销笔数")
                st.plotly_chart(fig, use_container_width=True)
        else:
            st.info("暂无核销记录数据")
            
    except Exception as e:
        st.error(f"核销记录加载失败: {e}")

with tab2:
    st.subheader("💸 退款原因分析")
    
    try:
        refund_stats = st.session_state.refund_analyzer.get_refund_statistics(
            days=90,
            selected_regions=selected_regions,
            start_date=start_date,
            end_date=end_date
        )
        
        by_reason_df = refund_stats.get("by_reason", pl.DataFrame())
        summary_df = refund_stats.get("summary", pl.DataFrame())
        
        if len(summary_df) > 0:
            col1, col2, col3, col4 = st.columns(4)
            
            total_refunds = summary_df["total_refunds"][0]
            total_amount = summary_df["total_amount"][0]
            avg_amount = summary_df["avg_amount"][0]
            affected_students = summary_df["affected_students"][0]
            
            with col1:
                render_metric_card("总退款笔数", f"{total_refunds}", None)
            with col2:
                render_metric_card("总退款金额", f"¥{total_amount:,.2f}", None)
            with col3:
                render_metric_card("平均退款金额", f"¥{avg_amount:,.2f}", None)
            with col4:
                render_metric_card("涉及学员数", f"{affected_students} 人", None)
        
        st.markdown("---")
        
        st.subheader("📊 退款原因分布")
        reason_dist = st.session_state.refund_analyzer.get_refund_reason_distribution(
            days=90,
            selected_regions=selected_regions,
            start_date=start_date,
            end_date=end_date
        )
        
        if len(reason_dist) > 0:
            col1, col2 = st.columns(2)
            
            with col1:
                fig = render_pie_chart(reason_dist, "refund_reason", "count",
                                        title="退款原因分布（按笔数）")
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                fig = render_bar_chart(reason_dist, "refund_reason", "total_amount",
                                        title="各原因退款金额",
                                        orientation="h")
                st.plotly_chart(fig, use_container_width=True)
            
            st.markdown("---")
            
            st.subheader("📋 退款原因解释口径")
            
            caliber = st.session_state.refund_analyzer.get_explanation_caliber()
            mapping = st.session_state.refund_analyzer.get_refund_explanation_mapping()
            
            reason_mapping_df = pl.DataFrame([
                {"具体原因": k, "解释口径": v} for k, v in mapping.items()
            ])
            
            for category, reasons in caliber.items():
                with st.expander(f"📌 {category} - 共 {len(reasons)} 项"):
                    for reason in reasons:
                        st.markdown(f"- {reason}")
            
            st.markdown("---")
            
            st.subheader("📈 退款趋势分析")
            refund_trend = st.session_state.refund_analyzer.get_refund_trend(
                days=90,
                selected_regions=selected_regions,
                start_date=start_date,
                end_date=end_date
            )
            
            if len(refund_trend) > 0:
                col1, col2 = st.columns(2)
                
                with col1:
                    fig = render_trend_chart(refund_trend, "refund_week", "refund_count",
                                              color_col="region",
                                              title="各区域每周退款笔数趋势",
                                              y_label="退款笔数")
                    st.plotly_chart(fig, use_container_width=True)
                
                with col2:
                    fig = render_trend_chart(refund_trend, "refund_week", "refund_amount",
                                              color_col="region",
                                              title="各区域每周退款金额趋势",
                                              y_label="退款金额 (元)")
                    st.plotly_chart(fig, use_container_width=True)
            
            st.markdown("---")
            
            st.subheader("🔍 退款异常检测")
            refund_anomalies = st.session_state.anomaly_detector.detect_refund_anomalies(30)
            
            if len(refund_anomalies) > 0 and selected_regions:
                refund_anomalies = refund_anomalies.filter(pl.col("region").is_in(selected_regions))
            
            if len(refund_anomalies) > 0:
                anomaly_points = refund_anomalies.filter(pl.col("is_anomaly") == True)
                if len(anomaly_points) > 0:
                    st.warning(f"⚠️ 检测到 {len(anomaly_points)} 个退款异常点")
                    st.dataframe(
                        anomaly_points.select([
                            "transaction_date", "region", "refund_rate",
                            "refund_count", "total_transactions"
                        ]).to_pandas(),
                        use_container_width=True,
                        hide_index=True
                    )
                else:
                    st.success("✅ 近30天无退款异常")
            
            st.markdown("---")
            
            st.subheader("📋 退款明细")
            detail_query = f"""
                SELECT 
                    refund_id,
                    student_id,
                    student_name,
                    course_name,
                    refund_amount,
                    refund_reason,
                    refund_time,
                    status,
                    region,
                    explanation
                FROM refund_records
                WHERE refund_time >= '{start_date}' 
                AND refund_time <= '{end_date}'
                {f"AND region IN ({','.join([f'\'{r}\'' for r in selected_regions])})" if selected_regions else ""}
                ORDER BY refund_time DESC
                LIMIT 500
            """
            detail_df = st.session_state.db_client.query_to_polars(detail_query)
            
            if len(detail_df) > 0:
                reason_filter = st.multiselect("筛选退款原因",
                                                detail_df["refund_reason"].unique().to_list(),
                                                default=detail_df["refund_reason"].unique().to_list())
                
                filtered_detail = detail_df.filter(pl.col("refund_reason").is_in(reason_filter))
                st.dataframe(filtered_detail.to_pandas(), use_container_width=True, hide_index=True)
                
                st.markdown("---")
                st.subheader("📄 查看退款详情")
                
                refund_ids = filtered_detail["refund_id"].to_list()
                if refund_ids:
                    selected_refund = st.selectbox("选择退款ID查看详情", refund_ids, index=0)
                    refund_detail = filtered_detail.filter(pl.col("refund_id") == selected_refund)
                    
                    if len(refund_detail) > 0:
                        row = refund_detail.to_pandas().iloc[0]
                        
                        st.info(f"**学员**: {row['student_name']} ({row['student_id']})")
                        st.info(f"**课程**: {row['course_name']}")
                        st.info(f"**退款金额**: ¥{row['refund_amount']:,.2f}")
                        st.markdown(f"**退款原因**: `{row['refund_reason']}`")
                        st.markdown(f"**处理状态**: `{row['status']}`")
                        st.markdown(f"**申请时间**: `{row['refund_time']}`")
                        st.markdown(f"**区域**: `{row['region']}`")
                        
                        if row["explanation"]:
                            st.markdown("### 💡 解释口径")
                            st.success(row["explanation"])
            else:
                st.info("暂无退款明细数据")
        else:
            st.info("暂无退款原因数据")
            
    except Exception as e:
        st.error(f"退款数据加载失败: {e}")
