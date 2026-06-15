st.header("📈 考试通过率分析")
st.markdown("---")

selected_regions = st.session_state.get("selected_regions", [])
start_date = st.session_state.get("start_date", datetime.now() - timedelta(days=90))
end_date = st.session_state.get("end_date", datetime.now())

view_mode = st.radio("查看方式", ["按日期趋势", "按区域比较", "按考试科目"], horizontal=True)

st.markdown("---")

try:
    pass_rates = st.session_state.metric_analyzer.get_pass_rate_trend(days=90)
    
    if len(pass_rates) > 0 and selected_regions:
        pass_rates = pass_rates.filter(pl.col("region").is_in(selected_regions))
    
    if len(pass_rates) > 0:
        total_students = pass_rates["total_students"].sum()
        total_passed = pass_rates["passed_students"].sum()
        overall_rate = (total_passed / total_students * 100) if total_students > 0 else 0
        avg_score = pass_rates["average_score"].mean()
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            render_metric_card("总参考人数", f"{total_students:,}", None)
        with col2:
            render_metric_card("通过人数", f"{total_passed:,}", None)
        with col3:
            render_metric_card("整体通过率", f"{overall_rate:.2f}%", None)
        with col4:
            render_metric_card("平均分数", f"{avg_score:.2f}", None)
        
        st.markdown("---")
        
        if view_mode == "按日期趋势":
            st.subheader("📊 通过率趋势分析")
            
            agg_by_date = pass_rates.group_by("exam_date").agg([
                pl.sum("total_students").alias("total_students"),
                pl.sum("passed_students").alias("passed_students"),
                (pl.sum("passed_students") / pl.sum("total_students") * 100).alias("pass_rate"),
                pl.mean("average_score").alias("average_score")
            ]).sort("exam_date")
            
            col1, col2 = st.columns(2)
            
            with col1:
                fig = render_trend_chart(agg_by_date, "exam_date", "pass_rate",
                                          title="每日通过率趋势 (%)",
                                          y_label="通过率 (%)")
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                fig = render_trend_chart(agg_by_date, "exam_date", "average_score",
                                          title="每日平均分数趋势",
                                          y_label="平均分数")
                st.plotly_chart(fig, use_container_width=True)
            
            st.subheader("📈 按区域通过率趋势")
            agg_by_region_date = pass_rates.group_by(["exam_date", "region"]).agg([
                pl.sum("total_students").alias("total_students"),
                pl.sum("passed_students").alias("passed_students"),
                (pl.sum("passed_students") / pl.sum("total_students") * 100).alias("pass_rate")
            ]).sort(["exam_date", "region"])
            
            fig = render_trend_chart(agg_by_region_date, "exam_date", "pass_rate",
                                      color_col="region",
                                      title="各区域通过率趋势对比 (%)",
                                      y_label="通过率 (%)")
            st.plotly_chart(fig, use_container_width=True)
            
        elif view_mode == "按区域比较":
            st.subheader("🗺️ 区域通过率对比")
            
            agg_by_region = pass_rates.group_by("region").agg([
                pl.sum("total_students").alias("total_students"),
                pl.sum("passed_students").alias("passed_students"),
                (pl.sum("passed_students") / pl.sum("total_students") * 100).alias("pass_rate"),
                pl.mean("average_score").alias("average_score")
            ]).sort("pass_rate", descending=True)
            
            col1, col2 = st.columns(2)
            
            with col1:
                fig = render_bar_chart(agg_by_region, "region", "pass_rate",
                                        title="各区域通过率对比 (%)",
                                        orientation="v")
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                fig = render_bar_chart(agg_by_region, "pass_rate", "region",
                                        title="各区域通过率排行 (%)",
                                        orientation="h")
                st.plotly_chart(fig, use_container_width=True)
            
            st.subheader("📊 区域详细数据")
            display_df = agg_by_region.select([
                "region", "total_students", "passed_students", 
                "pass_rate", "average_score"
            ]).rename({
                "region": "区域",
                "total_students": "参考人数",
                "passed_students": "通过人数",
                "pass_rate": "通过率(%)",
                "average_score": "平均分"
            })
            st.dataframe(display_df.to_pandas(), use_container_width=True, hide_index=True)
            
        elif view_mode == "按考试科目":
            st.subheader("📚 各科目通过率分析")
            
            agg_by_exam = pass_rates.group_by(["exam_id", "exam_name"]).agg([
                pl.sum("total_students").alias("total_students"),
                pl.sum("passed_students").alias("passed_students"),
                (pl.sum("passed_students") / pl.sum("total_students") * 100).alias("pass_rate"),
                pl.mean("average_score").alias("average_score"),
                pl.n_unique("exam_date").alias("exam_count")
            ]).sort("pass_rate", descending=True)
            
            col1, col2 = st.columns(2)
            
            with col1:
                fig = render_bar_chart(agg_by_exam, "exam_name", "pass_rate",
                                        title="各科目通过率对比 (%)",
                                        orientation="h")
                st.plotly_chart(fig, use_container_width=True)
            
            with col2:
                fig = render_bar_chart(agg_by_exam, "exam_name", "average_score",
                                        title="各科目平均分数对比",
                                        orientation="h")
                st.plotly_chart(fig, use_container_width=True)
            
            st.subheader("📋 科目详细数据")
            display_df = agg_by_exam.select([
                "exam_name", "total_students", "passed_students", 
                "pass_rate", "average_score", "exam_count"
            ]).rename({
                "exam_name": "考试名称",
                "total_students": "参考人数",
                "passed_students": "通过人数",
                "pass_rate": "通过率(%)",
                "average_score": "平均分",
                "exam_count": "考试场次"
            })
            st.dataframe(display_df.to_pandas(), use_container_width=True, hide_index=True)
    else:
        st.info("暂无考试通过率数据，请先生成数据或运行同步任务")

except Exception as e:
    st.error(f"数据加载失败: {e}")
