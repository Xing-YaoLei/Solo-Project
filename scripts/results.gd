extends Control

@onready var result_title: Label = $CenterContainer/VBox/ResultTitle
@onready var score_label: Label = $CenterContainer/VBox/ScoreLabel
@onready var score_breakdown: Label = $CenterContainer/VBox/ScoreBreakdown
@onready var stats_grid: GridContainer = $CenterContainer/VBox/StatsGrid
@onready var wrong_reasons_vbox: VBoxContainer = $CenterContainer/VBox/WrongReasonsPanel/WrongReasonsVBox
@onready var disputes_vbox: VBoxContainer = $CenterContainer/VBox/DisputesPanel/DisputesVBox
@onready var retry_btn: Button = $CenterContainer/VBox/ButtonRow/RetryButton
@onready var select_btn: Button = $CenterContainer/VBox/ButtonRow/LevelSelectButton
@onready var menu_btn: Button = $CenterContainer/VBox/ButtonRow/MenuButton

var result: Dictionary = {}

func _ready() -> void:
	retry_btn.pressed.connect(_on_retry)
	select_btn.pressed.connect(_on_level_select)
	menu_btn.pressed.connect(_on_main_menu)
	result = ScoreManager.current_session_result
	_populate_results()

func _populate_results() -> void:
	var passed: bool = result.get("passed", false)
	var final_score: int = result.get("final_score", 0)
	var level_name: String = result.get("level_name", "未知关卡")

	if passed:
		result_title.text = "🎉 训练通过: %s" % level_name
		result_title.add_theme_color_override("font_color", Color(0.4, 1, 0.4, 1))
	else:
		result_title.text = "💪 训练未通过: %s" % level_name
		result_title.add_theme_color_override("font_color", Color(1, 0.5, 0.5, 1))

	score_label.text = "%d 分" % final_score

	var base: int = result.get("base_score", 0)
	var bonus: int = result.get("efficiency_bonus", 0)
	score_breakdown.text = "基础分: %d  |  效率加成: +%d" % [base, bonus]

	_fill_stats_grid()
	_fill_wrong_reasons()
	_fill_disputes()

func _fill_stats_grid() -> void:
	for child in stats_grid.get_children():
		child.queue_free()

	var stats_items: Array = [
		["📋 处理订单数", str(result.get("total_orders", 0))],
		["✅ 正确核销", "%d (%.1f%%)" % [result.get("correct_count", 0), result.get("accuracy", 0.0) * 100.0]],
		["❌ 错误决策", str(result.get("wrong_count", 0))],
		["⚠️ 升级处理", str(result.get("upgraded_count", 0))],
		["⚖️ 退票争议", str(result.get("disputed_count", 0))],
		["⏱ 平均处理时长", "%.1f 秒" % result.get("avg_processing_seconds", 0.0)]
	]

	for item in stats_items:
		var key_label: Label = Label.new()
		key_label.text = item[0]
		key_label.add_theme_font_size_override("font_size", 16)
		key_label.add_theme_color_override("font_color", Color(0.7, 0.85, 1.0, 1))
		stats_grid.add_child(key_label)

		var val_label: Label = Label.new()
		val_label.text = item[1]
		val_label.add_theme_font_size_override("font_size", 16)
		stats_grid.add_child(val_label)

func _fill_wrong_reasons() -> void:
	for child in wrong_reasons_vbox.get_children():
		child.queue_free()

	var reasons: Array = result.get("wrong_reasons", [])
	if reasons.size() == 0:
		var lbl: Label = Label.new()
		lbl.text = "🌟 本次训练没有错误决策，表现优秀！"
		lbl.add_theme_color_override("font_color", Color(0.4, 1, 0.4, 1))
		wrong_reasons_vbox.add_child(lbl)
		return

	var reason_counts: Dictionary = {}
	for r in reasons:
		if not reason_counts.has(r):
			reason_counts[r] = 0
		reason_counts[r] += 1

	var sorted: Array = []
	for r in reason_counts:
		sorted.append({"reason": r, "count": reason_counts[r]})
	sorted.sort_custom(func(a, b): return a["count"] > b["count"])

	for item in sorted:
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 10)

		var icon: Label = Label.new()
		icon.text = "❌"
		icon.add_theme_font_size_override("font_size", 16)
		hbox.add_child(icon)

		var reason_lbl: Label = Label.new()
		reason_lbl.text = item["reason"]
		reason_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		reason_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		reason_lbl.add_theme_font_size_override("font_size", 15)
		hbox.add_child(reason_lbl)

		var count_lbl: Label = Label.new()
		count_lbl.text = "×%d" % item["count"]
		count_lbl.add_theme_color_override("font_color", Color(1, 0.6, 0.6, 1))
		count_lbl.add_theme_font_size_override("font_size", 16)
		hbox.add_child(count_lbl)

		wrong_reasons_vbox.add_child(hbox)

func _fill_disputes() -> void:
	for child in disputes_vbox.get_children():
		child.queue_free()

	var disputes: Array = result.get("dispute_records", [])
	if disputes.size() == 0:
		var lbl: Label = Label.new()
		lbl.text = "✅ 无退票争议触发"
		lbl.add_theme_color_override("font_color", Color(0.4, 1, 0.4, 1))
		disputes_vbox.add_child(lbl)
		return

	for d in disputes:
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 10)

		var icon: Label = Label.new()
		icon.text = "⚖️"
		icon.add_theme_font_size_override("font_size", 16)
		hbox.add_child(icon)

		var reason_lbl: Label = Label.new()
		reason_lbl.text = "%s - %s" % [d.get("order_id", ""), d.get("reason", "")]
		reason_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		reason_lbl.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		reason_lbl.add_theme_font_size_override("font_size", 14)
		reason_lbl.add_theme_color_override("font_color", Color(1, 0.6, 0.3, 1))
		hbox.add_child(reason_lbl)

		disputes_vbox.add_child(hbox)

func _on_retry() -> void:
	GameManager.start_level(result.get("level_id", ""))

func _on_level_select() -> void:
	GameManager.go_to_level_select()

func _on_main_menu() -> void:
	GameManager.go_to_main_menu()
