extends Control

const TASK_TYPE_NAMES: Dictionary = {
	0: "影像",
	1: "计费",
	2: "病历",
}

const ERROR_CATEGORY_NAMES: Dictionary = {
	0: "影像误判",
	1: "收费错误",
	2: "档案误读",
	3: "爽约漏判",
	4: "调度失误",
}

@onready var replay_list: VBoxContainer = %ReplayList
@onready var playback_steps: VBoxContainer = %PlaybackSteps
@onready var play_button: Button = %PlayButton
@onready var hesitation_label: Label = %HesitationLabel
@onready var back_button: Button = %BackButton
@onready var error_type_label: Label = %ErrorTypeLabel

var _all_replays: Array = []
var _selected_index: int = -1
var _is_playing: bool = false
var _play_step: int = 0
var _play_timer: float = 0.0

func _ready() -> void:
	play_button.pressed.connect(_on_play_pressed)
	back_button.pressed.connect(_on_back_pressed)
	ReplayManager.replay_list_changed.connect(_refresh_list)
	_refresh_list()

func _refresh_list() -> void:
	for child in replay_list.get_children():
		child.queue_free()
	
	var record_replays: Array = ReplayManager.get_record_replays()
	var general_replays: Array = ReplayManager.get_general_replays()
	_all_replays.clear()
	_all_replays.append_array(record_replays)
	_all_replays.append_array(general_replays)
	
	if _all_replays.is_empty():
		var label = Label.new()
		label.text = "暂无回放记录"
		label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		replay_list.add_child(label)
		_clear_playback()
		return
	
	if record_replays.size() > 0:
		var section_label = Label.new()
		section_label.text = "— 档案错误 —"
		section_label.add_theme_color_override("font_color", Color(0.7, 0.5, 0.95))
		section_label.add_theme_font_size_override("font_size", 14)
		replay_list.add_child(section_label)
	
	for i in record_replays.size():
		var replay: Dictionary = record_replays[i]
		var btn = Button.new()
		btn.text = "%s 📋 %s" % [replay.get("patient_id", "未知"), _format_short_time(replay.get("timestamp", ""))]
		btn.custom_minimum_size.y = 40
		btn.add_theme_color_override("font_color", Color(0.85, 0.7, 1.0))
		var idx = i
		btn.pressed.connect(_on_replay_selected.bind(idx))
		replay_list.add_child(btn)
	
	if general_replays.size() > 0:
		var section_label = Label.new()
		section_label.text = "— 其他错误 —"
		section_label.add_theme_color_override("font_color", Color(0.5, 0.6, 0.7))
		section_label.add_theme_font_size_override("font_size", 14)
		replay_list.add_child(section_label)
	
	for i in general_replays.size():
		var replay: Dictionary = general_replays[i]
		var btn = Button.new()
		btn.text = "%s  %s" % [replay.get("patient_id", "未知"), _format_short_time(replay.get("timestamp", ""))]
		btn.custom_minimum_size.y = 40
		var idx = record_replays.size() + i
		btn.pressed.connect(_on_replay_selected.bind(idx))
		replay_list.add_child(btn)

func _format_short_time(timestamp: String) -> String:
	if timestamp.size() > 10:
		return timestamp.substr(11, 5)
	return timestamp

func _on_replay_selected(index: int) -> void:
	_stop_playback()
	_selected_index = index
	_show_playback(index)

func _show_playback(index: int) -> void:
	for child in playback_steps.get_children():
		child.queue_free()
	if index < 0 or index >= _all_replays.size():
		hesitation_label.text = ""
		error_type_label.text = ""
		return
	var replay: Dictionary = _all_replays[index]
	var steps: Array = replay.get("playback_data", [])
	var hesitations: Array = replay.get("hesitation_points", [])
	var error_cat: int = replay.get("error_category", -1)
	var error_details: String = replay.get("error_details", "")
	var is_record: bool = replay.get("is_record_error", false)
	
	error_type_label.text = "%s: %s" % [
		"[档案]" if is_record else "",
		ERROR_CATEGORY_NAMES.get(error_cat, "未知"),
	]
	if is_record:
		error_type_label.add_theme_color_override("font_color", Color(0.85, 0.7, 1.0))
	else:
		error_type_label.add_theme_color_override("font_color", Color(0.7, 0.8, 0.9))
	
	var hesitation_count = 0
	for i in steps.size():
		var step: Dictionary = steps[i]
		var is_hesitation: bool = step.get("hesitation", false)
		var resp_time: float = step.get("response_time", 0.0)
		if is_hesitation:
			hesitation_count += 1
		var row = HBoxContainer.new()
		row.add_theme_constant_override("separation", 12)

		var marker = ColorRect.new()
		marker.custom_minimum_size = Vector2(4, 24)
		marker.color = Color(1.0, 0.9, 0.2) if is_hesitation else Color(0.3, 0.3, 0.3)
		row.add_child(marker)

		var task_label = Label.new()
		task_label.text = TASK_TYPE_NAMES.get(step.get("task_type", -1), "未知")
		task_label.custom_minimum_size.x = 60
		task_label.add_theme_color_override("font_color", Color(0.85, 0.9, 1.0))
		row.add_child(task_label)

		var result_label = Label.new()
		result_label.text = "✓" if step.get("correct", true) else "✗"
		result_label.custom_minimum_size.x = 30
		result_label.add_theme_color_override("font_color", Color(0.4, 1.0, 0.4) if step.get("correct", true) else Color(1.0, 0.3, 0.3))
		row.add_child(result_label)

		var resp_label = Label.new()
		resp_label.text = "%.1fs" % resp_time
		resp_label.custom_minimum_size.x = 60
		resp_label.add_theme_color_override("font_color", Color(1.0, 0.9, 0.2) if is_hesitation else Color(0.6, 0.7, 0.8))
		row.add_child(resp_label)

		var time_label = Label.new()
		time_label.text = "累计 %.1fs" % step.get("elapsed", 0.0)
		time_label.add_theme_color_override("font_color", Color(0.5, 0.6, 0.7))
		row.add_child(time_label)

		if is_hesitation:
			var hes_label = Label.new()
			var real_resp = _get_real_response_time(steps, hesitations, i)
			hes_label.text = "犹豫 %.2fs" % real_resp
			hes_label.add_theme_color_override("font_color", Color(1.0, 0.85, 0.3))
			hes_label.add_theme_font_size_override("font_size", 14)
			row.add_child(hes_label)

		playback_steps.add_child(row)

	hesitation_label.text = "犹豫点: %d / %d 步  ·  详情: %s" % [hesitation_count, steps.size(), error_details]
	play_button.disabled = false

func _get_real_response_time(steps: Array, hesitations: Array, step_index: int) -> float:
	if step_index < steps.size():
		return steps[step_index].get("response_time", 0.0)
	return 0.0

func _on_play_pressed() -> void:
	if _selected_index < 0 or _selected_index >= _all_replays.size():
		return
	if _is_playing:
		_stop_playback()
		return
	_is_playing = true
	_play_step = 0
	_play_timer = 0.0
	play_button.text = "停止"
	for child in playback_steps.get_children():
		child.modulate.a = 0.2
	if playback_steps.get_child_count() > 0:
		playback_steps.get_child(0).modulate.a = 1.0

func _stop_playback() -> void:
	_is_playing = false
	_play_step = 0
	play_button.text = "自动播放"
	for child in playback_steps.get_children():
		child.modulate.a = 1.0

func _process(delta: float) -> void:
	if not _is_playing:
		return
	_play_timer += delta
	if _play_timer >= 1.5:
		_play_timer = 0.0
		_play_step += 1
		if _play_step >= playback_steps.get_child_count():
			_stop_playback()
			return
		for child in playback_steps.get_children():
			child.modulate.a = 0.2
		playback_steps.get_child(_play_step).modulate.a = 1.0

func _clear_playback() -> void:
	for child in playback_steps.get_children():
		child.queue_free()
	hesitation_label.text = ""
	error_type_label.text = ""
	play_button.disabled = true
	_selected_index = -1

func _on_back_pressed() -> void:
	_stop_playback()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
