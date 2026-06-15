st.header("⚙️ 数据同步管理")
st.markdown("---")

col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🔄 同步所有系统", type="primary", use_container_width=True):
        with st.spinner("正在同步所有数据源..."):
            try:
                results = st.session_state.sync_manager.run_all_syncs()
                success_count = sum(1 for r in results.values() if r.get("success", False))
                st.success(f"同步完成！成功 {success_count}/{len(results)} 个系统")
                
                for source, result in results.items():
                    if result.get("success", False):
                        st.success(f"✅ {source}: 同步成功")
                    else:
                        st.error(f"❌ {source}: {result.get('error', '未知错误')}")
            except Exception as e:
                st.error(f"同步失败: {e}")

with col2:
    sync_source = st.selectbox("选择同步系统", 
                                ["employment", "live_platform", "question_bank"],
                                format_func=lambda x: {
                                    "employment": "📋 就业表",
                                    "live_platform": "📺 直播平台",
                                    "question_bank": "📝 题库系统"
                                }.get(x, x))
    
    if st.button("▶️ 同步选中系统", use_container_width=True):
        with st.spinner(f"正在同步 {sync_source}..."):
            try:
                result = st.session_state.sync_manager.run_sync(sync_source)
                if result.get("success", False):
                    st.success(f"✅ {sync_source} 同步成功")
                    summary = result.get("summary", {})
                    st.json(summary, expanded=False)
                else:
                    st.error(f"❌ 同步失败: {result.get('error', '未知错误')}")
            except Exception as e:
                st.error(f"同步失败: {e}")

with col3:
    if st.button("🔄 刷新同步历史", use_container_width=True):
        st.rerun()

st.markdown("---")

tab1, tab2, tab3 = st.tabs(["📋 同步历史记录", "📊 同步节点审计", "⚠️ 失败同步记录"])

with tab1:
    st.subheader("📋 同步历史记录")
    
    history_limit = st.slider("显示记录数", 10, 500, 100)
    source_filter = st.multiselect("筛选来源系统",
                                    ["employment", "live_platform", "question_bank"],
                                    default=["employment", "live_platform", "question_bank"])
    
    try:
        history = st.session_state.sync_manager.get_sync_history(limit=history_limit)
        
        if len(history) > 0 and source_filter:
            history = history.filter(pl.col("source_system").is_in(source_filter))
        
        if len(history) > 0:
            status_colors = {
                "completed": "background-color: #E8F5E9",
                "running": "background-color: #E3F2FD",
                "failed": "background-color: #FFEBEE",
                "pending": "background-color: #F5F5F5"
            }
            
            def highlight_status(row):
                return [status_colors.get(row["status"], "") for _ in row]
            
            history_pd = history.to_pandas()
            styled = history_pd.style.apply(highlight_status, axis=1)
            
            st.dataframe(
                styled,
                use_container_width=True,
                hide_index=True,
                column_config={
                    "sync_id": "同步ID",
                    "source_system": "来源系统",
                    "sync_node": "同步节点",
                    "status": "状态",
                    "records_processed": "处理记录数",
                    "start_time": "开始时间",
                    "end_time": "结束时间",
                    "error_message": "错误信息"
                }
            )
        else:
            st.info("暂无同步历史记录，请先执行同步任务")
            
    except Exception as e:
        st.error(f"加载同步历史失败: {e}")

with tab2:
    st.subheader("📊 同步节点审计")
    
    sync_id_input = st.text_input("输入同步ID查看详细审计", value="")
    
    if sync_id_input:
        try:
            summary = st.session_state.sync_manager.get_sync_summary(sync_id_input)
            
            if summary:
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.info(f"**同步ID**: {summary.get('sync_id', '')}")
                with col2:
                    st.info(f"**来源系统**: {summary.get('source_system', '')}")
                with col3:
                    status = summary.get('overall_status', '')
                    status_emoji = {
                        "completed": "✅",
                        "running": "⏳",
                        "failed": "❌",
                        "pending": "○"
                    }.get(status, "")
                    st.info(f"**整体状态**: {status_emoji} {status}")
                
                st.markdown("---")
                st.subheader("同步节点详情")
                
                nodes = summary.get("nodes", [])
                render_audit_trail(nodes)
            else:
                st.warning("未找到该同步ID的记录")
                
        except Exception as e:
            st.error(f"加载同步详情失败: {e}")
    else:
        st.info("请输入同步ID以查看详细审计信息")
        
        try:
            recent_syncs = st.session_state.sync_manager.get_sync_history(limit=10)
            if len(recent_syncs) > 0:
                st.markdown("**最近的同步ID:**")
                for sync_id in recent_syncs["sync_id"].unique().head(5).to_list():
                    st.code(sync_id, language=None)
        except:
            pass

with tab3:
    st.subheader("⚠️ 失败同步记录")
    
    hours = st.slider("查看最近多少小时", 1, 168, 24)
    
    try:
        failed_syncs = st.session_state.sync_manager.get_failed_syncs(last_hours=hours)
        
        if len(failed_syncs) > 0:
            st.error(f"检测到 {len(failed_syncs)} 个失败的同步任务")
            
            display_df = failed_syncs.select([
                "sync_id", "source_system", "error_message", "last_attempt_time"
            ]).rename({
                "sync_id": "同步ID",
                "source_system": "来源系统",
                "error_message": "错误信息",
                "last_attempt_time": "最后尝试时间"
            })
            
            st.dataframe(display_df.to_pandas(), use_container_width=True, hide_index=True)
            
            st.markdown("---")
            st.subheader("快速操作")
            
            failed_systems = failed_syncs["source_system"].unique().to_list()
            for system in failed_systems:
                col1, col2 = st.columns([3, 1])
                with col1:
                    st.warning(f"系统 {system} 存在失败同步")
                with col2:
                    if st.button(f"🔄 重试 {system}", key=f"retry_{system}"):
                        with st.spinner(f"正在重试同步 {system}..."):
                            try:
                                result = st.session_state.sync_manager.run_sync(system)
                                if result.get("success", False):
                                    st.success(f"✅ {system} 同步成功")
                                    st.rerun()
                                else:
                                    st.error(f"❌ 重试失败: {result.get('error', '未知错误')}")
                            except Exception as e:
                                st.error(f"重试失败: {e}")
        else:
            st.success(f"✅ 最近 {hours} 小时没有失败的同步任务")
            
    except Exception as e:
        st.error(f"加载失败同步记录失败: {e}")

st.markdown("---")

with st.expander("📚 同步节点说明"):
    st.markdown("""
    ### 就业表同步节点 (5个节点)
    1. **extract_source** - 从就业表系统提取原始数据
    2. **validate_schema** - 校验数据格式和完整性
    3. **deduplicate** - 去重处理
    4. **enrich_region** - 补全区域信息
    5. **load_to_database** - 加载到DuckDB数据仓库

    ### 直播平台同步节点 (6个节点)
    1. **extract_raw_logs** - 从直播平台提取观看日志
    2. **parse_timestamps** - 解析进入/离开时间戳
    3. **calculate_duration** - 计算观看时长和互动数据
    4. **validate_watch_quality** - 校验观看质量
    5. **aggregate_student_stats** - 按学生聚合统计数据
    6. **load_to_database** - 加载到DuckDB数据仓库

    ### 题库系统同步节点 (7个节点)
    1. **extract_attempts** - 从题库系统提取答题记录
    2. **detect_plagiarism** - 检测作业抄袭相似度
    3. **calculate_scores** - 计算得分和正确率
    4. **validate_scores** - 校验分数合理性
    5. **generate_plagiarism_samples** - 生成抄袭样本对
    6. **aggregate_exam_stats** - 聚合考试通过率统计
    7. **load_to_database** - 加载到DuckDB数据仓库
    """)
