extends Control

@onready var round_label: Label = $TopBar/RoundLabel
@onready var type_label: Label = $TopBar/TypeLabel
@onready var score_label: Label = $TopBar/ScoreLabel
@onready var timer_label: Label = $TopBar/TimerLabel
@onready var warning_banner: Panel = $WarningBanner
@onready var warning_text: Label = $WarningBanner/WarningText
@onready var task_title: Label = $ContentArea/TaskTitle
@onready var task_body: RichTextLabel = $ContentArea/TaskBody
@onready var choices_panel: VBoxContainer = $ContentArea/ChoicesPanel
@onready var feedback_label: Label = $BottomBar/FeedbackLabel
@onready var quit_btn: Button = $BottomBar/QuitBtn

var round_data: Dictionary = {}
var time_left: float = 0.0
var timer_active: bool = false
var choices: Array[Button] = []
var awaiting_data_check: bool = false
var has_acknowledged_missing: bool = false
var profile_field_checkboxes: Dictionary = {}

func _ready() -> void:
	GameManager.round_completed.connect(_on_round_completed)
	GameManager.game_ended.connect(_on_game_ended)
	quit_btn.pressed.connect(_on_quit)
	_setup_round()

func _process(delta: float) -> void:
	if not timer_active:
		return
	time_left -= delta
	if time_left <= 0.0:
		time_left = 0.0
		timer_active = false
		_handle_timeout()
	timer_label.text = "%.1fs" % time_left
	var ratio: float = clamp(time_left / round_data.get("time_limit", 20.0), 0.0, 1.0)
	if ratio < 0.25:
		timer_label.add_theme_color_override("font_color", Color(0.95, 0.3, 0.35, 1))
	elif ratio < 0.5:
		timer_label.add_theme_color_override("font_color", Color(0.95, 0.75, 0.3, 1))
	else:
		timer_label.add_theme_color_override("font_color", Color(0.4, 0.9, 0.7, 1))

func _setup_round() -> void:
	round_data = GameManager.get_current_round_data()
	time_left = round_data.get("time_limit", 20.0)
	timer_active = true
	has_acknowledged_missing = false
	awaiting_data_check = false
	feedback_label.text = ""
	round_label.text = "第 %d / %d 轮" % [GameManager.current_round, GameManager.total_rounds]
	type_label.text = GameManager.get_challenge_type_name(round_data.get("challenge_type", 0))
	score_label.text = "分数: %d" % GameManager.score
	_show_warning_if_needed()
	_clear_choices()
	match round_data.get("challenge_type", 0):
		GameManager.ChallengeType.AUTHORITY_SCOPE:
			_setup_authority_challenge()
		GameManager.ChallengeType.TIMELINE_CHANGE:
			_setup_timeline_challenge()
		GameManager.ChallengeType.BASIC_PROFILE:
			_setup_profile_challenge()

func _show_warning_if_needed() -> void:
	if round_data.get("has_missing_data", false) and round_data.has("missing_hint"):
		warning_banner.visible = true
		warning_text.text = round_data.missing_hint
		awaiting_data_check = true
	else:
		warning_banner.visible = false
		awaiting_data_check = false

func _clear_choices() -> void:
	for child in choices_panel.get_children():
		child.queue_free()
	choices.clear()
	profile_field_checkboxes.clear()

func _setup_authority_challenge() -> void:
	task_title.text = "授权范围判断 - %s" % round_data.get("client_name", "客户")
	var authorized: Array = round_data.get("authorized_items", [])
	var unauthorized: Array = round_data.get("unauthorized_items", [])
	var all_items: Array = []
	all_items.append_array(authorized)
	all_items.append_array(unauthorized)
	all_items.shuffle()
	var body_text: String = "[b]房产地址:[/b] %s\n\n" % round_data.get("property_address", "未知")
	body_text += "请判断以下施工项是否在客户授权范围内，点击按钮选择：\n\n"
	body_text += "[color=#88aaff]客户授权书已附在档案中[/color]\n"
	task_body.text = body_text
	for item in all_items:
		var is_authorized: bool = item in authorized
		var hbox := HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 15)
		var item_label := Label.new()
		item_label.text = "• %s" % item
		item_label.add_theme_font_size_override("font_size", 18)
		item_label.custom_minimum_size = Vector2(500, 40)
		hbox.add_child(item_label)
		var yes_btn := Button.new()
		yes_btn.text = "已授权"
		yes_btn.custom_minimum_size = Vector2(110, 42)
		yes_btn.add_theme_font_size_override("font_size", 16)
		yes_btn.pressed.connect(_on_authority_choice.bind(yes_btn, item, true, is_authorized))
		hbox.add_child(yes_btn)
		var no_btn := Button.new()
		no_btn.text = "未授权"
		no_btn.custom_minimum_size = Vector2(110, 42)
		no_btn.add_theme_font_size_override("font_size", 16)
		no_btn.pressed.connect(_on_authority_choice.bind(no_btn, item, false, is_authorized))
		hbox.add_child(no_btn)
		var result_label := Label.new()
		result_label.text = ""
		result_label.add_theme_font_size_override("font_size", 16)
		result_label.custom_minimum_size = Vector2(260, 40)
		hbox.add_child(result_label)
		yes_btn.set_meta("result_label", result_label)
		no_btn.set_meta("result_label", result_label)
		yes_btn.set_meta("other_btn", no_btn)
		no_btn.set_meta("other_btn", yes_btn)
		yes_btn.set_meta("item", item)
		no_btn.set_meta("item", item)
		choices_panel.add_child(hbox)
		choices.append(yes_btn)
		choices.append(no_btn)
	if awaiting_data_check:
		_add_missing_data_acknowledge()
	_add_confirm_button("确认提交授权判断")

func _on_authority_choice(btn: Button, item: String, player_says_authorized: bool, actually_authorized: bool) -> void:
	var result_label: Label = btn.get_meta("result_label")
	var other_btn: Button = btn.get_meta("other_btn")
	var is_correct: bool = (player_says_authorized == actually_authorized)
	btn.disabled = true
	other_btn.disabled = true
	if is_correct:
		btn.add_theme_stylebox_override("normal", _make_style(Color(0.2, 0.6, 0.35)))
		result_label.add_theme_color_override("font_color", Color(0.4, 0.95, 0.6, 1))
		result_label.text = "✓ 判断正确"
	else:
		btn.add_theme_stylebox_override("normal", _make_style(Color(0.75, 0.25, 0.3)))
		result_label.add_theme_color_override("font_color", Color(0.95, 0.45, 0.5, 1))
		var correct_text: String = "已授权" if actually_authorized else "未授权"
		result_label.text = "✗ 错误，应为: %s" % correct_text
	var choice: Dictionary = {
		"item": item,
		"player_says_authorized": player_says_authorized,
		"actually_authorized": actually_authorized
	}
	var mistake_type: int = GameManager.MistakeType.NONE if is_correct else GameManager.MistakeType.WRONG_AUTHORITY
	GameManager.record_step(choice, is_correct, mistake_type)

func _setup_timeline_challenge() -> void:
	task_title.text = "时间线变更审批 - %s" % round_data.get("project_name", "项目")
	var body_text: String = "[b]原始施工计划:[/b]\n"
	for phase in round_data.get("original_timeline", []):
		body_text += "  • %s: %s ~ %s\n" % [phase["phase"], phase["start"], phase["end"]]
	body_text += "\n[b]申请变更内容:[/b]\n"
	var valid: Array = round_data.get("valid_changes", [])
	var invalid: Array = round_data.get("invalid_changes", [])
	var all_changes: Array = []
	all_changes.append_array(valid)
	all_changes.append_array(invalid)
	all_changes.shuffle()
	for idx in range(all_changes.size()):
		var ch: Dictionary = all_changes[idx]
		body_text += "  [%d] %s 变更: %s → %s (原因: %s)\n" % [idx + 1, ch["phase"], ch.get("new_start", ch.get("start", "?")), ch.get("new_end", ch.get("end", "?")), ch["reason"]]
	body_text += "\n请判断以上变更是否合理，点击按钮批准或驳回："
	task_body.text = body_text
	for idx in range(all_changes.size()):
		var ch: Dictionary = all_changes[idx]
		var is_valid: bool = ch in valid
		var hbox := HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 15)
		var change_label := Label.new()
		change_label.text = "[%d] %s变更" % [idx + 1, ch["phase"]]
		change_label.add_theme_font_size_override("font_size", 17)
		change_label.custom_minimum_size = Vector2(350, 40)
		hbox.add_child(change_label)
		var approve_btn := Button.new()
		approve_btn.text = "批准"
		approve_btn.custom_minimum_size = Vector2(100, 42)
		approve_btn.add_theme_font_size_override("font_size", 16)
		approve_btn.pressed.connect(_on_timeline_choice.bind(approve_btn, ch, true, is_valid))
		hbox.add_child(approve_btn)
		var reject_btn := Button.new()
		reject_btn.text = "驳回"
		reject_btn.custom_minimum_size = Vector2(100, 42)
		reject_btn.add_theme_font_size_override("font_size", 16)
		reject_btn.pressed.connect(_on_timeline_choice.bind(reject_btn, ch, false, is_valid))
		hbox.add_child(reject_btn)
		var result_label := Label.new()
		result_label.text = ""
		result_label.add_theme_font_size_override("font_size", 16)
		result_label.custom_minimum_size = Vector2(300, 40)
		hbox.add_child(result_label)
		approve_btn.set_meta("result_label", result_label)
		reject_btn.set_meta("result_label", result_label)
		approve_btn.set_meta("other_btn", reject_btn)
		reject_btn.set_meta("other_btn", approve_btn)
		choices_panel.add_child(hbox)
		choices.append(approve_btn)
		choices.append(reject_btn)
	if awaiting_data_check:
		_add_missing_data_acknowledge()
	_add_confirm_button("确认提交变更审批")

func _on_timeline_choice(btn: Button, change: Dictionary, player_approves: bool, actually_valid: bool) -> void:
	var result_label: Label = btn.get_meta("result_label")
	var other_btn: Button = btn.get_meta("other_btn")
	var is_correct: bool = (player_approves == actually_valid)
	btn.disabled = true
	other_btn.disabled = true
	if is_correct:
		btn.add_theme_stylebox_override("normal", _make_style(Color(0.2, 0.6, 0.35)))
		result_label.add_theme_color_override("font_color", Color(0.4, 0.95, 0.6, 1))
		result_label.text = "✓ 判断正确"
	else:
		btn.add_theme_stylebox_override("normal", _make_style(Color(0.75, 0.25, 0.3)))
		result_label.add_theme_color_override("font_color", Color(0.95, 0.45, 0.5, 1))
		var correct_text: String = "应批准" if actually_valid else "应驳回"
		result_label.text = "✗ 错误，%s" % correct_text
	var choice: Dictionary = {
		"phase": change["phase"],
		"player_approves": player_approves,
		"actually_valid": actually_valid,
		"reason": change["reason"]
	}
	var mistake_type: int = GameManager.MistakeType.NONE if is_correct else GameManager.MistakeType.WRONG_TIMELINE
	GameManager.record_step(choice, is_correct, mistake_type)

func _setup_profile_challenge() -> void:
	task_title.text = "基础档案完整性核查"
	var required: Array = round_data.get("required_fields", [])
	var provided: Dictionary = round_data.get("provided_fields", {})
	var body_text: String = "请核查以下客户档案字段是否已完整填写，勾选 [b]缺失[/b] 的字段项：\n\n"
	body_text += "[color=#aabbff]提示：空字段或未填写视为资料缺失[/color]\n\n"
	task_body.text = body_text
	for field in required:
		var value: String = provided.get(field, "")
		var is_missing: bool = value.strip_edges() == ""
		var hbox := HBoxContainer.new()
		hbox.add_theme_constant_override("separation", 15)
		var chk := CheckBox.new()
		chk.text = "缺失"
		chk.add_theme_font_size_override("font_size", 16)
		chk.custom_minimum_size = Vector2(80, 36)
		hbox.add_child(chk)
		var field_label := Label.new()
		field_label.text = "[b]%s[/b]" % field
		field_label.add_theme_font_size_override("font_size", 17)
		field_label.custom_minimum_size = Vector2(180, 36)
		hbox.add_child(field_label)
		var value_label := Label.new()
		if is_missing:
			value_label.add_theme_color_override("font_color", Color(0.95, 0.55, 0.4, 1))
			value_label.text = "[未填写]"
		else:
			value_label.add_theme_color_override("font_color", Color(0.9, 0.92, 0.98, 1))
			value_label.text = value
		value_label.add_theme_font_size_override("font_size", 17)
		value_label.custom_minimum_size = Vector2(400, 36)
		hbox.add_child(value_label)
		var result_label := Label.new()
		result_label.text = ""
		result_label.add_theme_font_size_override("font_size", 16)
		result_label.custom_minimum_size = Vector2(200, 36)
		hbox.add_child(result_label)
		chk.set_meta("is_actually_missing", is_missing)
		chk.set_meta("field_name", field)
		chk.set_meta("result_label", result_label)
		profile_field_checkboxes[field] = chk
		choices_panel.add_child(hbox)
	_add_confirm_button("提交档案核查结果")

func _add_missing_data_acknowledge() -> void:
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 15)
	var chk := CheckBox.new()
	chk.text = "我已注意到资料缺失提示，并会在操作中特别留意"
	chk.add_theme_font_size_override("font_size", 16)
	chk.custom_minimum_size = Vector2(600, 36)
	chk.toggled.connect(_on_missing_data_acknowledged)
	chk.set_meta("is_ack_chk", true)
	hbox.add_child(chk)
	choices_panel.add_child(hbox)

func _on_missing_data_acknowledged(checked: bool) -> void:
	has_acknowledged_missing = checked

func _add_confirm_button(label_text: String) -> void:
	var spacer := Control.new()
	spacer.custom_minimum_size = Vector2(0, 20)
	choices_panel.add_child(spacer)
	var confirm_btn := Button.new()
	confirm_btn.text = label_text
	confirm_btn.custom_minimum_size = Vector2(350, 54)
	confirm_btn.add_theme_font_size_override("font_size", 20)
	confirm_btn.pressed.connect(_on_confirm_round)
	choices_panel.add_child(confirm_btn)
	choices.append(confirm_btn)

func _on_confirm_round() -> void:
	timer_active = false
	var completeness: float = 1.0
	var all_choices_correct: bool = true
	match round_data.get("challenge_type", 0):
		GameManager.ChallengeType.BASIC_PROFILE:
			var profile_result: Dictionary = _check_profile_result()
			all_choices_correct = profile_result["correct"]
			completeness = profile_result["completeness"]
		_:
			all_choices_correct = true
	if awaiting_data_check and not has_acknowledged_missing:
		var choice: Dictionary = {"ignored_missing_hint": true}
		GameManager.record_step(choice, false, GameManager.MistakeType.MISSING_DATA_IGNORED)
		feedback_label.add_theme_color_override("font_color", Color(0.95, 0.45, 0.5, 1))
		feedback_label.text = "⚠ 未确认资料缺失提示，已记录本次疏漏"
	elif round_data.get("challenge_type", 0) == GameManager.ChallengeType.BASIC_PROFILE and not all_choices_correct:
		feedback_label.add_theme_color_override("font_color", Color(0.95, 0.75, 0.3, 1))
		feedback_label.text = "档案核查完成，完整率: %.0f%%" % (completeness * 100)
	else:
		feedback_label.add_theme_color_override("font_color", Color(0.4, 0.95, 0.6, 1))
		feedback_label.text = "本轮提交成功，进入下一轮..."
	await get_tree().create_timer(1.5).timeout
	GameManager.complete_round(completeness)

func _check_profile_result() -> Dictionary:
	var required: Array = round_data.get("required_fields", [])
	var total_fields: int = required.size()
	var correct_count: int = 0
	var actually_missing_count: int = 0
	for field in required:
		var chk: CheckBox = profile_field_checkboxes.get(field, null)
		if not chk:
			continue
		var is_actually_missing: bool = chk.get_meta("is_actually_missing", false)
		var player_checked: bool = chk.button_pressed
		var result_label: Label = chk.get_meta("result_label", null)
		if is_actually_missing:
			actually_missing_count += 1
		var is_field_correct: bool = (player_checked == is_actually_missing)
		if is_field_correct:
			correct_count += 1
			if result_label:
				result_label.add_theme_color_override("font_color", Color(0.4, 0.95, 0.6, 1))
				result_label.text = "✓"
		else:
			if result_label:
				result_label.add_theme_color_override("font_color", Color(0.95, 0.45, 0.5, 1))
				if is_actually_missing:
					result_label.text = "✗ 未检出缺失"
				else:
					result_label.text = "✗ 误报缺失"
		var choice: Dictionary = {
			"field": field,
			"player_says_missing": player_checked,
			"actually_missing": is_actually_missing
		}
		var mistake_type: int = GameManager.MistakeType.NONE if is_field_correct else GameManager.MistakeType.INCOMPLETE_PROFILE
		GameManager.record_step(choice, is_field_correct, mistake_type)
		chk.disabled = true
	var completeness: float = 1.0
	if actually_missing_count > 0:
		completeness = float(total_fields - actually_missing_count) / float(total_fields)
	var all_correct: bool = correct_count == total_fields
	if not all_correct:
		ReplayManager.save_profile_failure({
			"timestamp": Time.get_datetime_string_from_system(),
			"round_data": round_data.duplicate(true),
			"completeness": completeness,
			"required_fields": required
		})
	return {"correct": all_correct, "completeness": completeness}

func _handle_timeout() -> void:
	feedback_label.add_theme_color_override("font_color", Color(0.95, 0.45, 0.5, 1))
	feedback_label.text = "⚠ 操作超时，本轮未完成步骤已记为错误"
	var choice: Dictionary = {"timeout": true, "challenge_type": round_data.get("challenge_type", 0)}
	GameManager.record_step(choice, false, GameManager.MistakeType.TIMEOUT)
	await get_tree().create_timer(1.5).timeout
	GameManager.complete_round(0.8)

func _on_round_completed(_result: Dictionary) -> void:
	_setup_round()

func _on_game_ended(_stats: Dictionary) -> void:
	get_tree().change_scene_to_file("res://scenes/Settlement.tscn")

func _on_quit() -> void:
	GameManager.save_persistent_data()
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")

func _make_style(color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_color = color
	style.corner_radius_bottom_left = 6
	style.corner_radius_bottom_right = 6
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	return style
