extends Control

@onready var revisit_rate_label: Label = %RevisitRateLabel
@onready var rounds_label: Label = %RoundsLabel
@onready var trend_container: VBoxContainer = %TrendContainer
@onready var error_container: VBoxContainer = %ErrorContainer
@onready var back_button: Button = %BackButton

const ERROR_CATEGORY_NAMES: Dictionary = {
	0: "影像不匹配",
	1: "计费错误",
	2: "病历误读",
	3: "漏诊爽约",
	4: "调度错误",
}

func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)
	StatsManager.stats_updated.connect(_refresh)
	_refresh()

func _refresh() -> void:
	var summary: Dictionary = StatsManager.get_stats_summary()
	var rate: float = summary.get("overall_revisit_rate", 0.0)
	var total_rounds: int = summary.get("total_rounds", 0)
	revisit_rate_label.text = "复诊率: %.1f%%" % (rate * 100.0)
	rounds_label.text = "已完成回合: %d" % total_rounds
	_populate_trend(summary.get("revisit_rate_trend", []))
	_populate_errors(summary.get("error_breakdown", {}))

func _populate_trend(trend: Array) -> void:
	for child in trend_container.get_children():
		child.queue_free()
	var count = trend.size()
	var start = maxi(0, count - 10)
	for i in range(start, count):
		var round_num = i + 1
		var label = Label.new()
		label.text = "第%d回合: %.1f%%" % [round_num, trend[i] * 100.0]
		label.add_theme_color_override("font_color", Color(0.75, 0.85, 1.0))
		trend_container.add_child(label)
	if trend.is_empty():
		var empty = Label.new()
		empty.text = "暂无数据"
		empty.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		trend_container.add_child(empty)

func _populate_errors(breakdown: Dictionary) -> void:
	for child in error_container.get_children():
		child.queue_free()
	if breakdown.is_empty():
		var empty = Label.new()
		empty.text = "暂无错误记录"
		empty.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		error_container.add_child(empty)
		return
	var total_errors = 0
	for key in breakdown:
		total_errors += breakdown[key]
	for key in breakdown:
		var count: int = breakdown[key]
		var category_name = ERROR_CATEGORY_NAMES.get(key, "未知(%s)" % str(key))
		var pct = (float(count) / float(total_errors)) * 100.0 if total_errors > 0 else 0.0
		var label = Label.new()
		label.text = "%s: %d次 (%.1f%%)" % [category_name, count, pct]
		label.add_theme_color_override("font_color", Color(1.0, 0.7, 0.7))
		error_container.add_child(label)

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
