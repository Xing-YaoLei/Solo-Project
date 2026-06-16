extends Control

var _error_meta: Dictionary = {}

@onready var completed_label: Label = %CompletedLabel
@onready var no_show_label: Label = %NoShowLabel
@onready var error_count_label: Label = %ErrorCountLabel
@onready var revisit_rate_label: Label = %RevisitRateLabel
@onready var time_label: Label = %TimeLabel
@onready var error_breakdown: VBoxContainer = %ErrorBreakdown
@onready var record_error_detail: VBoxContainer = %RecordErrorDetail
@onready var back_button: Button = %BackButton
@onready var replay_button: Button = %ReplayButton
@onready var retry_button: Button = %RetryButton

func _ready() -> void:
	_error_meta = {
		GameData.ErrorCategory.IMAGING_MISMATCH: {"label": "影像误判", "color": Color.ORANGE},
		GameData.ErrorCategory.BILLING_ERROR: {"label": "收费错误", "color": Color.RED},
		GameData.ErrorCategory.RECORD_MISREAD: {"label": "档案误读", "color": Color(0.627, 0.125, 0.941)},
		GameData.ErrorCategory.MISSED_NO_SHOW: {"label": "爽约漏判", "color": Color(0.545, 0.0, 0.0)},
		GameData.ErrorCategory.SCHEDULING_ERROR: {"label": "调度失误", "color": Color.GRAY},
	}
	back_button.pressed.connect(_on_back_pressed)
	replay_button.pressed.connect(_on_replay_pressed)
	retry_button.pressed.connect(_on_retry_pressed)
	_populate_summary()

func _populate_summary() -> void:
	var summary := GameData.get_round_summary()
	completed_label.text = "完成: %d" % summary.get("patients_completed", 0)
	no_show_label.text = "爽约: %d" % summary.get("patients_no_show", 0)
	error_count_label.text = "失误: %d" % summary.get("total_errors", 0)
	revisit_rate_label.text = "复诊率: %.0f%%" % (summary.get("revisit_rate", 0.0) * 100.0)
	time_label.text = "用时: %s" % _format_time(summary.get("elapsed_time", 0.0))
	_populate_error_breakdown(summary)
	_populate_record_errors(summary)

func _populate_error_breakdown(summary: Dictionary) -> void:
	for child in error_breakdown.get_children():
		child.queue_free()
	var cats: Dictionary = summary.get("error_categories", {})
	for category_key in cats:
		var count: int = cats[category_key]
		if count == 0:
			continue
		var meta: Dictionary = _error_meta.get(category_key, {"label": "未知", "color": Color.WHITE})
		var row := HBoxContainer.new()
		var indicator := ColorRect.new()
		indicator.custom_minimum_size = Vector2(16, 16)
		indicator.size_flags_vertical = Control.SIZE_FLAG_SHRINK_CENTER
		indicator.color = meta["color"]
		var label := Label.new()
		label.text = "%s: %d" % [meta["label"], count]
		label.add_theme_color_override("font_color", Color.WHITE)
		label.add_theme_font_size_override("font_size", 18)
		row.add_child(indicator)
		row.add_child(label)
		error_breakdown.add_child(row)

func _populate_record_errors(summary: Dictionary) -> void:
	for child in record_error_detail.get_children():
		child.queue_free()
	var cats: Dictionary = summary.get("error_categories", {})
	var record_cats := [
		GameData.ErrorCategory.RECORD_MISREAD,
		GameData.ErrorCategory.MISSED_NO_SHOW,
	]
	for cat in record_cats:
		var count: int = cats.get(cat, 0)
		if count == 0:
			continue
		var meta: Dictionary = _error_meta.get(cat, {"label": "未知", "color": Color.WHITE})
		var panel := PanelContainer.new()
		var vbox := VBoxContainer.new()
		var title := Label.new()
		title.text = meta["label"]
		title.add_theme_color_override("font_color", meta["color"])
		title.add_theme_font_size_override("font_size", 20)
		var detail := Label.new()
		detail.text = "共 %d 次相关错误" % count
		detail.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
		detail.add_theme_font_size_override("font_size", 16)
		vbox.add_child(title)
		vbox.add_child(detail)
		panel.add_child(vbox)
		record_error_detail.add_child(panel)

func _format_time(seconds: float) -> String:
	var mins := int(seconds) / 60
	var secs := int(seconds) % 60
	return "%d:%02d" % [mins, secs]

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _on_replay_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/replay_viewer.tscn")

func _on_retry_pressed() -> void:
	GameData.start_round()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
