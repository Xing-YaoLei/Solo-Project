extends Control

var _current_tab: String = "basic"

var _color_bg := Color.hex(0x1a1a2eff)
var _color_accent := Color.hex(0xe94560ff)
var _color_secondary := Color.hex(0x16213eff)
var _color_text := Color.hex(0xeeeeeeff)
var _color_success := Color.hex(0x4ecca3ff)

@onready var _start_time_edit: LineEdit = %StartTimeEdit
@onready var _end_time_edit: LineEdit = %EndTimeEdit
@onready var _default_mode_option: OptionButton = %DefaultModeOption
@onready var _max_retries_spin: SpinBox = %MaxRetriesSpin
@onready var _photo_time_spin: SpinBox = %PhotoTimeSpin
@onready var _label_time_spin: SpinBox = %LabelTimeSpin
@onready var _address_time_spin: SpinBox = %AddressTimeSpin
@onready var _trajectory_time_spin: SpinBox = %TrajectoryTimeSpin
@onready var _score_correct_spin: SpinBox = %ScoreCorrectSpin
@onready var _score_penalty_spin: SpinBox = %ScorePenaltySpin
@onready var _pass_threshold_spin: SpinBox = %PassThresholdSpin
@onready var _tab_basic: Button = %TabBasic
@onready var _tab_questions: Button = %TabQuestions
@onready var _tab_materials: Button = %TabMaterials
@onready var _tab_rewards: Button = %TabRewards
@onready var _panel_basic: Control = %PanelBasic
@onready var _panel_questions: Control = %PanelQuestions
@onready var _panel_materials: Control = %PanelMaterials
@onready var _panel_rewards: Control = %PanelRewards
@onready var _questions_list: VBoxContainer = %QuestionsList
@onready var _materials_list: VBoxContainer = %MaterialsList
@onready var _rewards_list: VBoxContainer = %RewardsList
@onready var _save_btn: Button = %SaveBtn
@onready var _reset_btn: Button = %ResetBtn
@onready var _back_btn: Button = %BackBtn
@onready var _save_status: Label = %SaveStatus
@onready var _clear_data_btn: Button = %ClearDataBtn

func _ready() -> void:
	_setup_ui()
	_load_config()
	_connect_signals()
	_switch_tab("basic")

func _setup_ui() -> void:
	$Background.color = _color_bg
	$Title.add_theme_font_size_override("font_size", 32)
	$Title.add_theme_color_override("font_color", _color_accent)

	var tabs: Array = [_tab_basic, _tab_questions, _tab_materials, _tab_rewards]
	for tab in tabs:
		_style_tab_button(tab)

	var action_btns: Array = [_save_btn, _reset_btn, _back_btn, _clear_data_btn]
	for btn in action_btns:
		_style_action_button(btn)

	_default_mode_option.add_item("练习模式")
	_default_mode_option.add_item("考核模式")
	_default_mode_option.add_item("挑战模式")

	_max_retries_spin.min_value = 1
	_max_retries_spin.max_value = 10
	_max_retries_spin.step = 1

	for spin: SpinBox in [_photo_time_spin, _label_time_spin, _address_time_spin, _trajectory_time_spin]:
		spin.min_value = 5
		spin.max_value = 300
		spin.step = 5

	_score_correct_spin.min_value = 1
	_score_correct_spin.max_value = 100
	_score_correct_spin.step = 1

	_score_penalty_spin.min_value = 0
	_score_penalty_spin.max_value = 50
	_score_penalty_spin.step = 1

	_pass_threshold_spin.min_value = 0
	_pass_threshold_spin.max_value = 100
	_pass_threshold_spin.step = 5

	_save_status.text = ""

func _style_tab_button(btn: Button) -> void:
	var normal_style := StyleBoxFlat.new()
	normal_style.bg_color = _color_secondary
	normal_style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.3)
	normal_style.set_border_width_all(1)
	normal_style.set_corner_radius_top_left(8)
	normal_style.set_corner_radius_top_right(8)
	normal_style.content_margin_left = 20
	normal_style.content_margin_right = 20
	normal_style.content_margin_top = 10
	normal_style.content_margin_bottom = 10

	var hover_style := StyleBoxFlat.new()
	hover_style.bg_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.3)
	hover_style.border_color = _color_accent
	hover_style.set_border_width_all(1)
	hover_style.set_corner_radius_top_left(8)
	hover_style.set_corner_radius_top_right(8)
	hover_style.content_margin_left = 20
	hover_style.content_margin_right = 20
	hover_style.content_margin_top = 10
	hover_style.content_margin_bottom = 10

	var pressed_style := StyleBoxFlat.new()
	pressed_style.bg_color = _color_accent
	pressed_style.set_corner_radius_top_left(8)
	pressed_style.set_corner_radius_top_right(8)
	pressed_style.content_margin_left = 20
	pressed_style.content_margin_right = 20
	pressed_style.content_margin_top = 10
	pressed_style.content_margin_bottom = 10

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_stylebox_override("pressed", pressed_style)
	btn.add_theme_font_size_override("font_size", 16)
	btn.add_theme_color_override("font_color", _color_text)
	btn.add_theme_color_override("font_pressed_color", Color.WHITE)

func _style_action_button(btn: Button) -> void:
	var normal_style := StyleBoxFlat.new()
	normal_style.bg_color = _color_secondary
	normal_style.border_color = _color_accent
	normal_style.set_border_width_all(2)
	normal_style.set_corner_radius_all(8)
	normal_style.content_margin_left = 20
	normal_style.content_margin_right = 20
	normal_style.content_margin_top = 10
	normal_style.content_margin_bottom = 10

	var hover_style := StyleBoxFlat.new()
	hover_style.bg_color = _color_accent
	hover_style.set_corner_radius_all(8)
	hover_style.content_margin_left = 20
	hover_style.content_margin_right = 20
	hover_style.content_margin_top = 10
	hover_style.content_margin_bottom = 10

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_font_size_override("font_size", 16)
	btn.add_theme_color_override("font_color", _color_text)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)

func _connect_signals() -> void:
	_tab_basic.pressed.connect(func(): _switch_tab("basic"))
	_tab_questions.pressed.connect(func(): _switch_tab("questions"))
	_tab_materials.pressed.connect(func(): _switch_tab("materials"))
	_tab_rewards.pressed.connect(func(): _switch_tab("rewards"))
	_save_btn.pressed.connect(_on_save)
	_reset_btn.pressed.connect(_on_reset)
	_back_btn.pressed.connect(_on_back)
	_clear_data_btn.pressed.connect(_on_clear_data)

func _switch_tab(tab_name: String) -> void:
	_current_tab = tab_name
	_tab_basic.button_pressed = (tab_name == "basic")
	_tab_questions.button_pressed = (tab_name == "questions")
	_tab_materials.button_pressed = (tab_name == "materials")
	_tab_rewards.button_pressed = (tab_name == "rewards")

	_panel_basic.visible = (tab_name == "basic")
	_panel_questions.visible = (tab_name == "questions")
	_panel_materials.visible = (tab_name == "materials")
	_panel_rewards.visible = (tab_name == "rewards")

	if tab_name == "questions":
		_refresh_questions_list()
	elif tab_name == "materials":
		_refresh_materials_list()
	elif tab_name == "rewards":
		_refresh_rewards_list()

func _load_config() -> void:
	var cfg: Dictionary = ConfigManager.get_config()
	var open_time: Dictionary = cfg.get("open_time", {"start": "06:00", "end": "23:00"})
	_start_time_edit.text = open_time.get("start", "06:00")
	_end_time_edit.text = open_time.get("end", "23:00")

	var default_mode: String = cfg.get("training_mode", "practice")
	match default_mode:
		"practice": _default_mode_option.selected = 0
		"assessment": _default_mode_option.selected = 1
		"challenge": _default_mode_option.selected = 2

	_max_retries_spin.value = cfg.get("max_address_retries", 3)
	_photo_time_spin.value = cfg.get("photo_verification_time_limit", 30)
	_label_time_spin.value = cfg.get("label_selection_time_limit", 20)
	_address_time_spin.value = cfg.get("address_sorting_time_limit", 60)
	_trajectory_time_spin.value = cfg.get("trajectory_time_limit", 45)
	_score_correct_spin.value = cfg.get("score_per_correct", 10)
	_score_penalty_spin.value = cfg.get("score_penalty", 5)
	_pass_threshold_spin.value = cfg.get("pass_threshold", 60)

func _on_save() -> void:
	var modes: Array = ["practice", "assessment", "challenge"]
	ConfigManager.set_value("open_time", {
		"start": _start_time_edit.text.strip_edges(),
		"end": _end_time_edit.text.strip_edges()
	})
	ConfigManager.set_value("training_mode", modes[_default_mode_option.selected])
	ConfigManager.set_value("max_address_retries", int(_max_retries_spin.value))
	ConfigManager.set_value("photo_verification_time_limit", int(_photo_time_spin.value))
	ConfigManager.set_value("label_selection_time_limit", int(_label_time_spin.value))
	ConfigManager.set_value("address_sorting_time_limit", int(_address_time_spin.value))
	ConfigManager.set_value("trajectory_time_limit", int(_trajectory_time_spin.value))
	ConfigManager.set_value("score_per_correct", int(_score_correct_spin.value))
	ConfigManager.set_value("score_penalty", int(_score_penalty_spin.value))
	ConfigManager.set_value("pass_threshold", int(_pass_threshold_spin.value))

	ConfigManager.save_config()
	_show_save_status("✓ 配置已保存", _color_success)

func _on_reset() -> void:
	_load_config()
	_show_save_status("已重置为已保存的配置", _color_text)

func _on_clear_data() -> void:
	var confirm_dialog := AcceptDialog.new()
	confirm_dialog.title = "确认清除数据"
	confirm_dialog.dialog_text = "确定要清除所有训练记录和复盘数据吗？此操作不可撤销。"
	confirm_dialog.ok_button_text = "确定清除"
	confirm_dialog.cancel_button_text = "取消"
	add_child(confirm_dialog)
	confirm_dialog.confirmed.connect(func():
		TrainingRecordManager.clear_all_data()
		_show_save_status("✓ 所有数据已清除", _color_success)
	)
	confirm_dialog.canceled.connect(func():
		_show_save_status("已取消", _color_text)
	)
	confirm_dialog.popup_centered()

func _show_save_status(text: String, color: Color) -> void:
	_save_status.text = text
	_save_status.add_theme_color_override("font_color", color)
	get_tree().create_timer(3.0).timeout.connect(func():
		_save_status.text = ""
	)

func _refresh_questions_list() -> void:
	for child in _questions_list.get_children():
		child.queue_free()
	var questions: Array = ConfigManager.get_questions()
	if questions.is_empty():
		var empty := Label.new()
		empty.text = "暂无题目数据"
		empty.add_theme_font_size_override("font_size", 14)
		empty.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7, 1))
		_questions_list.add_child(empty)
		return
	for q in questions:
		_add_question_card(q)

func _add_question_card(q: Dictionary) -> void:
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(_color_secondary.r, _color_secondary.g, _color_secondary.b, 0.6)
	style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.2)
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.content_margin_left = 12
	style.content_margin_right = 12
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	panel.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)

	var qtype: String = q.get("type", "")
	var type_display: String = ""
	match qtype:
		"photo": type_display = "照片核验"
		"label": type_display = "标签选择"
		"address": type_display = "地址排序"
		"trajectory": type_display = "轨迹处理"
		_: type_display = qtype

	var header := Label.new()
	header.text = "[%s] %s" % [type_display, q.get("id", "")]
	header.add_theme_font_size_override("font_size", 14)
	header.add_theme_color_override("font_color", _color_accent)
	vbox.add_child(header)

	var desc_text: String = ""
	if qtype == "photo":
		desc_text = q.get("description", "")
	elif qtype == "label":
		desc_text = q.get("item_name", "") + ": " + q.get("description", "")
	elif qtype == "address":
		desc_text = q.get("order_name", "")
	elif qtype == "trajectory":
		desc_text = q.get("rider_name", "") + " - " + q.get("order_id", "")

	var desc := Label.new()
	desc.text = desc_text
	desc.add_theme_font_size_override("font_size", 13)
	desc.add_theme_color_override("font_color", _color_text)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(desc)

	panel.add_child(vbox)
	_questions_list.add_child(panel)

func _refresh_materials_list() -> void:
	for child in _materials_list.get_children():
		child.queue_free()
	var materials: Array = ConfigManager.get_materials()
	if materials.is_empty():
		var empty := Label.new()
		empty.text = "暂无素材数据"
		empty.add_theme_font_size_override("font_size", 14)
		empty.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7, 1))
		_materials_list.add_child(empty)
		return
	for m in materials:
		_add_material_card(m)

func _add_material_card(m: Dictionary) -> void:
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(_color_secondary.r, _color_secondary.g, _color_secondary.b, 0.6)
	style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.2)
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.content_margin_left = 12
	style.content_margin_right = 12
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	panel.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)

	var name := Label.new()
	name.text = m.get("name", "")
	name.add_theme_font_size_override("font_size", 14)
	name.add_theme_color_override("font_color", _color_accent)
	vbox.add_child(name)

	var desc := Label.new()
	desc.text = "[%s] %s" % [m.get("category", ""), m.get("description", "")]
	desc.add_theme_font_size_override("font_size", 13)
	desc.add_theme_color_override("font_color", _color_text)
	vbox.add_child(desc)

	panel.add_child(vbox)
	_materials_list.add_child(panel)

func _refresh_rewards_list() -> void:
	for child in _rewards_list.get_children():
		child.queue_free()
	var rewards: Array = ConfigManager.get_rewards()
	if rewards.is_empty():
		var empty := Label.new()
		empty.text = "暂无奖励数据"
		empty.add_theme_font_size_override("font_size", 14)
		empty.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7, 1))
		_rewards_list.add_child(empty)
		return
	for r in rewards:
		_add_reward_card(r)

func _add_reward_card(r: Dictionary) -> void:
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(_color_secondary.r, _color_secondary.g, _color_secondary.b, 0.6)
	style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.2)
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.content_margin_left = 12
	style.content_margin_right = 12
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	panel.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 4)

	var rtype: String = r.get("type", "")
	var type_display: String = "徽章" if rtype == "badge" else ("成就" if rtype == "achievement" else rtype)

	var name := Label.new()
	name.text = "[%s] %s" % [type_display, r.get("name", "")]
	name.add_theme_font_size_override("font_size", 14)
	name.add_theme_color_override("font_color", _color_accent)
	vbox.add_child(name)

	var desc := Label.new()
	desc.text = r.get("description", "") + " (阈值: " + str(r.get("threshold", 0)) + ")"
	desc.add_theme_font_size_override("font_size", 13)
	desc.add_theme_color_override("font_color", _color_text)
	vbox.add_child(desc)

	panel.add_child(vbox)
	_rewards_list.add_child(panel)

func _on_back() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu/main_menu.tscn")
