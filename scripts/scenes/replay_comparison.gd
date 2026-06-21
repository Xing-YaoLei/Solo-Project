extends Control

var _session_list: Array = []
var _selected_session_id: String = ""

var _color_bg := Color.hex(0x1a1a2eff)
var _color_accent := Color.hex(0xe94560ff)
var _color_secondary := Color.hex(0x16213eff)
var _color_text := Color.hex(0xeeeeeeff)
var _color_success := Color.hex(0x4ecca3ff)
var _color_warning := Color.hex(0xffc857ff)

@onready var _session_list_container: VBoxContainer = %SessionListContainer
@onready var _comparison_container: VBoxContainer = %ComparisonContainer
@onready var _no_sessions_label: Label = %NoSessionsLabel
@onready var _no_selection_label: Label = %NoSelectionLabel
@onready var _back_btn: Button = %BackBtn
@onready var _refresh_btn: Button = %RefreshBtn
@onready var _session_list_scroll: ScrollContainer = %SessionListScroll
@onready var _comparison_scroll: ScrollContainer = %ComparisonScroll

func _ready() -> void:
	_setup_ui()
	_connect_signals()
	_refresh_sessions()

func _setup_ui() -> void:
	$Background.color = _color_bg

	$Title.add_theme_font_size_override("font_size", 32)
	$Title.add_theme_color_override("font_color", _color_accent)

	$LeftPanel/PanelLabel.add_theme_font_size_override("font_size", 20)
	$LeftPanel/PanelLabel.add_theme_color_override("font_color", _color_text)

	$RightPanel/PanelLabel.add_theme_font_size_override("font_size", 20)
	$RightPanel/PanelLabel.add_theme_color_override("font_color", _color_text)

	$LeftPanel.add_theme_stylebox_override("panel", _make_panel_style())
	$RightPanel.add_theme_stylebox_override("panel", _make_panel_style())

	_session_list_scroll.add_theme_stylebox_override("panel", _make_inner_panel_style())
	_comparison_scroll.add_theme_stylebox_override("panel", _make_inner_panel_style())

	_style_action_button(_back_btn)
	_style_action_button(_refresh_btn)

func _make_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(_color_secondary.r, _color_secondary.g, _color_secondary.b, 0.5)
	style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.3)
	style.set_border_width_all(1)
	style.set_corner_radius_all(10)
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	return style

func _make_inner_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(0.08, 0.08, 0.15, 1.0)
	style.set_corner_radius_all(6)
	style.content_margin_left = 8
	style.content_margin_right = 8
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	return style

func _style_action_button(btn: Button) -> void:
	var normal_style := StyleBoxFlat.new()
	normal_style.bg_color = _color_secondary
	normal_style.border_color = _color_accent
	normal_style.set_border_width_all(2)
	normal_style.set_corner_radius_all(8)
	normal_style.content_margin_left = 20
	normal_style.content_margin_right = 20
	normal_style.content_margin_top = 8
	normal_style.content_margin_bottom = 8

	var hover_style := StyleBoxFlat.new()
	hover_style.bg_color = _color_accent
	hover_style.set_corner_radius_all(8)
	hover_style.content_margin_left = 20
	hover_style.content_margin_right = 20
	hover_style.content_margin_top = 8
	hover_style.content_margin_bottom = 8

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_font_size_override("font_size", 16)
	btn.add_theme_color_override("font_color", _color_text)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)

func _connect_signals() -> void:
	_back_btn.pressed.connect(_on_back_pressed)
	_refresh_btn.pressed.connect(_refresh_sessions)

func _refresh_sessions() -> void:
	for child in _session_list_container.get_children():
		child.queue_free()

	_session_list.clear()
	TrainingRecordManager.reload_data()
	var session_ids: Array = TrainingRecordManager.get_all_session_ids()

	if session_ids.is_empty():
		_no_sessions_label.visible = true
		_no_selection_label.visible = true
		_comparison_container.visible = false
		return

	_no_sessions_label.visible = false

	session_ids.sort()
	session_ids.reverse()

	for sid in session_ids:
		var replays: Array = TrainingRecordManager.get_address_replays(sid)
		if replays.is_empty():
			continue
		var session_info: Dictionary = {
			"session_id": sid,
			"attempts": replays.size(),
			"latest": replays[replays.size() - 1]
		}
		_session_list.append(session_info)
		_add_session_card(session_info)

func _add_session_card(info: Dictionary) -> void:
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = _color_secondary
	style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.3)
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.content_margin_left = 12
	style.content_margin_right = 12
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	panel.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)

	var sid_label := Label.new()
	var sid: String = info.session_id
	sid_label.text = "会话: %s" % sid
	sid_label.add_theme_font_size_override("font_size", 14)
	sid_label.add_theme_color_override("font_color", _color_accent)
	vbox.add_child(sid_label)

	var attempts: int = info.attempts
	var latest: Dictionary = info.latest
	var info_label := Label.new()
	var duration_sec: int = latest.get("time_msec", 0) / 1000
	var is_correct: bool = latest.get("is_correct", false)
	var status_str: String = "✓ 正确" if is_correct else "✗ 错误"
	var status_color: Color = _color_success if is_correct else _color_accent
	info_label.text = "尝试次数: %d | 最近得分: %+d | %s" % [attempts, latest.get("score", 0), status_str]
	info_label.add_theme_font_size_override("font_size", 13)
	info_label.add_theme_color_override("font_color", Color(_color_text.r, _color_text.g, _color_text.b, 0.85))
	vbox.add_child(info_label)

	var ts_label := Label.new()
	ts_label.text = "时间: %s" % latest.get("timestamp", "")
	ts_label.add_theme_font_size_override("font_size", 12)
	ts_label.add_theme_color_override("font_color", Color(_color_text.r, _color_text.g, _color_text.b, 0.6))
	vbox.add_child(ts_label)

	panel.add_child(vbox)

	panel.gui_input.connect(func(event):
		if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			_select_session(sid)
	)

	_session_list_container.add_child(panel)

func _select_session(session_id: String) -> void:
	_selected_session_id = session_id
	_no_selection_label.visible = false
	_comparison_container.visible = true
	_render_comparison(session_id)

func _render_comparison(session_id: String) -> void:
	for child in _comparison_container.get_children():
		child.queue_free()

	var replays: Array = TrainingRecordManager.get_address_replays(session_id)
	if replays.is_empty():
		return

	var title := Label.new()
	title.text = "会话 %s - 复盘对比 (%d次尝试)" % [session_id, replays.size()]
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", _color_accent)
	_comparison_container.add_child(title)

	var sep := HSeparator.new()
	sep.custom_minimum_size = Vector2(0, 12)
	_comparison_container.add_child(sep)

	for i in range(replays.size()):
		var replay: Dictionary = replays[i]
		_add_attempt_card(i + 1, replay)

	if replays.size() >= 2:
		var sep2 := HSeparator.new()
		sep2.custom_minimum_size = Vector2(0, 16)
		_comparison_container.add_child(sep2)

		var diff_title := Label.new()
		diff_title.text = "相邻尝试差异分析"
		diff_title.add_theme_font_size_override("font_size", 20)
		diff_title.add_theme_color_override("font_color", _color_warning)
		_comparison_container.add_child(diff_title)

		var comparisons: Array = TrainingRecordManager.compare_attempts(session_id)
		for comp in comparisons:
			_add_comparison_card(comp)

func _add_attempt_card(attempt_num: int, replay: Dictionary) -> void:
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(_color_secondary.r, _color_secondary.g, _color_secondary.b, 0.7)
	style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.4)
	style.set_border_width_all(1)
	style.set_corner_radius_all(8)
	style.content_margin_left = 14
	style.content_margin_right = 14
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	panel.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 6)

	var header := HBoxContainer.new()
	header.add_theme_constant_override("separation", 16)

	var num_label := Label.new()
	num_label.text = "第 %d 次尝试" % attempt_num
	num_label.add_theme_font_size_override("font_size", 18)
	num_label.add_theme_color_override("font_color", _color_accent)
	header.add_child(num_label)

	var is_correct: bool = replay.get("is_correct", false)
	var status_label := Label.new()
	status_label.text = "✓ 正确" if is_correct else "✗ 错误"
	status_label.add_theme_font_size_override("font_size", 16)
	status_label.add_theme_color_override("font_color", _color_success if is_correct else _color_accent)
	header.add_child(status_label)

	var spacer := Control.new()
	spacer.size_flags_horizontal = 3
	header.add_child(spacer)

	var score: int = replay.get("score", 0)
	var score_label := Label.new()
	score_label.text = "得分: %+d" % score
	score_label.add_theme_font_size_override("font_size", 18)
	score_label.add_theme_color_override("font_color", _color_success if score >= 0 else _color_accent)
	header.add_child(score_label)

	vbox.add_child(header)

	var order: Array = replay.get("order", [])
	var order_label := Label.new()
	order_label.text = "排序顺序: %s" % " → ".join(PackedStringArray(order))
	order_label.add_theme_font_size_override("font_size", 15)
	order_label.add_theme_color_override("font_color", _color_text)
	order_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(order_label)

	var duration_sec: int = replay.get("time_msec", 0) / 1000
	var min: int = duration_sec / 60
	var sec: int = duration_sec % 60
	var info_label := Label.new()
	info_label.text = "用时: %d分%d秒 | 时间: %s" % [min, sec, replay.get("timestamp", "")]
	info_label.add_theme_font_size_override("font_size", 13)
	info_label.add_theme_color_override("font_color", Color(_color_text.r, _color_text.g, _color_text.b, 0.65))
	vbox.add_child(info_label)

	panel.add_child(vbox)
	_comparison_container.add_child(panel)

func _add_comparison_card(comp: Dictionary) -> void:
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(_color_warning.r, _color_warning.g, _color_warning.b, 0.1)
	style.border_color = Color(_color_warning.r, _color_warning.g, _color_warning.b, 0.5)
	style.set_border_width_all(1)
	style.set_corner_radius_all(8)
	style.content_margin_left = 14
	style.content_margin_right = 14
	style.content_margin_top = 10
	style.content_margin_bottom = 10
	panel.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)

	var a: int = comp.get("attempt_a", 0)
	var b: int = comp.get("attempt_b", 0)
	var title := Label.new()
	title.text = "第 %d 次 → 第 %d 次" % [a, b]
	title.add_theme_font_size_override("font_size", 16)
	title.add_theme_color_override("font_color", _color_warning)
	vbox.add_child(title)

	var order_changes: Dictionary = comp.get("order_changes", {})
	if not order_changes.is_empty():
		var changes_label := Label.new()
		var changes_text: Array = []
		for pos_str in order_changes.keys():
			var change: Dictionary = order_changes[pos_str]
			changes_text.append("位置%d: %s → %s" % [int(pos_str) + 1, change.get("from", ""), change.get("to", "")])
		changes_label.text = "顺序变化:\n  " + "\n  ".join(PackedStringArray(changes_text))
		changes_label.add_theme_font_size_override("font_size", 14)
		changes_label.add_theme_color_override("font_color", _color_text)
		changes_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		vbox.add_child(changes_label)
	else:
		var same_label := Label.new()
		same_label.text = "顺序无变化"
		same_label.add_theme_font_size_override("font_size", 14)
		same_label.add_theme_color_override("font_color", _color_success)
		vbox.add_child(same_label)

	var score_diff: int = comp.get("score_diff", 0)
	var time_diff: int = comp.get("time_diff", 0)
	var summary := Label.new()
	var time_diff_str: String = ""
	if time_diff > 0:
		time_diff_str = "+%d秒" % (time_diff / 1000)
	elif time_diff < 0:
		time_diff_str = "%d秒" % (time_diff / 1000)
	else:
		time_diff_str = "0秒"
	summary.text = "得分变化: %+d | 用时变化: %s" % [score_diff, time_diff_str]
	summary.add_theme_font_size_override("font_size", 13)
	summary.add_theme_color_override("font_color", Color(_color_text.r, _color_text.g, _color_text.b, 0.75))
	vbox.add_child(summary)

	panel.add_child(vbox)
	_comparison_container.add_child(panel)

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu/main_menu.tscn")
