extends Control

var _address_questions: Array = []
var _current_index: int = 0
var _current_order: Array = []
var _address_items: Dictionary = {}
var _dragging_item: PanelContainer = null
var _drag_from_index: int = -1
var _time_remaining: float = 0.0
var _time_limit: float = 0.0
var _is_answered: bool = false
var _attempt_count: int = 0
var _session_id: String = ""
var _start_time: int = 0

var _color_bg := Color.hex(0x1a1a2eff)
var _color_accent := Color.hex(0xe94560ff)
var _color_secondary := Color.hex(0x16213eff)
var _color_text := Color.hex(0xeeeeeeff)
var _color_success := Color.hex(0x4ecca3ff)
var _color_warning := Color.hex(0xffc857ff)

@onready var _timer_bar: ProgressBar = %TimerBar
@onready var _score_label: Label = %ScoreLabel
@onready var _question_label: Label = %QuestionLabel
@onready var _order_name_label: Label = %OrderNameLabel
@onready var _address_list: VBoxContainer = %AddressList
@onready var _submit_button: Button = %SubmitButton
@onready var _retry_button: Button = %RetryButton
@onready var _result_label: Label = %ResultLabel
@onready var _attempt_label: Label = %AttemptLabel
@onready var _correct_order_label: Label = %CorrectOrderLabel

func _ready() -> void:
	_session_id = TrainingRecordManager.generate_session_id()
	_load_address_questions()
	if _address_questions.is_empty():
		_show_no_questions()
		return
	_attempt_count = TrainingRecordManager.get_address_retry_count(_session_id)
	_submit_button.pressed.connect(_on_submit)
	_retry_button.pressed.connect(_on_retry)
	_setup_question()

func _load_address_questions() -> void:
	var all_questions: Array = GameManager.questions
	_address_questions = all_questions.filter(func(q): return q.get("type", "") == "address")

func _setup_question() -> void:
	_is_answered = false
	_result_label.text = ""
	_correct_order_label.text = ""
	_submit_button.disabled = false
	_retry_button.visible = false
	_start_time = Time.get_ticks_msec()

	var question: Dictionary = _address_questions[_current_index]
	_order_name_label.text = question.get("order_name", "地址排序")
	_question_label.text = "第 %d / %d 题" % [_current_index + 1, _address_questions.size()]
	_score_label.text = "得分: %d" % GameManager.total_score
	_attempt_label.text = "尝试次数: %d / %d" % [_attempt_count + 1, ConfigManager.get_max_address_retries()]

	var addresses: Array = question.get("addresses", []).duplicate()
	addresses.shuffle()
	_current_order.clear()
	for addr in addresses:
		_current_order.append(addr.id)

	_build_address_list(addresses)

	_time_limit = float(ConfigManager.get_time_limit(2))
	_time_remaining = _time_limit
	_timer_bar.max_value = _time_limit
	_timer_bar.value = _time_limit

func _build_address_list(addresses: Array) -> void:
	for child in _address_list.get_children():
		child.queue_free()
	_address_items.clear()

	for i in range(addresses.size()):
		var addr: Dictionary = addresses[i]
		var item: PanelContainer = _create_address_item(addr, i)
		_address_list.add_child(item)
		_address_items[addr.id] = item

func _create_address_item(addr: Dictionary, index: int) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(0, 72)

	var style := StyleBoxFlat.new()
	style.bg_color = _color_secondary
	style.border_color = _color_accent
	style.set_border_width_all(2)
	style.set_corner_radius_all(8)
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	panel.add_theme_stylebox_override("panel", style)

	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 16)

	var num_label := Label.new()
	num_label.text = "%d." % (index + 1)
	num_label.custom_minimum_size = Vector2(32, 0)
	num_label.add_theme_font_size_override("font_size", 20)
	num_label.add_theme_color_override("font_color", _color_accent)
	hbox.add_child(num_label)

	var info_vbox := VBoxContainer.new()
	info_vbox.size_flags_horizontal = 3

	var name_label := Label.new()
	name_label.text = addr.get("name", "未知地址")
	name_label.add_theme_font_size_override("font_size", 18)
	name_label.add_theme_color_override("font_color", _color_text)
	info_vbox.add_child(name_label)

	var detail_label := Label.new()
	var priority_str: String = ""
	match addr.get("priority", 3):
		1: priority_str = "高优先级"
		2: priority_str = "中优先级"
		3: priority_str = "低优先级"
	detail_label.text = "%s | 配送时间: %s | 距离: %.1fkm" % [priority_str, addr.get("time_window", ""), addr.get("distance", 0.0)]
	detail_label.add_theme_font_size_override("font_size", 14)
	detail_label.add_theme_color_override("font_color", Color(_color_text.r, _color_text.g, _color_text.b, 0.7))
	info_vbox.add_child(detail_label)

	hbox.add_child(info_vbox)

	var drag_handle := Label.new()
	drag_handle.text = "⋮⋮"
	drag_handle.add_theme_font_size_override("font_size", 20)
	drag_handle.add_theme_color_override("font_color", _color_accent)
	drag_handle.mouse_filter = Control.MOUSE_FILTER_IGNORE
	hbox.add_child(drag_handle)

	panel.add_child(hbox)

	panel.gui_input.connect(_on_item_gui_input.bind(panel, addr.id))
	panel.set_meta("addr_id", addr.id)
	panel.set_meta("index", index)

	return panel

func _on_item_gui_input(event: InputEvent, panel: PanelContainer, addr_id: String) -> void:
	if _is_answered:
		return
	if event is InputEventMouseButton:
		var mb: InputEventMouseButton = event
		if mb.button_index == MOUSE_BUTTON_LEFT:
			if mb.pressed:
				_start_drag(panel, addr_id)
			else:
				_end_drag(mb.position)

func _get_local_mouse_position() -> Vector2:
	var viewport := get_viewport()
	if viewport:
		return _address_list.get_global_transform().affine_inverse() * viewport.get_mouse_position()
	return Vector2.ZERO

func _start_drag(panel: PanelContainer, addr_id: String) -> void:
	_dragging_item = panel
	_drag_from_index = _current_order.find(addr_id)
	if _drag_from_index != -1:
		var style: StyleBoxFlat = panel.get_theme_stylebox("panel").duplicate()
		style.border_color = _color_success
		panel.add_theme_stylebox_override("panel", style)

func _end_drag(mouse_pos: Vector2) -> void:
	if not _dragging_item:
		return
	var drop_index: int = _find_drop_index()
	if drop_index != -1 and drop_index != _drag_from_index:
		_move_item(_drag_from_index, drop_index)
	_reset_item_style(_dragging_item)
	_dragging_item = null
	_drag_from_index = -1

func _find_drop_index() -> int:
	var mouse_pos: Vector2 = _get_local_mouse_position()
	var children: Array = _address_list.get_children()
	for i in range(children.size()):
		var child: Control = children[i]
		var rect: Rect2 = Rect2(Vector2.ZERO, child.size)
		var local_pos: Vector2 = child.get_global_transform().affine_inverse() * get_viewport().get_mouse_position()
		if rect.has_point(local_pos):
			return i
	return -1

func _move_item(from_idx: int, to_idx: int) -> void:
	var addr_id: String = _current_order[from_idx]
	_current_order.remove_at(from_idx)
	_current_order.insert(to_idx, addr_id)
	_refresh_order_display()

func _refresh_order_display() -> void:
	var question: Dictionary = _address_questions[_current_index]
	var addresses: Array = question.get("addresses", [])
	var ordered_addresses: Array = []
	for aid in _current_order:
		for addr in addresses:
			if addr.id == aid:
				ordered_addresses.append(addr)
				break
	_build_address_list(ordered_addresses)

func _reset_item_style(panel: PanelContainer) -> void:
	var style := StyleBoxFlat.new()
	style.bg_color = _color_secondary
	style.border_color = _color_accent
	style.set_border_width_all(2)
	style.set_corner_radius_all(8)
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	panel.add_theme_stylebox_override("panel", style)

func _on_submit() -> void:
	if _is_answered:
		return
	_submit_answer()

func _on_retry() -> void:
	if not TrainingRecordManager.can_retry_address(_session_id):
		_advance()
		return
	_attempt_count += 1
	_setup_question()

func _submit_answer() -> void:
	_is_answered = true
	_submit_button.disabled = true

	var question: Dictionary = _address_questions[_current_index]
	var correct_order: Array = question.get("correct_order", [])
	var is_correct: bool = _current_order == correct_order
	var duration: int = Time.get_ticks_msec() - _start_time

	var score: int = 0
	if is_correct:
		score = ConfigManager.get_score_per_correct() * correct_order.size()
	else:
		var penalty: int = ConfigManager.get_score_penalty()
		var correct_count: int = 0
		for i in range(min(_current_order.size(), correct_order.size())):
			if _current_order[i] == correct_order[i]:
				correct_count += 1
		score = correct_count * ConfigManager.get_score_per_correct() - (correct_order.size() - correct_count) * penalty

	GameManager.add_score(GameManager.Phase.ADDRESS_SORTING, score)
	_score_label.text = "得分: %d" % GameManager.total_score

	var attempt: Dictionary = {
		"order": _current_order.duplicate(),
		"score": score,
		"time_msec": duration,
		"is_correct": is_correct,
		"timestamp": Time.get_datetime_string_from_system()
	}
	TrainingRecordManager.save_address_replay(_session_id, attempt)

	_show_feedback(correct_order, is_correct, score)

func _show_feedback(correct_order: Array, is_correct: bool, score: int) -> void:
	var question: Dictionary = _address_questions[_current_index]
	var addresses: Array = question.get("addresses", [])
	var addr_map: Dictionary = {}
	for addr in addresses:
		addr_map[addr.id] = addr.name

	var correct_names: PackedStringArray = []
	for aid in correct_order:
		correct_names.append(addr_map.get(aid, aid))

	if is_correct:
		_result_label.text = "✅ 排序正确! 得分: +%d" % score
		_result_label.add_theme_color_override("font_color", _color_success)
		_retry_button.visible = false
	else:
		_result_label.text = "❌ 排序有误! 得分: %+d" % score
		_result_label.add_theme_color_override("font_color", _color_accent)
		_correct_order_label.text = "正确顺序: %s" % " → ".join(correct_names)
		_correct_order_label.add_theme_color_override("font_color", _color_warning)
		if TrainingRecordManager.can_retry_address(_session_id):
			_retry_button.visible = true
			_retry_button.text = "重试 (%d/%d)" % [_attempt_count + 1, ConfigManager.get_max_address_retries()]
		else:
			_retry_button.visible = true
			_retry_button.text = "已达最大重试次数，下一题"

	_highlight_correct_positions(correct_order)

	_submit_button.disabled = true
	_submit_button.text = "下一题"
	_submit_button.pressed.disconnect(_on_submit)
	_submit_button.pressed.connect(_advance)

func _highlight_correct_positions(correct_order: Array) -> void:
	for i in range(_current_order.size()):
		var aid: String = _current_order[i]
		var panel: PanelContainer = _address_items.get(aid, null)
		if not panel:
			continue
		var style: StyleBoxFlat = panel.get_theme_stylebox("panel").duplicate()
		if i < correct_order.size() and aid == correct_order[i]:
			style.bg_color = Color(_color_success.r, _color_success.g, _color_success.b, 0.3)
			style.border_color = _color_success
		else:
			style.bg_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.2)
			style.border_color = _color_accent
		panel.add_theme_stylebox_override("panel", style)

func _advance() -> void:
	_current_index += 1
	_submit_button.pressed.disconnect_all()
	_submit_button.pressed.connect(_on_submit)
	_submit_button.text = "提交"
	if _current_index < _address_questions.size():
		_setup_question()
	else:
		GameManager.advance_phase()

func _process(delta: float) -> void:
	if _is_answered or _address_questions.is_empty():
		return
	_time_remaining -= delta
	_timer_bar.value = max(0.0, _time_remaining)
	if _time_remaining <= 0.0:
		_on_timeout()

func _on_timeout() -> void:
	if _is_answered:
		return
	_submit_answer()
	_result_label.text = "⏱ 时间到！\n" + _result_label.text

func _show_no_questions() -> void:
	_order_name_label.text = "无地址排序题目"
	_result_label.text = "当前没有地址排序题目，将跳过此阶段"
	_submit_button.text = "跳过"
	_submit_button.pressed.connect(func(): GameManager.advance_phase())
