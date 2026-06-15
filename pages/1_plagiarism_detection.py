st.header("📝 作业抄袭检测")
st.markdown("---")

selected_regions = st.session_state.get("selected_regions", [])
start_date = st.session_state.get("start_date", datetime.now() - timedelta(days=30))
end_date = st.session_state.get("end_date", datetime.now())

col1, col2, col3, col4 = st.columns(4)

try:
    query = f"""
        SELECT 
            COUNT(*) as total_attempts,
            SUM(CASE WHEN is_plagiarized THEN 1 ELSE 0 END) as plagiarized_count,
            AVG(plagiarism_score) as avg_plagiarism_score,
            COUNT(DISTINCT student_id) as total_students,
            COUNT(DISTINCT CASE WHEN is_plagiarized THEN student_id END) as affected_students
        FROM question_bank_records
        WHERE attempt_time >= '{start_date}' 
        AND attempt_time <= '{end_date}'
        {f"AND region IN ({','.join([f'\'{r}\'' for r in selected_regions])})" if selected_regions else ""}
    """
    stats_df = st.session_state.db_client.query_to_polars(query)
    
    if len(stats_df) > 0:
        total = stats_df["total_attempts"][0]
        plag_count = stats_df["plagiarized_count"][0]
        plag_rate = (plag_count / total * 100) if total > 0 else 0
        avg_score = stats_df["avg_plagiarism_score"][0] * 100 if stats_df["avg_plagiarism_score"][0] else 0
        affected = stats_df["affected_students"][0]
        
        with col1:
            render_metric_card("总答题次数", f"{total:,}", None)
        with col2:
            render_metric_card("疑似抄袭次数", f"{plag_count}", plag_rate)
        with col3:
            render_metric_card("平均相似度", f"{avg_score:.2f}%", None)
        with col4:
            render_metric_card("涉及学生数", f"{affected} 人", None)
except Exception as e:
    st.warning(f"统计数据加载失败: {e}")

st.markdown("---")

col1, col2 = st.columns(2)

with col1:
    st.subheader("📊 抄袭相似度分布")
    try:
        score_query = f"""
            SELECT 
                CASE 
                    WHEN plagiarism_score < 0.3 THEN '低风险 (<30%)'
                    WHEN plagiarism_score < 0.6 THEN '中风险 (30-60%)'
                    WHEN plagiarism_score < 0.8 THEN '高风险 (60-80%)'
                    ELSE '极高风险 (>80%)'
                END as risk_level,
                COUNT(*) as count
            FROM question_bank_records
            WHERE attempt_time >= '{start_date}' 
            AND attempt_time <= '{end_date}'
            {f"AND region IN ({','.join([f'\'{r}\'' for r in selected_regions])})" if selected_regions else ""}
            GROUP BY risk_level
            ORDER BY count DESC
        """
        dist_df = st.session_state.db_client.query_to_polars(score_query)
        if len(dist_df) > 0:
            fig = render_pie_chart(dist_df, "risk_level", "count", 
                                    title="抄袭风险等级分布")
            st.plotly_chart(fig, use_container_width=True)
    except Exception as e:
        st.info("暂无分布数据")

with col2:
    st.subheader("📈 每日抄袭趋势")
    try:
        trend_query = f"""
            SELECT 
                DATE(attempt_time) as attempt_date,
                COUNT(*) as total_attempts,
                SUM(CASE WHEN is_plagiarized THEN 1 ELSE 0 END) as plagiarized_count,
                AVG(plagiarism_score) as avg_score
            FROM question_bank_records
            WHERE attempt_time >= '{start_date}' 
            AND attempt_time <= '{end_date}'
            {f"AND region IN ({','.join([f'\'{r}\'' for r in selected_regions])})" if selected_regions else ""}
            GROUP BY attempt_date
            ORDER BY attempt_date
        """
        trend_df = st.session_state.db_client.query_to_polars(trend_query)
        if len(trend_df) > 0:
            trend_df = trend_df.with_columns([
                (pl.col("plagiarized_count") / pl.col("total_attempts") * 100).alias("plagiarism_rate")
            ])
            fig = render_trend_chart(trend_df, "attempt_date", "plagiarism_rate",
                                      title="每日抄袭率趋势 (%)",
                                      y_label="抄袭率 (%)")
            st.plotly_chart(fig, use_container_width=True)
    except Exception as e:
        st.info("暂无趋势数据")

st.markdown("---")

st.subheader("🔍 抄袭样本明细")

try:
    samples_query = f"""
        SELECT 
            p.sample_id,
            p.attempt_id_1,
            p.attempt_id_2,
            p.student_id_1,
            p.student_id_2,
            s1.student_name as student_name_1,
            s2.student_name as student_name_2,
            p.similarity_score,
            p.matched_questions,
            p.detection_time,
            p.review_status,
            p.reviewer_notes
        FROM plagiarism_samples p
        LEFT JOIN (SELECT DISTINCT student_id, student_name FROM question_bank_records) s1
            ON p.student_id_1 = s1.student_id
        LEFT JOIN (SELECT DISTINCT student_id, student_name FROM question_bank_records) s2
            ON p.student_id_2 = s2.student_id
        WHERE p.detection_time >= '{start_date}' 
        AND p.detection_time <= '{end_date}'
        ORDER BY p.similarity_score DESC
        LIMIT 100
    """
    samples_df = st.session_state.db_client.query_to_polars(samples_query)
    
    if len(samples_df) > 0:
        status_filter = st.multiselect("筛选审核状态", 
                                        samples_df["review_status"].unique().to_list(),
                                        default=samples_df["review_status"].unique().to_list())
        
        filtered_df = samples_df.filter(pl.col("review_status").is_in(status_filter))
        
        if len(filtered_df) > 0:
            display_cols = ["sample_id", "student_id_1", "student_name_1", 
                            "student_id_2", "student_name_2", 
                            "similarity_score", "matched_questions", 
                            "detection_time", "review_status"]
            st.dataframe(
                filtered_df.select(display_cols).to_pandas(),
                use_container_width=True,
                hide_index=True
            )
            
            st.markdown("---")
            st.subheader("📋 查看样本详情")
            
            sample_ids = filtered_df["sample_id"].to_list()
            if sample_ids:
                selected_sample = st.selectbox("选择样本ID查看详情", sample_ids, index=0)
                sample_detail = filtered_df.filter(pl.col("sample_id") == selected_sample)
                
                if len(sample_detail) > 0:
                    row = sample_detail.to_pandas().iloc[0]
                    
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.info(f"**学生1**: {row['student_name_1']} ({row['student_id_1']})")
                        st.info(f"**答题ID**: {row['attempt_id_1']}")
                    with col2:
                        st.info(f"**学生2**: {row['student_name_2']} ({row['student_id_2']})")
                        st.info(f"**答题ID**: {row['attempt_id_2']}")
                    
                    st.markdown(f"**相似度分数**: `{row['similarity_score']:.4f}`")
                    st.markdown(f"**匹配题目**: `{row['matched_questions']}`")
                    st.markdown(f"**检测时间**: `{row['detection_time']}`")
                    st.markdown(f"**审核状态**: `{row['review_status']}`")
                    
                    if row['reviewer_notes']:
                        st.markdown(f"**审核备注**: {row['reviewer_notes']}")
                    
                    st.markdown("### 答题内容对比")
                    
                    detail_query = f"""
                        SELECT 
                            '学生1' as student,
                            attempt_id,
                            question_id,
                            is_correct,
                            score,
                            attempt_time,
                            plagiarism_score
                        FROM question_bank_records
                        WHERE attempt_id = '{row['attempt_id_1']}'
                        
                        UNION ALL
                        
                        SELECT 
                            '学生2' as student,
                            attempt_id,
                            question_id,
                            is_correct,
                            score,
                            attempt_time,
                            plagiarism_score
                        FROM question_bank_records
                        WHERE attempt_id = '{row['attempt_id_2']}'
                    """
                    try:
                        detail_df = st.session_state.db_client.query_to_polars(detail_query)
                        if len(detail_df) > 0:
                            st.dataframe(detail_df.to_pandas(), use_container_width=True, hide_index=True)
                        else:
                            st.info("暂无答题明细数据")
                    except Exception as e:
                        st.info(f"答题明细加载失败: {e}")
                    
                    col1, col2, col3 = st.columns(3)
                    with col1:
                        if st.button("标记为确认抄袭", type="primary"):
                            update_query = f"""
                                UPDATE plagiarism_samples 
                                SET review_status = 'confirmed',
                                    reviewer_notes = COALESCE(reviewer_notes, '') || ' 已确认抄袭'
                                WHERE sample_id = '{selected_sample}'
                            """
                            st.session_state.db_client.execute_query(update_query)
                            st.success("已标记为确认抄袭")
                            st.rerun()
                    with col2:
                        if st.button("标记为误报"):
                            update_query = f"""
                                UPDATE plagiarism_samples 
                                SET review_status = 'false_positive',
                                    reviewer_notes = COALESCE(reviewer_notes, '') || ' 标记为误报'
                                WHERE sample_id = '{selected_sample}'
                            """
                            st.session_state.db_client.execute_query(update_query)
                            st.success("已标记为误报")
                            st.rerun()
                    with col3:
                        if st.button("待审核"):
                            update_query = f"""
                                UPDATE plagiarism_samples 
                                SET review_status = 'pending'
                                WHERE sample_id = '{selected_sample}'
                            """
                            st.session_state.db_client.execute_query(update_query)
                            st.info("已重置为待审核")
                            st.rerun()
        else:
            st.info("没有符合筛选条件的样本")
    else:
        st.info("暂无抄袭样本数据，请先生成数据或运行同步任务")
except Exception as e:
    st.error(f"样本数据加载失败: {e}")
