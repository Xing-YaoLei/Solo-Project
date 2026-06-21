extends Control

var _current_tab: String = "basic"
var _editing_index: int = -1
var _edit_dialog: AcceptDialog = null
var _edit_type: String = ""

var _color_bg := Color.hex(0x1a1a2eff)
var _color_accent := Color.hex(0xe94560ff)
var _color_secondary := Color.hex(0x16213eff)
var _color_text := Color.hex(0xeeeeeeff)
var _color_success := Color.hex(0x4ecca3ff)
var _color_warning := Color.hex(0xffc857ff)

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
@onready var _add_question_btn: Button = %AddQuestionBtn
@onready var _add_material_btn: Button = %AddMaterialBtn
@onready var _add_reward_btn: Button = %AddRewardBtn
@onready var _reset_questions_btn: Button = %ResetQuestionsBtn
@onready var _reset_materials_btn: Button = %ResetMaterialsBtn
@onready var _reset_rewards_btn: Button = %ResetRewardsBtn

func _ready() -> void:
	_setup_ui()
	_load_config()
	_connect_signals()
	_switch_tab("basic")

func _setup_ui() -> void:
	$Background.color = _color_bg

	var tabs: Array = [_tab_basic, _tab_questions, _tab_materials, _tab_rewards]
	for tab in tabs:
		_style_tab_button(tab)

	var action_btns: Array = [_save_btn, _reset_btn, _back_btn, _clear_data_btn]
	for btn in action_btns:
		_style_action_button(btn)

	var add_btns: Array = [_add_question_btn, _add_material_btn, _add_reward_btn]
	for btn in add_btns:
		_style_add_button(btn)

	var reset_btns: Array = [_reset_questions_btn, _reset_materials_btn, _reset_rewards_btn]
	for btn in reset_btns:
		_style_small_button(btn)

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

	ConfigManager.questions_changed.connect(_on_questions_changed)
	ConfigManager.materials_changed.connect(_on_materials_changed)
	ConfigManager.rewards_changed.connect(_on_rewards_changed)

func _style_tab_button(btn: Button) -> void:
	var normal_style := StyleBoxFlat.new()
	normal_style.bg_color = _color_secondary
	normal_style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.3)
	normal_style.set_border_width_all(1)
	normal_style.set_corner_radius_top_left(8)
	normal_style.set_corner_radius_top_right(8)
	normal_style.content_margin_left = 16
	normal_style.content_margin_right = 16
	normal_style.content_margin_top = 8
	normal_style.content_margin_bottom = 8

	var hover_style := StyleBoxFlat.new()
	hover_style.bg_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.3)
	hover_style.border_color = _color_accent
	hover_style.set_border_width_all(1)
	hover_style.set_corner_radius_top_left(8)
	hover_style.set_corner_radius_top_right(8)
	hover_style.content_margin_left = 16
	hover_style.content_margin_right = 16
	hover_style.content_margin_top = 8
	hover_style.content_margin_bottom = 8

	var pressed_style := StyleBoxFlat.new()
	pressed_style.bg_color = _color_accent
	pressed_style.set_corner_radius_top_left(8)
	pressed_style.set_corner_radius_top_right(8)
	pressed_style.content_margin_left = 16
	pressed_style.content_margin_right = 16
	pressed_style.content_margin_top = 8
	pressed_style.content_margin_bottom = 8

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_stylebox_override("pressed", pressed_style)
	btn.add_theme_font_size_override("font_size", 14)
	btn.add_theme_color_override("font_color", _color_text)
	btn.add_theme_color_override("font_pressed_color", Color.WHITE)

func _style_action_button(btn: Button) -> void:
	var normal_style := StyleBoxFlat.new()
	normal_style.bg_color = _color_secondary
	normal_style.border_color = _color_accent
	normal_style.set_border_width_all(2)
	normal_style.set_corner_radius_all(8)
	normal_style.content_margin_left = 16
	normal_style.content_margin_right = 16
	normal_style.content_margin_top = 8
	normal_style.content_margin_bottom = 8

	var hover_style := StyleBoxFlat.new()
	hover_style.bg_color = _color_accent
	hover_style.set_corner_radius_all(8)
	hover_style.content_margin_left = 16
	hover_style.content_margin_right = 16
	hover_style.content_margin_top = 8
	hover_style.content_margin_bottom = 8

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_font_size_override("font_size", 14)
	btn.add_theme_color_override("font_color", _color_text)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)

func _style_add_button(btn: Button) -> void:
	var normal_style := StyleBoxFlat.new()
	normal_style.bg_color = _color_success
	normal_style.set_corner_radius_all(8)
	normal_style.content_margin_left = 16
	normal_style.content_margin_right = 16
	normal_style.content_margin_top = 8
	normal_style.content_margin_bottom = 8

	var hover_style := StyleBoxFlat.new()
	hover_style.bg_color = Color(_color_success.r * 0.8, _color_success.g * 0.8, _color_success.b * 0.8, 1.0)
	hover_style.set_corner_radius_all(8)
	hover_style.content_margin_left = 16
	hover_style.content_margin_right = 16
	hover_style.content_margin_top = 8
	hover_style.content_margin_bottom = 8

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_font_size_override("font_size", 14)
	btn.add_theme_color_override("font_color", Color(0, 0, 0))

func _style_small_button(btn: Button) -> void:
	var normal_style := StyleBoxFlat.new()
	normal_style.bg_color = _color_secondary
	normal_style.border_color = Color(_color_warning.r, _color_warning.g, _color_warning.b, 0.5)
	normal_style.set_border_width_all(1)
	normal_style.set_corner_radius_all(6)
	normal_style.content_margin_left = 10
	normal_style.content_margin_right = 10
	normal_style.content_margin_top = 5
	normal_style.content_margin_bottom = 5

	var hover_style := StyleBoxFlat.new()
	hover_style.bg_color = Color(_color_warning.r, _color_warning.g, _color_warning.b, 0.2)
	hover_style.border_color = _color_warning
	hover_style.set_border_width_all(1)
	hover_style.set_corner_radius_all(6)
	hover_style.content_margin_left = 10
	hover_style.content_margin_right = 10
	hover_style.content_margin_top = 5
	hover_style.content_margin_bottom = 5

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_font_size_override("font_size", 12)
	btn.add_theme_color_override("font_color", _color_warning)

func _connect_signals() -> void:
	_tab_basic.pressed.connect(func(): _switch_tab("basic"))
	_tab_questions.pressed.connect(func(): _switch_tab("questions"))
	_tab_materials.pressed.connect(func(): _switch_tab("materials"))
	_tab_rewards.pressed.connect(func(): _switch_tab("rewards"))
	_save_btn.pressed.connect(_on_save)
	_reset_btn.pressed.connect(_on_reset)
	_back_btn.pressed.connect(_on_back)
	_clear_data_btn.pressed.connect(_on_clear_data)
	_add_question_btn.pressed.connect(func(): _open_question_editor(-1))
	_add_material_btn.pressed.connect(func(): _open_material_editor(-1))
	_add_reward_btn.pressed.connect(func(): _open_reward_editor(-1))
	_reset_questions_btn.pressed.connect(_on_reset_questions)
	_reset_materials_btn.pressed.connect(_on_reset_materials)
	_reset_rewards_btn.pressed.connect(_on_reset_rewards)

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
	_confirm_dialog("确认清除数据", "确定要清除所有训练记录和复盘数据吗？此操作不可撤销。", func():
		TrainingRecordManager.clear_all_data()
		_show_save_status("✓ 所有数据已清除", _color_success)
	)

func _on_reset_questions() -> void:
	_confirm_dialog("重置题目", "确定要将题目重置为默认吗？您的自定义题目将被清除。", func():
		ConfigManager.reset_questions_to_default()
		_show_save_status("✓ 题目已重置为默认", _color_success)
	)

func _on_reset_materials() -> void:
	_confirm_dialog("重置素材", "确定要将素材重置为默认吗？您的自定义素材将被清除。", func():
		ConfigManager.reset_materials_to_default()
		_show_save_status("✓ 素材已重置为默认", _color_success)
	)

func _on_reset_rewards() -> void:
	_confirm_dialog("重置奖励", "确定要将奖励重置为默认吗？您的自定义奖励将被清除。", func():
		ConfigManager.reset_rewards_to_default()
		_show_save_status("✓ 奖励已重置为默认", _color_success)
	)

func _confirm_dialog(title: String, message: String, on_ok: Callable) -> void:
	var dialog: AcceptDialog = AcceptDialog.new()
	dialog.title = title
	dialog.dialog_text = message
	dialog.ok_button_text = "确定"
	dialog.cancel_button_text = "取消"
	add_child(dialog)
	dialog.confirmed.connect(on_ok)
	dialog.popup_centered()

func _show_save_status(text: String, color: Color) -> void:
	_save_status.text = text
	_save_status.add_theme_color_override("font_color", color)
	get_tree().create_timer(3.0).timeout.connect(func():
		_save_status.text = ""
	)

func _on_questions_changed() -> void:
	if _current_tab == "questions":
		_refresh_questions_list()

func _on_materials_changed() -> void:
	if _current_tab == "materials":
		_refresh_materials_list()

func _on_rewards_changed() -> void:
	if _current_tab == "rewards":
		_refresh_rewards_list()

func _refresh_questions_list() -> void:
	for child in _questions_list.get_children():
		child.queue_free()
	var questions: Array = ConfigManager.get_questions()
	if questions.is_empty():
		_empty_label(_questions_list, "暂无题目数据")
		return
	for i in range(questions.size()):
		_add_question_card(i, questions[i])

func _add_question_card(index: int, q: Dictionary) -> void:
	var panel: PanelContainer = _make_card_panel()
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 12)

	var info_vbox := VBoxContainer.new()
	info_vbox.size_flags_horizontal = 3
	info_vbox.add_theme_constant_override("separation", 2)

	var qtype: String = q.get("type", "")
	var type_display: String = _question_type_name(qtype)
	var title := Label.new()
	title.text = "[%s] %s" % [type_display, q.get("id", "")]
	title.add_theme_font_size_override("font_size", 14)
	title.add_theme_color_override("font_color", _color_accent)
	info_vbox.add_child(title)

	var desc_text: String = _question_desc(q)
	var desc := Label.new()
	desc.text = desc_text
	desc.add_theme_font_size_override("font_size", 12)
	desc.add_theme_color_override("font_color", _color_text)
	desc.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	info_vbox.add_child(desc)

	hbox.add_child(info_vbox)

	var btn_hbox := HBoxContainer.new()
	btn_hbox.add_theme_constant_override("separation", 6)

	var edit_btn: Button = Button.new()
	edit_btn.text = "编辑"
	_style_mini_button(edit_btn, _color_success)
	edit_btn.pressed.connect(func(): _open_question_editor(index))
	btn_hbox.add_child(edit_btn)

	var del_btn: Button = Button.new()
	del_btn.text = "删除"
	_style_mini_button(del_btn, _color_accent)
	del_btn.pressed.connect(func(): _delete_question(index))
	btn_hbox.add_child(del_btn)

	hbox.add_child(btn_hbox)

	panel.add_child(hbox)
	_questions_list.add_child(panel)

func _question_type_name(qtype: String) -> String:
	match qtype:
		"photo": return "照片核验"
		"label": return "标签选择"
		"address": return "地址排序"
		"trajectory": return "轨迹处理"
		_: return qtype

func _question_desc(q: Dictionary) -> String:
	var qtype: String = q.get("type", "")
	match qtype:
		"photo": return q.get("description", "")
		"label": return q.get("item_name", "") + ": " + q.get("description", "")
		"address": return q.get("order_name", "")
		"trajectory": return q.get("rider_name", "") + " - " + q.get("order_id", "")
		_: return ""

func _refresh_materials_list() -> void:
	for child in _materials_list.get_children():
		child.queue_free()
	var materials: Array = ConfigManager.get_materials()
	if materials.is_empty():
		_empty_label(_materials_list, "暂无素材数据")
		return
	for i in range(materials.size()):
		_add_material_card(i, materials[i])

func _add_material_card(index: int, m: Dictionary) -> void:
	var panel: PanelContainer = _make_card_panel()
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 12)

	var info_vbox := VBoxContainer.new()
	info_vbox.size_flags_horizontal = 3
	info_vbox.add_theme_constant_override("separation", 2)

	var title := Label.new()
	title.text = m.get("name", "")
	title.add_theme_font_size_override("font_size", 14)
	title.add_theme_color_override("font_color", _color_accent)
	info_vbox.add_child(title)

	var desc := Label.new()
	desc.text = "[%s] %s" % [m.get("category", ""), m.get("description", "")]
	desc.add_theme_font_size_override("font_size", 12)
	desc.add_theme_color_override("font_color", _color_text)
	info_vbox.add_child(desc)

	hbox.add_child(info_vbox)

	var btn_hbox := HBoxContainer.new()
	btn_hbox.add_theme_constant_override("separation", 6)

	var edit_btn: Button = Button.new()
	edit_btn.text = "编辑"
	_style_mini_button(edit_btn, _color_success)
	edit_btn.pressed.connect(func(): _open_material_editor(index))
	btn_hbox.add_child(edit_btn)

	var del_btn: Button = Button.new()
	del_btn.text = "删除"
	_style_mini_button(del_btn, _color_accent)
	del_btn.pressed.connect(func(): _delete_material(index))
	btn_hbox.add_child(del_btn)

	hbox.add_child(btn_hbox)

	panel.add_child(hbox)
	_materials_list.add_child(panel)

func _refresh_rewards_list() -> void:
	for child in _rewards_list.get_children():
		child.queue_free()
	var rewards: Array = ConfigManager.get_rewards()
	if rewards.is_empty():
		_empty_label(_rewards_list, "暂无奖励数据")
		return
	for i in range(rewards.size()):
		_add_reward_card(i, rewards[i])

func _add_reward_card(index: int, r: Dictionary) -> void:
	var panel: PanelContainer = _make_card_panel()
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 12)

	var info_vbox := VBoxContainer.new()
	info_vbox.size_flags_horizontal = 3
	info_vbox.add_theme_constant_override("separation", 2)

	var rtype: String = r.get("type", "")
	var type_display: String = "徽章" if rtype == "badge" else ("成就" if rtype == "achievement" else rtype)
	var title := Label.new()
	title.text = "[%s] %s" % [type_display, r.get("name", "")]
	title.add_theme_font_size_override("font_size", 14)
	title.add_theme_color_override("font_color", _color_accent)
	info_vbox.add_child(title)

	var desc := Label.new()
	desc.text = r.get("description", "") + " (阈值: " + str(r.get("threshold", 0)) + ")"
	desc.add_theme_font_size_override("font_size", 12)
	desc.add_theme_color_override("font_color", _color_text)
	info_vbox.add_child(desc)

	hbox.add_child(info_vbox)

	var btn_hbox := HBoxContainer.new()
	btn_hbox.add_theme_constant_override("separation", 6)

	var edit_btn: Button = Button.new()
	edit_btn.text = "编辑"
	_style_mini_button(edit_btn, _color_success)
	edit_btn.pressed.connect(func(): _open_reward_editor(index))
	btn_hbox.add_child(edit_btn)

	var del_btn: Button = Button.new()
	del_btn.text = "删除"
	_style_mini_button(del_btn, _color_accent)
	del_btn.pressed.connect(func(): _delete_reward(index))
	btn_hbox.add_child(del_btn)

	hbox.add_child(btn_hbox)

	panel.add_child(hbox)
	_rewards_list.add_child(panel)

func _make_card_panel() -> PanelContainer:
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(_color_secondary.r, _color_secondary.g, _color_secondary.b, 0.6)
	style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.2)
	style.set_border_width_all(1)
	style.set_corner_radius_all(6)
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	panel.add_theme_stylebox_override("panel", style)
	return panel

func _style_mini_button(btn: Button, color: Color) -> void:
	var normal_style := StyleBoxFlat.new()
	normal_style.bg_color = Color(color.r, color.g, color.b, 0.2)
	normal_style.border_color = color
	normal_style.set_border_width_all(1)
	normal_style.set_corner_radius_all(4)
	normal_style.content_margin_left = 8
	normal_style.content_margin_right = 8
	normal_style.content_margin_top = 4
	normal_style.content_margin_bottom = 4

	var hover_style := StyleBoxFlat.new()
	hover_style.bg_color = color
	hover_style.set_corner_radius_all(4)
	hover_style.content_margin_left = 8
	hover_style.content_margin_right = 8
	hover_style.content_margin_top = 4
	hover_style.content_margin_bottom = 4

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_font_size_override("font_size", 12)
	btn.add_theme_color_override("font_color", color)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)

func _empty_label(container: VBoxContainer, text: String) -> void:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 14)
	label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7, 1))
	container.add_child(label)

func _open_question_editor(index: int) -> void:
	_editing_index = index
	_edit_type = "question"
	var questions: Array = ConfigManager.get_questions()
	var q: Dictionary = {}
	if index >= 0 and index < questions.size():
		q = questions[index].duplicate()
	else:
		q = {
			"id": "new_question_%d" % Time.get_unix_time_from_system(),
			"type": "photo",
			"description": "",
			"image_path": "",
			"correct_answer": "intact",
			"damage_reason": ""
		}
	_show_edit_dialog("题目编辑器", _build_question_form(q), func(): _save_question_editor(q))

func _build_question_form(q: Dictionary) -> VBoxContainer:
	var form := VBoxContainer.new()
	form.add_theme_constant_override("separation", 10)
	form.custom_minimum_size = Vector2(480, 0)

	var id_edit: LineEdit = _add_form_field(form, "题目ID", q.get("id", ""))
	id_edit.text_changed.connect(func(t): q["id"] = t)

	var type_option: OptionButton = OptionButton.new()
	type_option.add_item("照片核验")
	type_option.add_item("标签选择")
	type_option.add_item("地址排序")
	type_option.add_item("轨迹处理")
	var type_idx: int = 0
	match q.get("type", "photo"):
		"photo": type_idx = 0
		"label": type_idx = 1
		"address": type_idx = 2
		"trajectory": type_idx = 3
	type_option.select(type_idx)
	type_option.item_selected.connect(func(idx):
		var types: Array = ["photo", "label", "address", "trajectory"]
		q["type"] = types[idx]
	)
	var type_hbox := _form_row("题目类型", type_option)
	form.add_child(type_hbox)

	var desc_edit: LineEdit = _add_form_field(form, "描述", q.get("description", ""))
	desc_edit.text_changed.connect(func(t): q["description"] = t)

	var img_edit: LineEdit = _add_form_field(form, "图片路径", q.get("image_path", ""))
	img_edit.text_changed.connect(func(t): q["image_path"] = t)

	var answer_option: OptionButton = OptionButton.new()
	answer_option.add_item("完好/正常")
	answer_option.add_item("损坏/异常")
	var ans_idx: int = 0
	var correct_val: String = q.get("correct_answer", q.get("correct_judgment", ""))
	if correct_val == "damaged" or correct_val == "abnormal":
		ans_idx = 1
	answer_option.select(ans_idx)
	answer_option.item_selected.connect(func(idx):
		var qtype: String = q.get("type", "photo")
		if qtype == "photo":
			q["correct_answer"] = "intact" if idx == 0 else "damaged"
		else:
			q["correct_judgment"] = "normal" if idx == 0 else "abnormal"
	)
	var ans_hbox := _form_row("正确答案", answer_option)
	form.add_child(ans_hbox)

	var reason_edit: LineEdit = _add_form_field(form, "损坏/异常原因", q.get("damage_reason", q.get("anomaly_reason", "")))
	reason_edit.text_changed.connect(func(t):
		q["damage_reason"] = t
		q["anomaly_reason"] = t
	)

	return form

func _add_form_field(form: VBoxContainer, label: String, value: String) -> LineEdit:
	var edit: LineEdit = LineEdit.new()
	edit.text = value
	edit.add_theme_font_size_override("font_size", 14)
	edit.custom_minimum_size = Vector2(0, 32)
	var row: HBoxContainer = _form_row(label, edit)
	form.add_child(row)
	return edit

func _form_row(label: String, control: Control) -> HBoxContainer:
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 12)

	var lbl := Label.new()
	lbl.text = label
	lbl.custom_minimum_size = Vector2(120, 0)
	lbl.add_theme_font_size_override("font_size", 14)
	lbl.add_theme_color_override("font_color", _color_text)
	hbox.add_child(lbl)

	control.size_flags_horizontal = 3
	hbox.add_child(control)

	return hbox

func _save_question_editor(q: Dictionary) -> void:
	if _editing_index >= 0:
		ConfigManager.update_question(_editing_index, q)
	else:
		ConfigManager.add_question(q)
	_show_save_status("✓ 题目已保存", _color_success)

func _delete_question(index: int) -> void:
	_confirm_dialog("删除题目", "确定要删除这个题目吗？", func():
		ConfigManager.delete_question(index)
		_show_save_status("✓ 题目已删除", _color_success)
	)

func _open_material_editor(index: int) -> void:
	_editing_index = index
	_edit_type = "material"
	var materials: Array = ConfigManager.get_materials()
	var m: Dictionary = {}
	if index >= 0 and index < materials.size():
		m = materials[index].duplicate()
	else:
		m = {
			"id": "new_mat_%d" % Time.get_unix_time_from_system(),
			"name": "新素材",
			"category": "photo",
			"type": "intact",
			"description": "",
			"path": ""
		}
	_show_edit_dialog("素材编辑器", _build_material_form(m), func(): _save_material_editor(m))

func _build_material_form(m: Dictionary) -> VBoxContainer:
	var form := VBoxContainer.new()
	form.add_theme_constant_override("separation", 10)
	form.custom_minimum_size = Vector2(480, 0)

	var id_edit: LineEdit = _add_form_field(form, "素材ID", m.get("id", ""))
	id_edit.text_changed.connect(func(t): m["id"] = t)

	var name_edit: LineEdit = _add_form_field(form, "名称", m.get("name", ""))
	name_edit.text_changed.connect(func(t): m["name"] = t)

	var cat_option: OptionButton = OptionButton.new()
	cat_option.add_item("photo")
	cat_option.add_item("trajectory")
	var cat_idx: int = 0
	if m.get("category", "") == "trajectory":
		cat_idx = 1
	cat_option.select(cat_idx)
	cat_option.item_selected.connect(func(idx):
		var cats: Array = ["photo", "trajectory"]
		m["category"] = cats[idx]
	)
	var cat_hbox := _form_row("分类", cat_option)
	form.add_child(cat_hbox)

	var type_edit: LineEdit = _add_form_field(form, "类型", m.get("type", ""))
	type_edit.text_changed.connect(func(t): m["type"] = t)

	var desc_edit: LineEdit = _add_form_field(form, "描述", m.get("description", ""))
	desc_edit.text_changed.connect(func(t): m["description"] = t)

	var path_edit: LineEdit = _add_form_field(form, "素材路径", m.get("path", ""))
	path_edit.text_changed.connect(func(t): m["path"] = t)

	return form

func _save_material_editor(m: Dictionary) -> void:
	if _editing_index >= 0:
		ConfigManager.update_material(_editing_index, m)
	else:
		ConfigManager.add_material(m)
	_show_save_status("✓ 素材已保存", _color_success)

func _delete_material(index: int) -> void:
	_confirm_dialog("删除素材", "确定要删除这个素材吗？", func():
		ConfigManager.delete_material(index)
		_show_save_status("✓ 素材已删除", _color_success)
	)

func _open_reward_editor(index: int) -> void:
	_editing_index = index
	_edit_type = "reward"
	var rewards: Array = ConfigManager.get_rewards()
	var r: Dictionary = {}
	if index >= 0 and index < rewards.size():
		r = rewards[index].duplicate()
	else:
		r = {
			"id": "new_rw_%d" % Time.get_unix_time_from_system(),
			"name": "新奖励",
			"type": "badge",
			"condition": "total_score",
			"threshold": 100,
			"description": "",
			"icon": ""
		}
	_show_edit_dialog("奖励编辑器", _build_reward_form(r), func(): _save_reward_editor(r))

func _build_reward_form(r: Dictionary) -> VBoxContainer:
	var form := VBoxContainer.new()
	form.add_theme_constant_override("separation", 10)
	form.custom_minimum_size = Vector2(480, 0)

	var id_edit: LineEdit = _add_form_field(form, "奖励ID", r.get("id", ""))
	id_edit.text_changed.connect(func(t): r["id"] = t)

	var name_edit: LineEdit = _add_form_field(form, "名称", r.get("name", ""))
	name_edit.text_changed.connect(func(t): r["name"] = t)

	var type_option: OptionButton = OptionButton.new()
	type_option.add_item("badge")
	type_option.add_item("achievement")
	var type_idx: int = 0
	if r.get("type", "") == "achievement":
		type_idx = 1
	type_option.select(type_idx)
	type_option.item_selected.connect(func(idx):
		var types: Array = ["badge", "achievement"]
		r["type"] = types[idx]
	)
	var type_hbox := _form_row("类型", type_option)
	form.add_child(type_hbox)

	var cond_edit: LineEdit = _add_form_field(form, "条件", r.get("condition", ""))
	cond_edit.text_changed.connect(func(t): r["condition"] = t)

	var threshold_spin: SpinBox = SpinBox.new()
	threshold_spin.min_value = 0
	threshold_spin.max_value = 9999
	threshold_spin.value = r.get("threshold", 0)
	threshold_spin.value_changed.connect(func(v): r["threshold"] = int(v))
	var thr_hbox := _form_row("阈值", threshold_spin)
	form.add_child(thr_hbox)

	var desc_edit: LineEdit = _add_form_field(form, "描述", r.get("description", ""))
	desc_edit.text_changed.connect(func(t): r["description"] = t)

	return form

func _save_reward_editor(r: Dictionary) -> void:
	if _editing_index >= 0:
		ConfigManager.update_reward(_editing_index, r)
	else:
		ConfigManager.add_reward(r)
	_show_save_status("✓ 奖励已保存", _color_success)

func _delete_reward(index: int) -> void:
	_confirm_dialog("删除奖励", "确定要删除这个奖励吗？", func():
		ConfigManager.delete_reward(index)
		_show_save_status("✓ 奖励已删除", _color_success)
	)

func _show_edit_dialog(title: String, content: VBoxContainer, on_save: Callable) -> void:
	if _edit_dialog:
		_edit_dialog.queue_free()
		_edit_dialog = null

	var dialog := AcceptDialog.new()
	dialog.title = title
	dialog.ok_button_text = "保存"
	dialog.cancel_button_text = "取消"

	var scroll := ScrollContainer.new()
	scroll.custom_minimum_size = Vector2(520, 400)
	scroll.horizontal_scroll_mode = 0
	scroll.add_child(content)

	dialog.add_child(scroll)
	add_child(dialog)
	dialog.confirmed.connect(on_save)
	dialog.popup_centered()
	_edit_dialog = dialog

func _on_back() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu/main_menu.tscn")
