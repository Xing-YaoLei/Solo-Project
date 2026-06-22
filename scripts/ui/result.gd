extends Control

@onready var level_title_label: Label = $VBoxContainer/Header/LevelTitleLabel
@onready var score_label: Label = $VBoxContainer/Header/ScoreLabel
@onready var score_detail_label: RichTextLabel = $VBoxContainer/ScoreSection/ScoreDetailLabel
@onready var error_container: VBoxContainer = $VBoxContainer/ErrorSection/ScrollContainer/ErrorContainer
@onready var rejection_container: VBoxContainer = $VBoxContainer/RejectionSection/ScrollContainer/RejectionContainer
@onready var stuck_summary_label: RichTextLabel = $VBoxContainer/StuckSection/StuckSummaryLabel
@onready var replay_info_label: Label = $VBoxContainer/ActionSection/ReplayInfoLabel
@onready var retry_button: Button = $VBoxContainer/ActionSection/RetryButton
@onready var review_button: Button = $VBoxContainer/ActionSection/ReviewButton
@onready var back_button: Button = $VBoxContainer/ActionSection/BackButton
@onready var risk_label: Label = $VBoxContainer/RiskSection/RiskLabel

var _result_data: Dictionary = {}

func _ready() -> void:
	retry_button.pressed.connect(_on_retry_pressed)
	review_button.pressed.connect(_on_review_pressed)
	back_button.pressed.connect(_on_back_pressed)
	_load_result_data()

func _load_result_data() -> void:
	_result_data = GameManager.get_meta("last_result") if GameManager.has_meta("last_result") else {}
	if _result_data.is_empty():
		var save_data: Dictionary = SaveManager.load_game(0)
		_result_data = save_data.get("result_data", {})
	if _result_data.is_empty():
		return
	_populate_ui()

func _populate_ui() -> void:
	level_title_label.text = _result_data.get("level_title", "未知关卡")
	var total_score: int = _result_data.get("total_score", 0)
	score_label.text = "总分: %d" % total_score
	var time_remaining: float = _result_data.get("time_remaining", 0.0)
	var time_limit: float = _result_data.get("time_limit", 120.0)
	var time_used: float = time_limit - time_remaining
	var minutes: int = int(time_used) / 60
	var seconds: int = int(time_used) % 60
	score_detail_label.text = (
		"完成时间: %02d:%02d / %02d:%02d\n" % [minutes, seconds, int(time_limit) / 60, int(time_limit) % 60] +
		"任务数: %d\n" % _result_data.get("task_count", 0) +
		"风险词识别: %d/%d" % [_result_data.get("risk_identified", 0), _result_data.get("risk_total", 0)]
	)
	var errors: Array = _result_data.get("errors", [])
	for child in error_container.get_children():
		child.queue_free()
	if errors.is_empty():
		var label := Label.new()
		label.text = "无错误"
		label.add_theme_color_override("font_color", Color(0.3, 0.9, 0.3))
		error_container.add_child(label)
	else:
		for err in errors:
			var label := Label.new()
			var error_type: String = err.get("error_type", "")
			var feedback: String = err.get("feedback", "")
			var severity_color: Color
			match error_type:
				"critical":
					severity_color = Color(1.0, 0.3, 0.3)
				"category_mismatch":
					severity_color = Color(1.0, 0.7, 0.3)
				"timeout":
					severity_color = Color(0.8, 0.4, 0.8)
				_:
					severity_color = Color(0.9, 0.9, 0.4)
			label.text = "[%s] %s" % [error_type, feedback]
			label.add_theme_color_override("font_color", severity_color)
			label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			label.custom_minimum_size.x = 500
			error_container.add_child(label)
	var rejections: Array = _result_data.get("rejections", [])
	for child in rejection_container.get_children():
		child.queue_free()
	if rejections.is_empty():
		var label := Label.new()
		label.text = "无审核退回"
		label.add_theme_color_override("font_color", Color(0.3, 0.9, 0.3))
		rejection_container.add_child(label)
	else:
		for rej in rejections:
			var label := Label.new()
			label.text = "⚠ 退回原因: %s" % rej.get("reason", "未知")
			label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
			label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
			label.custom_minimum_size.x = 500
			rejection_container.add_child(label)
	var stuck_summary: Dictionary = _result_data.get("stuck_summary", {})
	var stuck_count: int = stuck_summary.get("total_stuck_count", 0)
	var stuck_duration: float = stuck_summary.get("total_stuck_duration", 0.0)
	var longest: Dictionary = stuck_summary.get("longest_stuck", {})
	var longest_ctx: String = longest.get("context", "无")
	var longest_dur: float = longest.get("duration", 0.0)
	stuck_summary_label.text = (
		"卡顿次数: %d | 总卡顿时长: %.1f秒\n" % [stuck_count, stuck_duration] +
		"最长卡顿: %s (%.1f秒)" % [longest_ctx, longest_dur]
	)
	var level_id: String = _result_data.get("level_id", "")
	var replay_count: int = SaveManager.get_replay_count(level_id)
	var can_replay: bool = SaveManager.can_replay(level_id)
	replay_info_label.text = "失败回放: %d/3 | %s" % [replay_count, "可继续回放" if can_replay else "已达上限"]
	review_button.disabled = replay_count == 0
	var has_errors: bool = not errors.is_empty()
	retry_button.visible = has_errors
	var risk_identified: int = _result_data.get("risk_identified", 0)
	var risk_total: int = _result_data.get("risk_total", 0)
	if risk_total > 0:
		risk_label.text = "风险词命中: %d/%d" % [risk_identified, risk_total]
		risk_label.visible = true
	else:
		risk_label.visible = false

func _on_retry_pressed() -> void:
	var level_id: String = _result_data.get("level_id", "")
	if level_id != "":
		LevelManager.load_level(level_id)
		GameManager.start_level(level_id)
		get_tree().change_scene_to_file("res://scenes/gameplay.tscn")

func _on_review_pressed() -> void:
	GameManager.set_meta("review_level_id", _result_data.get("level_id", ""))
	get_tree().change_scene_to_file("res://scenes/review.tscn")

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/level_select.tscn")
