extends Control

@onready var back_btn: Button = $TopBar/BackButton
@onready var overall_grid: GridContainer = $MainScroll/MainVBox/OverallPanel/OverallVBox/OverallGrid
@onready var level_stats_vbox: VBoxContainer = $MainScroll/MainVBox/LevelEffectivenessPanel/LevelStatsVBox
@onready var leaderboard_vbox: VBoxContainer = $MainScroll/MainVBox/LeaderboardPanel/LeaderboardVBox
@onready var wrong_reasons_vbox: VBoxContainer = $MainScroll/MainVBox/WrongReasonsPanel/WrongReasonsVBox
@onready var history_vbox: VBoxContainer = $MainScroll/MainVBox/HistoryPanel/HistoryVBox
@onready var lb_filter: OptionButton = $MainScroll/MainVBox/LeaderboardPanel/LeaderboardVBox/TopRow/FilterOption

var overall_stats: Dictionary = {}

func _ready() -> void:
	back_btn.pressed.connect(_on_back)
	lb_filter.add_item("全部关卡")
	lb_filter.set_item_metadata(0, "all")
	for level in DataLoader.levels:
		var idx: int = lb_filter.get_item_count()
		lb_filter.add_item(level.get("name", level["id"]))
		lb_filter.set_item_metadata(idx, level["id"])
	lb_filter.item_selected.connect(_on_lb_filter)
	_refresh_all()

func _refresh_all() -> void:
	overall_stats = StatsManager.get_overall_stats()
	_fill_overall()
	_fill_level_effectiveness()
	_fill_leaderboard("all")
	_fill_wrong_reasons()
	_fill_history()

func _fill_overall() -> void:
	for child in overall_grid.get_children():
		child.queue_free()

	var items: Array = [
		["🏆 总训练场次", str(overall_stats.get("total_sessions", 0))],
		["📋 总核销订单", str(overall_stats.get("total_orders", 0))],
		["✅ 正确核销", str(overall_stats.get("total_correct", 0))],
		["❌ 错误决策", str(overall_stats.get("total_wrong", 0))],
		["⚖️ 退票争议", str(overall_stats.get("total_disputes", 0))],
		["🎯 总体准确率", "%.1f%%" % (overall_stats.get("overall_accuracy", 0.0) * 100.0)],
		["💰 平均得分", "%.1f" % overall_stats.get("avg_score", 0.0)],
		["⏱ 平均处理时长", "%.1f 秒" % overall_stats.get("overall_avg_time", 0.0)]
	]

	for item in items:
		var k: Label = Label.new()
		k.text = item[0]
		k.add_theme_font_size_override("font_size", 16)
		k.add_theme_color_override("font_color", Color(0.7, 0.85, 1.0, 1))
		overall_grid.add_child(k)

		var v: Label = Label.new()
		v.text = item[1]
		v.add_theme_font_size_override("font_size", 16)
		overall_grid.add_child(v)

func _fill_level_effectiveness() -> void:
	for child in level_stats_vbox.get_children():
		if child.name != "Header":
			child.queue_free()

	var level_stats: Dictionary = overall_stats.get("level_stats", {})
	if level_stats.is_empty():
		var empty: Label = Label.new()
		empty.text = "暂无训练记录，开始训练后这里会显示各关卡的训练效果分析。"
		empty.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8, 1))
		level_stats_vbox.add_child(empty)
		return

	var sorted: Array = []
	for lvl_id in level_stats:
		var ls: Dictionary = level_stats[lvl_id]
		ls["level_id"] = lvl_id
		sorted.append(ls)
	sorted.sort_custom(func(a, b): return a.get("training_effectiveness", 0.0) > b.get("training_effectiveness", 0.0))

	for ls in sorted:
		var card: PanelContainer = PanelContainer.new()
		level_stats_vbox.add_child(card)

		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 20)
		card.add_child(hbox)

		var effect: float = ls.get("training_effectiveness", 0.0)
		var eff_color: Color = Color(0.4, 1.0, 0.4, 1) if effect >= 60.0 else (Color(1.0, 0.84, 0.0, 1) if effect >= 40.0 else Color(1.0, 0.5, 0.5, 1))

		var eff_box: VBoxContainer = VBoxContainer.new()
		eff_box.alignment = BoxContainer.ALIGNMENT_CENTER
		eff_box.custom_minimum_size = Vector2(100, 0)
		hbox.add_child(eff_box)

		var eff_lbl: Label = Label.new()
		eff_lbl.text = "%.0f" % effect
		eff_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		eff_lbl.add_theme_color_override("font_color", eff_color)
		eff_lbl.add_theme_font_size_override("font_size", 28)
		eff_box.add_child(eff_lbl)

		var eff_sub: Label = Label.new()
		eff_sub.text = "训练效果分"
		eff_sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		eff_sub.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8, 1))
		eff_sub.add_theme_font_size_override("font_size", 12)
		eff_box.add_child(eff_sub)

		var info_box: VBoxContainer = VBoxContainer.new()
		info_box.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		hbox.add_child(info_box)

		var name_lbl: Label = Label.new()
		name_lbl.text = ls.get("level_name", ls.get("level_id", ""))
		name_lbl.add_theme_font_size_override("font_size", 18)
		info_box.add_child(name_lbl)

		var detail_lbl: Label = Label.new()
		detail_lbl.text = "训练%d次 | 平均分:%.1f | 准确率:%.1f%% | 均时:%.1fs | 最佳:%d分" % [
			ls.get("count", 0),
			ls.get("avg_score", 0.0),
			ls.get("avg_accuracy", 0.0) * 100.0,
			ls.get("avg_time", 0.0),
			ls.get("best_score", 0)
		]
		detail_lbl.add_theme_color_override("font_color", Color(0.7, 0.8, 0.9, 1))
		detail_lbl.add_theme_font_size_override("font_size", 13)
		info_box.add_child(detail_lbl)

func _fill_leaderboard(level_id: String) -> void:
	for child in leaderboard_vbox.get_children():
		if child.name != "TopRow":
			child.queue_free()

	var entries: Array = StatsManager.get_leaderboard_for_level(level_id)
	if entries.is_empty():
		var empty: Label = Label.new()
		empty.text = "暂无排行记录，快来冲榜！"
		empty.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8, 1))
		empty.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		leaderboard_vbox.add_child(empty)
		return

	for i in range(entries.size()):
		var entry: Dictionary = entries[i]
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 15)
		leaderboard_vbox.add_child(hbox)

		var rank_icons: Array = ["🥇", "🥈", "🥉"]
		var rank_lbl: Label = Label.new()
		rank_lbl.text = rank_icons[i] if i < 3 else ("#%d" % (i + 1))
		rank_lbl.custom_minimum_size = Vector2(50, 0)
		rank_lbl.add_theme_font_size_override("font_size", 18)
		hbox.add_child(rank_lbl)

		var name_lbl: Label = Label.new()
		name_lbl.text = entry.get("player_name", "匿名")
		name_lbl.custom_minimum_size = Vector2(120, 0)
		name_lbl.add_theme_font_size_override("font_size", 16)
		hbox.add_child(name_lbl)

		var lvl_lbl: Label = Label.new()
		lvl_lbl.text = entry.get("level_name", "")
		lvl_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		lvl_lbl.add_theme_color_override("font_color", Color(0.6, 0.8, 1.0, 0.9))
		lvl_lbl.add_theme_font_size_override("font_size", 14)
		hbox.add_child(lvl_lbl)

		var acc_lbl: Label = Label.new()
		acc_lbl.text = "%.0f%%" % (entry.get("accuracy", 0.0) * 100.0)
		acc_lbl.custom_minimum_size = Vector2(60, 0)
		acc_lbl.add_theme_color_override("font_color", Color(0.4, 1.0, 0.6, 1))
		acc_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		hbox.add_child(acc_lbl)

		var time_lbl: Label = Label.new()
		time_lbl.text = "%.1fs" % entry.get("avg_processing_seconds", 0.0)
		time_lbl.custom_minimum_size = Vector2(70, 0)
		time_lbl.add_theme_color_override("font_color", Color(0.8, 0.9, 1.0, 0.9))
		time_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		hbox.add_child(time_lbl)

		var score_lbl: Label = Label.new()
		score_lbl.text = "%d 分" % entry.get("final_score", 0)
		score_lbl.custom_minimum_size = Vector2(90, 0)
		score_lbl.add_theme_color_override("font_color", Color(1, 0.84, 0, 1))
		score_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		score_lbl.add_theme_font_size_override("font_size", 18)
		hbox.add_child(score_lbl)

func _fill_wrong_reasons() -> void:
	for child in wrong_reasons_vbox.get_children():
		if child.name != "Header":
			child.queue_free()

	var reasons: Array = StatsManager.get_common_wrong_reasons(8)
	if reasons.is_empty():
		var empty: Label = Label.new()
		empty.text = "暂无错因记录。"
		empty.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8, 1))
		wrong_reasons_vbox.add_child(empty)
		return

	for item in reasons:
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 10)
		wrong_reasons_vbox.add_child(hbox)

		var count_lbl: Label = Label.new()
		count_lbl.text = "×%d" % item["count"]
		count_lbl.custom_minimum_size = Vector2(45, 0)
		count_lbl.add_theme_color_override("font_color", Color(1, 0.5, 0.5, 1))
		count_lbl.add_theme_font_size_override("font_size", 16)
		hbox.add_child(count_lbl)

		var reason_lbl: Label = Label.new()
		reason_lbl.text = item["reason"]
		reason_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		reason_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		reason_lbl.add_theme_font_size_override("font_size", 14)
		hbox.add_child(reason_lbl)

func _fill_history() -> void:
	for child in history_vbox.get_children():
		if child.name != "Header":
			child.queue_free()

	var history: Array = overall_stats.get("session_history", [])
	if history.is_empty():
		var empty: Label = Label.new()
		empty.text = "暂无历史记录。"
		empty.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8, 1))
		history_vbox.add_child(empty)
		return

	var recent: Array = history.slice(0, min(10, history.size()))
	for session in recent:
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 15)
		history_vbox.add_child(hbox)

		var time_lbl: Label = Label.new()
		time_lbl.text = str(session.get("timestamp", ""))[5:16]
		time_lbl.custom_minimum_size = Vector2(110, 0)
		time_lbl.add_theme_color_override("font_color", Color(0.6, 0.7, 0.8, 1))
		time_lbl.add_theme_font_size_override("font_size", 13)
		hbox.add_child(time_lbl)

		var name_lbl: Label = Label.new()
		name_lbl.text = session.get("level_name", "")
		name_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		name_lbl.add_theme_font_size_override("font_size", 14)
		hbox.add_child(name_lbl)

		var pass_icon: String = "✅" if session.get("passed", false) else "❌"
		var pass_lbl: Label = Label.new()
		pass_lbl.text = pass_icon
		pass_lbl.custom_minimum_size = Vector2(30, 0)
		hbox.add_child(pass_lbl)

		var score_lbl: Label = Label.new()
		score_lbl.text = "%d分" % session.get("final_score", 0)
		score_lbl.custom_minimum_size = Vector2(65, 0)
		score_lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		score_lbl.add_theme_color_override("font_color", Color(1, 0.84, 0, 1))
		score_lbl.add_theme_font_size_override("font_size", 15)
		hbox.add_child(score_lbl)

func _on_lb_filter(index: int) -> void:
	var level_id = lb_filter.get_item_metadata(index)
	if level_id == null:
		level_id = "all"
	_fill_leaderboard(str(level_id))

func _on_back() -> void:
	GameManager.go_to_main_menu()
