extends Control

@onready var history_list: VBoxContainer = $LeftPanel/HistoryList
@onready var profile_fail_list: VBoxContainer = $LeftPanel/ProfileFailList
@onready var slow_steps_text: RichTextLabel = $LeftPanel/SlowStepsText
@onready var replay_title: Label = $RightPanel/ReplayTitle
@onready var prev_btn: Button = $RightPanel/PlaybackControls/PrevBtn
@onready var play_btn: Button = $RightPanel/PlaybackControls/PlayBtn
@onready var stop_btn: Button = $RightPanel/PlaybackControls/StopBtn
@onready var next_btn: Button = $RightPanel/PlaybackControls/NextBtn
@onready var step_index_label: Label = $RightPanel/PlaybackControls/StepIndexLabel
@onready var replay_content: RichTextLabel = $RightPanel/ReplayContent
@onready var back_btn: Button = $BackBtn

var current_mistakes: Array[Dictionary] = []
var current_step: int = -1

func _ready() -> void:
	prev_btn.pressed.connect(_on_prev_step)
	play_btn.pressed.connect(_on_play)
	stop_btn.pressed.connect(_on_stop)
	next_btn.pressed.connect(_on_next_step)
	back_btn.pressed.connect(_on_back)
	ReplayManager.playback_step_changed.connect(_on_playback_step)
	ReplayManager.playback_finished.connect(_on_playback_finished)
	_populate_history()
	_populate_profile_failures()
	_populate_slow_steps()
	if not ReplayManager.current_replay.is_empty():
		_load_from_manager()

func _populate_history() -> void:
	for child in history_list.get_children():
		child.queue_free()
	var history: Array = GameManager.get_replay_history()
	if history.is_empty():
		var empty_lbl := Label.new()
		empty_lbl.text = "暂无训练记录"
		empty_lbl.add_theme_color_override("font_color", Color(0.55, 0.6, 0.75, 1))
		empty_lbl.add_theme_font_size_override("font_size", 16)
		history_list.add_child(empty_lbl)
		return
	for i in range(history.size()):
		var entry: Dictionary = history[i]
		var stats: Dictionary = entry.get("stats", {})
		var btn := Button.new()
		var mistakes_count: int = stats.get("mistakes", []).size()
		btn.text = "#%d  %s\n  分数:%d  错误:%d次  完整率:%.0f%%" % [
			i + 1,
			entry.get("timestamp", "?"),
			stats.get("total_score", 0),
			mistakes_count,
			stats.get("average_completeness", 1.0) * 100
		]
		btn.custom_minimum_size = Vector2(390, 70)
		btn.add_theme_font_size_override("font_size", 14)
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.pressed.connect(_on_select_history.bind(i))
		history_list.add_child(btn)

func _populate_profile_failures() -> void:
	for child in profile_fail_list.get_children():
		child.queue_free()
	var failures: Array = ReplayManager.get_profile_failure_replays()
	if failures.is_empty():
		var empty_lbl := Label.new()
		empty_lbl.text = "暂无档案失败记录"
		empty_lbl.add_theme_color_override("font_color", Color(0.55, 0.6, 0.75, 1))
		empty_lbl.add_theme_font_size_override("font_size", 16)
		profile_fail_list.add_child(empty_lbl)
		return
	for i in range(failures.size()):
		var entry: Dictionary = failures[i]
		var btn := Button.new()
		btn.text = "#%d  %s\n  完整率:%.0f%%" % [
			i + 1,
			entry.get("timestamp", "?"),
			entry.get("completeness", 0.0) * 100
		]
		btn.custom_minimum_size = Vector2(390, 62)
		btn.add_theme_font_size_override("font_size", 14)
		btn.alignment = HORIZONTAL_ALIGNMENT_LEFT
		btn.pressed.connect(_on_select_profile_failure.bind(i))
		profile_fail_list.add_child(btn)

func _populate_slow_steps() -> void:
	var slow_steps: Array = ReplayManager.get_slow_step_positions()
	if slow_steps.is_empty():
		slow_steps_text.text = "[color=#666680]当前选中记录无明显卡顿步骤[/color]"
		return
	var text: String = ""
	for s in slow_steps:
		text += "• 第%d轮 第%d步\n  用时 %.1fs（显著超时）\n" % [
			s.get("round", 0),
			s.get("step_index", 0) + 1,
			s.get("duration", 0.0)
		]
	slow_steps_text.text = text

func _on_select_history(index: int) -> void:
	var history: Array = GameManager.get_replay_history()
	if index < 0 or index >= history.size():
		return
	ReplayManager.load_replay(history[index])
	_load_from_manager()

func _on_select_profile_failure(index: int) -> void:
	var failures: Array = ReplayManager.get_profile_failure_replays()
	if index < 0 or index >= failures.size():
		return
	var entry: Dictionary = failures[index]
	replay_title.text = "基础档案失败回放 #%d - %s" % [index + 1, entry.get("timestamp", "?")]
	current_mistakes = []
	current_step = -1
	step_index_label.text = "步骤: 0 / 0"
	var round_data: Dictionary = entry.get("round_data", {})
	var required: Array = entry.get("required_fields", [])
	var provided: Dictionary = round_data.get("provided_fields", {})
	var text: String = "[b]基础档案核查失败详情[/b]\n\n"
	text += "资料完整率: [color=#ff7788]%.0f%%[/color]\n\n" % (entry.get("completeness", 0.0) * 100)
	text += "[b]字段核查情况:[/b]\n"
	for field in required:
		var value: String = provided.get(field, "")
		var is_missing: bool = value.strip_edges() == ""
		if is_missing:
			text += "  ✗ [color=#ff7788][b]%s[/b]: 缺失[/color]\n" % field
		else:
			text += "  ✓ %s: %s\n" % [field, value]
	replay_content.text = text
	_populate_slow_steps()

func _load_from_manager() -> void:
	current_mistakes = ReplayManager.get_current_replay_mistakes()
	current_step = -1
	var ts: String = ReplayManager.current_replay.get("timestamp", "")
	replay_title.text = "复盘回放 - %s" % ts
	step_index_label.text = "步骤: 0 / %d" % current_mistakes.size()
	if current_mistakes.size() > 0:
		replay_content.text = "共记录 %d 次错误，点击 ▶自动播放 或使用按钮逐步查看\n\n" % current_mistakes.size()
		replay_content.text += "[color=#88aaff]提示：卡顿位置已在左侧高亮显示[/color]"
	else:
		replay_content.text = "[color=#66dd88]本次训练无错误记录[/color]"
	_populate_slow_steps()

func _on_playback_step(index: int, step_data: Dictionary) -> void:
	current_step = index
	_display_step(step_data)

func _on_playback_finished() -> void:
	play_btn.text = "▶ 自动播放"

func _on_prev_step() -> void:
	if current_mistakes.is_empty():
		return
	var new_index: int = current_step - 1
	if new_index < 0:
		new_index = 0
	ReplayManager.jump_to_step(new_index)
	current_step = new_index
	_display_step(current_mistakes[new_index])

func _on_next_step() -> void:
	if current_mistakes.is_empty():
		return
	var new_index: int = current_step + 1
	if new_index >= current_mistakes.size():
		new_index = current_mistakes.size() - 1
	ReplayManager.jump_to_step(new_index)
	current_step = new_index
	_display_step(current_mistakes[new_index])

func _on_play() -> void:
	if ReplayManager.is_playing:
		ReplayManager.stop_playback()
		play_btn.text = "▶ 自动播放"
	else:
		ReplayManager.start_playback()
		play_btn.text = "⏸ 暂停"

func _on_stop() -> void:
	ReplayManager.stop_playback()
	play_btn.text = "▶ 自动播放"

func _display_step(step_data: Dictionary) -> void:
	step_index_label.text = "步骤: %d / %d" % [current_step + 1, current_mistakes.size()]
	var type_name: String = GameManager.get_mistake_type_name(step_data.get("mistake_type", 0))
	var challenge_name: String = GameManager.get_challenge_type_name(step_data.get("challenge_type", 0))
	var duration: float = step_data.get("duration", 0.0)
	var text: String = "[b]第 %d / %d 步错误[/b]\n\n" % [current_step + 1, current_mistakes.size()]
	text += "轮次: 第%d轮\n" % step_data.get("round", 0)
	text += "任务: %s\n" % challenge_name
	text += "错误类型: [color=#ff7788]%s[/color]\n" % type_name
	text += "用时: %.1fs\n\n" % duration
	var pc: Dictionary = step_data.get("player_choice", {})
	if pc.has("item"):
		text += "[b]授权判断详情:[/b]\n"
		text += "  施工项: \"%s\"\n" % pc["item"]
		text += "  玩家判断: %s\n" % ("已授权" if pc.get("player_says_authorized", false) else "未授权")
		text += "  实际状态: [color=#66dd88]%s[/color]\n" % ("已授权" if pc.get("actually_authorized", false) else "未授权")
	elif pc.has("phase"):
		text += "[b]时间线变更详情:[/b]\n"
		text += "  阶段: %s\n" % pc["phase"]
		text += "  玩家决定: %s\n" % ("批准" if pc.get("player_approves", false) else "驳回")
		text += "  正确决定: [color=#66dd88]%s[/color]\n" % ("批准" if pc.get("actually_valid", false) else "驳回")
		text += "  变更原因: %s\n" % pc.get("reason", "")
	elif pc.has("field"):
		text += "[b]档案字段详情:[/b]\n"
		text += "  字段: %s\n" % pc["field"]
		text += "  玩家判断: %s\n" % ("缺失" if pc.get("player_says_missing", false) else "完整")
		text += "  实际状态: [color=#66dd88]%s[/color]\n" % ("缺失" if pc.get("actually_missing", false) else "完整")
	elif pc.get("timeout", false):
		text += "[b]超时未操作[/b]\n"
	elif pc.get("ignored_missing_hint", false):
		text += "[b]未确认资料缺失提示[/b]\n  建议：看到橙色警告条时请勾选确认，表示已留意到资料问题。"
	replay_content.text = text

func _on_back() -> void:
	ReplayManager.stop_playback()
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")
