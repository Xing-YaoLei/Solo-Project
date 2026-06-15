st.header("🔧 数据初始化")
st.markdown("---")

st.warning("⚠️ 此操作将生成模拟数据并重置数据库。请确保在测试环境中使用。")

col1, col2 = st.columns(2)

with col1:
    days = st.slider("生成历史数据天数", 30, 365, 90)
    st.info(f"将生成从 {datetime.now() - timedelta(days=days):%Y-%m-%d} 到 {datetime.now():%Y-%m-%d} 的数据")

with col2:
    data_types = st.multiselect(
        "选择生成的数据类型",
        [
            ("employment", "📋 就业表数据 (200条)"),
            ("live_platform", "📺 直播平台数据 (500条)"),
            ("question_bank", "📝 题库系统数据 (1000条)"),
            ("transactions", "💰 账户流水数据 (300条)"),
            ("level_changes", "📈 等级变化数据 (150条)"),
            ("redemption", "🎁 核销记录数据 (100条)"),
            ("refund", "💸 退款记录数据 (80条)")
        ],
        default=[
            ("employment", "📋 就业表数据 (200条)"),
            ("live_platform", "📺 直播平台数据 (500条)"),
            ("question_bank", "📝 题库系统数据 (1000条)"),
            ("transactions", "💰 账户流水数据 (300条)"),
            ("level_changes", "📈 等级变化数据 (150条)"),
            ("redemption", "🎁 核销记录数据 (100条)"),
            ("refund", "💸 退款记录数据 (80条)")
        ],
        format_func=lambda x: x[1]
    )

selected_types = [dt[0] for dt in data_types]

col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🗑️ 清空现有数据", type="secondary", use_container_width=True):
        confirm = st.checkbox("确认清空所有数据？此操作不可恢复", value=False)
        if confirm:
            with st.spinner("正在清空数据..."):
                try:
                    tables = [
                        "employment_records",
                        "live_platform_logs",
                        "question_bank_records",
                        "account_transactions",
                        "level_changes",
                        "redemption_records",
                        "refund_records",
                        "plagiarism_samples",
                        "exam_pass_rates",
                        "sync_audit_log"
                    ]
                    
                    for table in tables:
                        st.session_state.db_client.execute_query(f"DELETE FROM {table}")
                    
                    st.success("✅ 所有数据已清空")
                    st.session_state.data_initialized = False
                    st.rerun()
                except Exception as e:
                    st.error(f"清空数据失败: {e}")

with col2:
    if st.button("🎲 生成模拟数据", type="primary", use_container_width=True):
        with st.spinner("正在生成模拟数据..."):
            try:
                generator = MockDataGenerator(st.session_state.db_client)
                results = generator.generate_all_data(days=days)
                
                st.success(f"✅ 数据生成完成！")
                
                summary_df = pl.DataFrame([
                    {"数据类型": k, "记录数": len(v)} 
                    for k, v in results.items() 
                    if k in selected_types
                ])
                
                st.dataframe(summary_df.to_pandas(), use_container_width=True, hide_index=True)
                
                st.session_state.data_initialized = True
                
            except Exception as e:
                st.error(f"生成数据失败: {e}")

with col3:
    if st.button("🔄 运行同步任务", use_container_width=True):
        with st.spinner("正在运行同步任务..."):
            try:
                results = st.session_state.sync_manager.run_all_syncs()
                success_count = sum(1 for r in results.values() if r.get("success", False))
                st.success(f"✅ 同步完成！成功 {success_count}/{len(results)} 个系统")
            except Exception as e:
                st.error(f"同步失败: {e}")

st.markdown("---")

st.subheader("📊 数据状态概览")

try:
    table_counts = {}
    tables = [
        ("employment_records", "就业表"),
        ("live_platform_logs", "直播平台日志"),
        ("question_bank_records", "题库记录"),
        ("account_transactions", "账户流水"),
        ("level_changes", "等级变化"),
        ("redemption_records", "核销记录"),
        ("refund_records", "退款记录"),
        ("plagiarism_samples", "抄袭样本"),
        ("exam_pass_rates", "考试通过率"),
        ("sync_audit_log", "同步审计日志")
    ]
    
    for table_name, display_name in tables:
        try:
            count_df = st.session_state.db_client.query_to_polars(
                f"SELECT COUNT(*) as cnt FROM {table_name}"
            )
            table_counts[display_name] = count_df["cnt"][0]
        except:
            table_counts[display_name] = 0
    
    status_df = pl.DataFrame([
        {"数据表": name, "记录数": count, 
         "状态": "✅ 有数据" if count > 0 else "❌ 无数据"}
        for name, count in table_counts.items()
    ])
    
    st.dataframe(status_df.to_pandas(), use_container_width=True, hide_index=True)
    
    total_records = sum(table_counts.values())
    tables_with_data = sum(1 for c in table_counts.values() if c > 0)
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("总记录数", f"{total_records:,}")
    with col2:
        st.metric("已填充数据表", f"{tables_with_data}/{len(tables)}")
    with col3:
        data_health = (tables_with_data / len(tables) * 100) if len(tables) > 0 else 0
        st.metric("数据完整度", f"{data_health:.1f}%")
    
    if tables_with_data == len(tables):
        st.success("🎉 所有数据表已填充，可以开始使用系统了！")
        st.balloons()
    elif tables_with_data > 0:
        st.warning(f"还有 {len(tables) - tables_with_data} 个数据表为空，建议生成完整数据")
    else:
        st.info("请先生成模拟数据")

except Exception as e:
    st.error(f"加载数据状态失败: {e}")

st.markdown("---")

with st.expander("📚 使用说明"):
    st.markdown("""
    ## 快速开始指南

    ### 1. 初始化数据
    1. 选择要生成的历史数据天数（建议90天以上）
    2. 选择需要生成的数据类型（建议全选）
    3. 点击「生成模拟数据」按钮
    4. 等待数据生成完成

    ### 2. 运行同步任务
    1. 点击「运行同步任务」按钮
    2. 系统将自动运行所有数据源的同步任务
    3. 每个同步任务包含多个可审计的节点
    4. 同步完成后可以在「数据同步管理」页面查看详细审计

    ### 3. 开始使用各功能模块
    - **风险监测总览**：查看综合风险指数和各区域风险分布
    - **作业抄袭检测**：查看抄袭样本，审核疑似抄袭记录
    - **考试通过率分析**：按日期、区域、科目分析通过率
    - **账户流水与等级变化**：查看同环比分析，数据缺口已染色
    - **核销与退款分析**：查看核销记录和退款原因解释口径

    ### 4. 数据同步节点审计
    每个数据源的同步都拆分为多个可审计的节点：
    - 每个节点记录开始/结束时间
    - 记录处理的记录数
    - 记录源数据和目标数据的哈希值用于校验
    - 任何错误都会被详细记录
    - 可以按同步ID追溯完整的同步过程

    ### 注意事项
    - 数据缺口记录会用红色高亮显示，避免被平均值掩盖
    - 等级下降、抄袭、退款等异常都会被单独检测
    - 同环比分析支持按月度进行对比
    - 核销记录支持跳转到明细页面
    """)
