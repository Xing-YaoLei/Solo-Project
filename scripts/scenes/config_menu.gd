extends Control

var _current_tab: String = "basic"
var _editing_index: int = -1
var _edit_dialog: ConfirmationDialog = null

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
	var ns := StyleBoxFlat.new()
	ns.bg_color = _color_secondary
	ns.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.3)
	ns.set_border_width_all(1)
	ns.set_corner_radius_top_left(8)
	ns.set_corner_radius_top_right(8)
	ns.content_margin_left = 16
	ns.content_margin_right = 16
	ns.content_margin_top = 8
	ns.content_margin_bottom = 8
	var hs := StyleBoxFlat.new()
	hs.bg_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.3)
	hs.border_color = _color_accent
	hs.set_border_width_all(1)
	hs.set_corner_radius_top_left(8)
	hs.set_corner_radius_top_right(8)
	hs.content_margin_left = 16
	hs.content_margin_right = 16
	hs.content_margin_top = 8
	hs.content_margin_bottom = 8
	var ps := StyleBoxFlat.new()
	ps.bg_color = _color_accent
	ps.set_corner_radius_top_left(8)
	ps.set_corner_radius_top_right(8)
	ps.content_margin_left = 16
	ps.content_margin_right = 16
	ps.content_margin_top = 8
	ps.content_margin_bottom = 8
	btn.add_theme_stylebox_override("normal", ns)
	btn.add_theme_stylebox_override("hover", hs)
	btn.add_theme_stylebox_override("pressed", ps)
	btn.add_theme_font_size_override("font_size", 14)
	btn.add_theme_color_override("font_color", _color_text)
	btn.add_theme_color_override("font_pressed_color", Color.WHITE)

func _style_action_button(btn: Button) -> void:
	var ns := StyleBoxFlat.new()
	ns.bg_color = _color_secondary
	ns.border_color = _color_accent
	ns.set_border_width_all(2)
	ns.set_corner_radius_all(8)
	ns.content_margin_left = 16
	ns.content_margin_right = 16
	ns.content_margin_top = 8
	ns.content_margin_bottom = 8
	var hs := StyleBoxFlat.new()
	hs.bg_color = _color_accent
	hs.set_corner_radius_all(8)
	hs.content_margin_left = 16
	hs.content_margin_right = 16
	hs.content_margin_top = 8
	hs.content_margin_bottom = 8
	btn.add_theme_stylebox_override("normal", ns)
	btn.add_theme_stylebox_override("hover", hs)
	btn.add_theme_font_size_override("font_size", 14)
	btn.add_theme_color_override("font_color", _color_text)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)

func _style_add_button(btn: Button) -> void:
	var ns := StyleBoxFlat.new()
	ns.bg_color = _color_success
	ns.set_corner_radius_all(8)
	ns.content_margin_left = 16
	ns.content_margin_right = 16
	ns.content_margin_top = 8
	ns.content_margin_bottom = 8
	var hs := StyleBoxFlat.new()
	hs.bg_color = Color(_color_success.r * 0.8, _color_success.g * 0.8, _color_success.b * 0.8, 1.0)
	hs.set_corner_radius_all(8)
	hs.content_margin_left = 16
	hs.content_margin_right = 16
	hs.content_margin_top = 8
	hs.content_margin_bottom = 8
	btn.add_theme_stylebox_override("normal", ns)
	btn.add_theme_stylebox_override("hover", hs)
	btn.add_theme_font_size_override("font_size", 14)
	btn.add_theme_color_override("font_color", Color(0, 0, 0))

func _style_small_button(btn: Button) -> void:
	var ns := StyleBoxFlat.new()
	ns.bg_color = _color_secondary
	ns.border_color = Color(_color_warning.r, _color_warning.g, _color_warning.b, 0.5)
	ns.set_border_width_all(1)
	ns.set_corner_radius_all(6)
	ns.content_margin_left = 10
	ns.content_margin_right = 10
	ns.content_margin_top = 5
	ns.content_margin_bottom = 5
	var hs := StyleBoxFlat.new()
	hs.bg_color = Color(_color_warning.r, _color_warning.g, _color_warning.b, 0.2)
	hs.border_color = _color_warning
	hs.set_border_width_all(1)
	hs.set_corner_radius_all(6)
	hs.content_margin_left = 10
	hs.content_margin_right = 10
	hs.content_margin_top = 5
	hs.content_margin_bottom = 5
	btn.add_theme_stylebox_override("normal", ns)
	btn.add_theme_stylebox_override("hover", hs)
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
	ConfigManager.set_value("open_time", {"start": _start_time_edit.text.strip_edges(), "end": _end_time_edit.text.strip_edges()})
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
	_show_save_status("配置已保存", _color_success)

func _on_reset() -> void:
	_load_config()
	_show_save_status("已重置为已保存的配置", _color_text)

func _on_clear_data() -> void:
	_show_confirm("确认清除数据", "确定要清除所有训练记录和复盘数据吗？\n此操作不可撤销。", func():
		TrainingRecordManager.clear_all_data()
		_show_save_status("所有数据已清除", _color_success)
	)

func _on_reset_questions() -> void:
	_show_confirm("重置题目", "确定要将题目重置为默认吗？\n您的自定义题目将被清除。", func():
		ConfigManager.reset_questions_to_default()
		_show_save_status("题目已重置为默认", _color_success)
	)

func _on_reset_materials() -> void:
	_show_confirm("重置素材", "确定要将素材重置为默认吗？\n您的自定义素材将被清除。", func():
		ConfigManager.reset_materials_to_default()
		_show_save_status("素材已重置为默认", _color_success)
	)

func _on_reset_rewards() -> void:
	_show_confirm("重置奖励", "确定要将奖励重置为默认吗？\n您的自定义奖励将被清除。", func():
		ConfigManager.reset_rewards_to_default()
		_show_save_status("奖励已重置为默认", _color_success)
	)

func _show_confirm(title: String, message: String, on_confirmed: Callable) -> void:
	var dialog := ConfirmationDialog.new()
	dialog.title = title
	dialog.dialog_text = message
	dialog.ok_button_text = "确定"
	dialog.cancel_button_text = "取消"
	dialog.min_size = Vector2(360, 160)
	add_child(dialog)
	dialog.confirmed.connect(on_confirmed)
	dialog.popup_centered()
	dialog.close_requested.connect(func(): dialog.queue_free())
	dialog.canceled.connect(func(): dialog.queue_free())

func _show_save_status(text: String, color: Color) -> void:
	_save_status.text = text
	_save_status.add_theme_color_override("font_color", color)
	get_tree().create_timer(3.0).timeout.connect(func(): _save_status.text = "")

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
	var title := Label.new()
	title.text = "[%s] %s" % [_type_name(qtype), q.get("id", "")]
	title.add_theme_font_size_override("font_size", 14)
	title.add_theme_color_override("font_color", _color_accent)
	info_vbox.add_child(title)
	var desc := Label.new()
	desc.text = _question_desc(q)
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

func _type_name(qtype: String) -> String:
	match qtype:
		"photo": return "照片核验"
		"label": return "标签选择"
		"address": return "地址排序"
		"trajectory": return "轨迹处理"
		_: return qtype

func _question_desc(q: Dictionary) -> String:
	match q.get("type", ""):
		"photo": return q.get("description", "")
		"label": return q.get("item_name", "") + ": " + q.get("description", "")
		"address":
			var addrs: Array = q.get("addresses", [])
			return q.get("order_name", "") + " (%d个地址)" % addrs.size()
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
	var ns := StyleBoxFlat.new()
	ns.bg_color = Color(color.r, color.g, color.b, 0.2)
	ns.border_color = color
	ns.set_border_width_all(1)
	ns.set_corner_radius_all(4)
	ns.content_margin_left = 8
	ns.content_margin_right = 8
	ns.content_margin_top = 4
	ns.content_margin_bottom = 4
	var hs := StyleBoxFlat.new()
	hs.bg_color = color
	hs.set_corner_radius_all(4)
	hs.content_margin_left = 8
	hs.content_margin_right = 8
	hs.content_margin_top = 4
	hs.content_margin_bottom = 4
	btn.add_theme_stylebox_override("normal", ns)
	btn.add_theme_stylebox_override("hover", hs)
	btn.add_theme_font_size_override("font_size", 12)
	btn.add_theme_color_override("font_color", color)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)

func _empty_label(container: VBoxContainer, text: String) -> void:
	var label := Label.new()
	label.text = text
	label.add_theme_font_size_override("font_size", 14)
	label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7, 1))
	container.add_child(label)

func _form_row(label: String, control: Control) -> HBoxContainer:
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 12)
	var lbl := Label.new()
	lbl.text = label
	lbl.custom_minimum_size = Vector2(130, 0)
	lbl.add_theme_font_size_override("font_size", 14)
	lbl.add_theme_color_override("font_color", _color_text)
	hbox.add_child(lbl)
	control.size_flags_horizontal = 3
	hbox.add_child(control)
	return hbox

func _form_field(form: VBoxContainer, label: String, value: String) -> LineEdit:
	var edit: LineEdit = LineEdit.new()
	edit.text = value
	edit.add_theme_font_size_override("font_size", 14)
	edit.custom_minimum_size = Vector2(0, 32)
	form.add_child(_form_row(label, edit))
	return edit

func _form_multiline(form: VBoxContainer, label: String, value: String) -> TextEdit:
	var edit := TextEdit.new()
	edit.text = value
	edit.add_theme_font_size_override("font_size", 13)
	edit.custom_minimum_size = Vector2(0, 80)
	edit.wrap_mode = TextEdit.LINE_WRAP_WORD
	edit.add_theme_color_override("font_color", _color_text)
	form.add_child(_form_row(label, edit))
	return edit

func _form_section(form: VBoxContainer, title: String) -> void:
	var lbl := Label.new()
	lbl.text = title
	lbl.add_theme_font_size_override("font_size", 16)
	lbl.add_theme_color_override("font_color", _color_accent)
	form.add_child(lbl)

func _form_hint(form: VBoxContainer, text: String) -> void:
	var lbl := Label.new()
	lbl.text = text
	lbl.add_theme_font_size_override("font_size", 12)
	lbl.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7, 1))
	lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	form.add_child(lbl)

func _show_edit_dialog(title: String, content: VBoxContainer, on_confirmed: Callable) -> void:
	if _edit_dialog and is_instance_valid(_edit_dialog):
		_edit_dialog.queue_free()
	var dialog := ConfirmationDialog.new()
	dialog.title = title
	dialog.ok_button_text = "保存"
	dialog.cancel_button_text = "取消"
	dialog.min_size = Vector2(600, 520)
	var scroll := ScrollContainer.new()
	scroll.size_flags_vertical = 3
	scroll.horizontal_scroll_mode = 0
	scroll.add_child(content)
	dialog.add_child(scroll)
	dialog.confirmed.connect(on_confirmed)
	dialog.canceled.connect(func(): dialog.queue_free())
	dialog.close_requested.connect(func(): dialog.queue_free())
	add_child(dialog)
	dialog.popup_centered()
	_edit_dialog = dialog

func _open_question_editor(index: int) -> void:
	_editing_index = index
	var questions: Array = ConfigManager.get_questions()
	var q: Dictionary = {}
	if index >= 0 and index < questions.size():
		q = questions[index].duplicate(true)
	else:
		q = {"id": "q_%d" % Time.get_unix_time_from_system(), "type": "photo"}
	_show_edit_dialog("题目编辑器", _build_question_form(q), func(): _save_question_editor(q))

func _build_question_form(q: Dictionary) -> VBoxContainer:
	var form := VBoxContainer.new()
	form.add_theme_constant_override("separation", 8)
	form.custom_minimum_size = Vector2(540, 0)

	var id_edit: LineEdit = _form_field(form, "题目ID", q.get("id", ""))
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
	form.add_child(_form_row("题目类型", type_option))

	var type_detail_container := VBoxContainer.new()
	type_detail_container.add_theme_constant_override("separation", 6)
	form.add_child(type_detail_container)

	var _type_labels: Array = ["photo", "label", "address", "trajectory"]

	var _build_type_fields: Callable = func(selected_type: String) -> void:
		for child in type_detail_container.get_children():
			child.queue_free()
		q["type"] = selected_type
		match selected_type:
			"photo":
				_build_photo_fields(type_detail_container, q)
			"label":
				_build_label_fields(type_detail_container, q)
			"address":
				_build_address_fields(type_detail_container, q)
			"trajectory":
				_build_trajectory_fields(type_detail_container, q)

	type_option.item_selected.connect(func(idx): _build_type_fields.call(_type_labels[idx]))
	_build_type_fields.call(q.get("type", "photo"))

	return form

func _build_photo_fields(container: VBoxContainer, q: Dictionary) -> void:
	_form_section(container, "照片核验字段")
	if not q.has("description"):
		q["description"] = ""
	if not q.has("image_path"):
		q["image_path"] = ""
	if not q.has("correct_answer"):
		q["correct_answer"] = "intact"
	if not q.has("damage_reason"):
		q["damage_reason"] = ""
	var desc_edit: LineEdit = _form_field(container, "描述", q.get("description", ""))
	desc_edit.text_changed.connect(func(t): q["description"] = t)
	var img_edit: LineEdit = _form_field(container, "图片路径", q.get("image_path", ""))
	img_edit.text_changed.connect(func(t): q["image_path"] = t)
	var ans_option: OptionButton = OptionButton.new()
	ans_option.add_item("完好 (intact)")
	ans_option.add_item("损坏 (damaged)")
	ans_option.selected = 0 if q.get("correct_answer", "intact") == "intact" else 1
	ans_option.item_selected.connect(func(idx): q["correct_answer"] = "intact" if idx == 0 else "damaged")
	container.add_child(_form_row("正确答案", ans_option))
	var reason_edit: LineEdit = _form_field(container, "损坏原因", q.get("damage_reason", ""))
	reason_edit.text_changed.connect(func(t): q["damage_reason"] = t)
	_form_hint(container, "损坏原因仅在答案为damaged时展示给训练者")

func _build_label_fields(container: VBoxContainer, q: Dictionary) -> void:
	_form_section(container, "标签选择字段")
	if not q.has("item_name"):
		q["item_name"] = ""
	if not q.has("description"):
		q["description"] = ""
	if not q.has("available_labels"):
		q["available_labels"] = []
	if not q.has("correct_labels"):
		q["correct_labels"] = []
	var item_edit: LineEdit = _form_field(container, "物品名称", q.get("item_name", ""))
	item_edit.text_changed.connect(func(t): q["item_name"] = t)
	var desc_edit: LineEdit = _form_field(container, "描述", q.get("description", ""))
	desc_edit.text_changed.connect(func(t): q["description"] = t)
	var avail_str: String = ", ".join(q.get("available_labels", []))
	var avail_edit: LineEdit = _form_field(container, "可选标签", avail_str)
	avail_edit.text_changed.connect(func(t): q["available_labels"] = t.split(",", false).map(func(s): return s.strip_edges()))
	_form_hint(container, "可选标签用英文逗号分隔，如: 包装完好,温度正确,配料错误")
	var correct_str: String = ", ".join(q.get("correct_labels", []))
	var correct_edit: LineEdit = _form_field(container, "正确标签", correct_str)
	correct_edit.text_changed.connect(func(t): q["correct_labels"] = t.split(",", false).map(func(s): return s.strip_edges()))
	_form_hint(container, "正确标签必须是可选标签的子集")

func _build_address_fields(container: VBoxContainer, q: Dictionary) -> void:
	_form_section(container, "地址排序字段")
	if not q.has("order_name"):
		q["order_name"] = ""
	if not q.has("addresses"):
		q["addresses"] = []
	if not q.has("correct_order"):
		q["correct_order"] = []
	var name_edit: LineEdit = _form_field(container, "订单名称", q.get("order_name", ""))
	name_edit.text_changed.connect(func(t): q["order_name"] = t)

	var addresses_json: String = JSON.stringify(q.get("addresses", []), "\t")
	var addr_edit: TextEdit = _form_multiline(container, "地址列表JSON", addresses_json)
	addr_edit.size_flags_vertical = 3
	addr_edit.custom_minimum_size = Vector2(0, 200)
	addr_edit.text_changed.connect(func():
		var parsed = _try_parse_json(addr_edit.text)
		if parsed != null and parsed is Array:
			q["addresses"] = parsed
	)
	_form_hint(container, "JSON数组，每项含 id/name/priority/time_window/distance")
	_form_hint(container, "示例: [{\"id\":\"A\",\"name\":\"地址A\",\"priority\":1,\"time_window\":\"11:30-12:00\",\"distance\":2.1}]")

	var order_str: String = ", ".join(q.get("correct_order", []))
	var order_edit: LineEdit = _form_field(container, "正确顺序(逗号分隔)", order_str)
	order_edit.text_changed.connect(func(t): q["correct_order"] = t.split(",", false).map(func(s): return s.strip_edges()))
	_form_hint(container, "正确顺序用地址ID逗号分隔，如: D,A,B,C")

func _build_trajectory_fields(container: VBoxContainer, q: Dictionary) -> void:
	_form_section(container, "轨迹处理字段")
	if not q.has("rider_name"):
		q["rider_name"] = ""
	if not q.has("order_id"):
		q["order_id"] = ""
	if not q.has("start_time"):
		q["start_time"] = ""
	if not q.has("planned_duration"):
		q["planned_duration"] = 30
	if not q.has("actual_duration"):
		q["actual_duration"] = 30
	if not q.has("trajectory_points"):
		q["trajectory_points"] = []
	if not q.has("has_anomaly"):
		q["has_anomaly"] = false
	if not q.has("anomaly_reason"):
		q["anomaly_reason"] = ""
	if not q.has("correct_judgment"):
		q["correct_judgment"] = "normal"
	var rider_edit: LineEdit = _form_field(container, "骑手名称", q.get("rider_name", ""))
	rider_edit.text_changed.connect(func(t): q["rider_name"] = t)
	var order_edit: LineEdit = _form_field(container, "订单号", q.get("order_id", ""))
	order_edit.text_changed.connect(func(t): q["order_id"] = t)
	var st_edit: LineEdit = _form_field(container, "开始时间", q.get("start_time", ""))
	st_edit.text_changed.connect(func(t): q["start_time"] = t)

	var planned_spin: SpinBox = SpinBox.new()
	planned_spin.min_value = 1
	planned_spin.max_value = 999
	planned_spin.value = q.get("planned_duration", 30)
	planned_spin.value_changed.connect(func(v): q["planned_duration"] = int(v))
	container.add_child(_form_row("计划时长(分)", planned_spin))

	var actual_spin: SpinBox = SpinBox.new()
	actual_spin.min_value = 1
	actual_spin.max_value = 999
	actual_spin.value = q.get("actual_duration", 30)
	actual_spin.value_changed.connect(func(v): q["actual_duration"] = int(v))
	container.add_child(_form_row("实际时长(分)", actual_spin))

	var points_json: String = JSON.stringify(q.get("trajectory_points", []), "\t")
	var points_edit: TextEdit = _form_multiline(container, "轨迹点JSON", points_json)
	points_edit.size_flags_vertical = 3
	points_edit.custom_minimum_size = Vector2(0, 180)
	points_edit.text_changed.connect(func():
		var parsed = _try_parse_json(points_edit.text)
		if parsed != null and parsed is Array:
			q["trajectory_points"] = parsed
	)
	_form_hint(container, "JSON数组，每项含 x/y/label，如: [{\"x\":50,\"y\":300,\"label\":\"取餐点\"}]")

	var anomaly_option: OptionButton = OptionButton.new()
	anomaly_option.add_item("正常 (normal)")
	anomaly_option.add_item("异常 (abnormal)")
	anomaly_option.selected = 0 if q.get("correct_judgment", "normal") == "normal" else 1
	anomaly_option.item_selected.connect(func(idx):
		q["correct_judgment"] = "normal" if idx == 0 else "abnormal"
		q["has_anomaly"] = (idx == 1)
	)
	container.add_child(_form_row("正确判断", anomaly_option))

	var reason_edit: LineEdit = _form_field(container, "异常原因", q.get("anomaly_reason", ""))
	reason_edit.text_changed.connect(func(t): q["anomaly_reason"] = t)

func _try_parse_json(text: String) -> Variant:
	var json: JSON = JSON.new()
	var err: Error = json.parse(text)
	if err == OK:
		return json.data
	return null

func _save_question_editor(q: Dictionary) -> void:
	if _editing_index >= 0:
		ConfigManager.update_question(_editing_index, q)
	else:
		ConfigManager.add_question(q)
	_show_save_status("题目已保存", _color_success)

func _delete_question(index: int) -> void:
	_show_confirm("删除题目", "确定要删除这个题目吗？\n此操作不可撤销。", func():
		ConfigManager.delete_question(index)
		_show_save_status("题目已删除", _color_success)
	)

func _open_material_editor(index: int) -> void:
	_editing_index = index
	var materials: Array = ConfigManager.get_materials()
	var m: Dictionary = {}
	if index >= 0 and index < materials.size():
		m = materials[index].duplicate(true)
	else:
		m = {"id": "mat_%d" % Time.get_unix_time_from_system(), "name": "新素材", "category": "photo", "type": "intact", "description": "", "path": ""}
	_show_edit_dialog("素材编辑器", _build_material_form(m), func(): _save_material_editor(m))

func _build_material_form(m: Dictionary) -> VBoxContainer:
	var form := VBoxContainer.new()
	form.add_theme_constant_override("separation", 8)
	form.custom_minimum_size = Vector2(540, 0)
	var id_edit: LineEdit = _form_field(form, "素材ID", m.get("id", ""))
	id_edit.text_changed.connect(func(t): m["id"] = t)
	var name_edit: LineEdit = _form_field(form, "名称", m.get("name", ""))
	name_edit.text_changed.connect(func(t): m["name"] = t)
	var cat_option: OptionButton = OptionButton.new()
	cat_option.add_item("photo")
	cat_option.add_item("trajectory")
	cat_option.selected = 0 if m.get("category", "photo") == "photo" else 1
	cat_option.item_selected.connect(func(idx): m["category"] = "photo" if idx == 0 else "trajectory")
	form.add_child(_form_row("分类", cat_option))
	var type_edit: LineEdit = _form_field(form, "类型", m.get("type", ""))
	type_edit.text_changed.connect(func(t): m["type"] = t)
	var desc_edit: LineEdit = _form_field(form, "描述", m.get("description", ""))
	desc_edit.text_changed.connect(func(t): m["description"] = t)
	var path_edit: LineEdit = _form_field(form, "素材路径", m.get("path", ""))
	path_edit.text_changed.connect(func(t): m["path"] = t)
	return form

func _save_material_editor(m: Dictionary) -> void:
	if _editing_index >= 0:
		ConfigManager.update_material(_editing_index, m)
	else:
		ConfigManager.add_material(m)
	_show_save_status("素材已保存", _color_success)

func _delete_material(index: int) -> void:
	_show_confirm("删除素材", "确定要删除这个素材吗？\n此操作不可撤销。", func():
		ConfigManager.delete_material(index)
		_show_save_status("素材已删除", _color_success)
	)

func _open_reward_editor(index: int) -> void:
	_editing_index = index
	var rewards: Array = ConfigManager.get_rewards()
	var r: Dictionary = {}
	if index >= 0 and index < rewards.size():
		r = rewards[index].duplicate(true)
	else:
		r = {"id": "rw_%d" % Time.get_unix_time_from_system(), "name": "新奖励", "type": "badge", "condition": "total_score", "threshold": 100, "description": "", "icon": ""}
	_show_edit_dialog("奖励编辑器", _build_reward_form(r), func(): _save_reward_editor(r))

func _build_reward_form(r: Dictionary) -> VBoxContainer:
	var form := VBoxContainer.new()
	form.add_theme_constant_override("separation", 8)
	form.custom_minimum_size = Vector2(540, 0)
	var id_edit: LineEdit = _form_field(form, "奖励ID", r.get("id", ""))
	id_edit.text_changed.connect(func(t): r["id"] = t)
	var name_edit: LineEdit = _form_field(form, "名称", r.get("name", ""))
	name_edit.text_changed.connect(func(t): r["name"] = t)
	var type_option: OptionButton = OptionButton.new()
	type_option.add_item("badge")
	type_option.add_item("achievement")
	type_option.selected = 0 if r.get("type", "badge") == "badge" else 1
	type_option.item_selected.connect(func(idx): r["type"] = "badge" if idx == 0 else "achievement")
	form.add_child(_form_row("类型", type_option))
	var cond_edit: LineEdit = _form_field(form, "条件", r.get("condition", ""))
	cond_edit.text_changed.connect(func(t): r["condition"] = t)
	var threshold_spin: SpinBox = SpinBox.new()
	threshold_spin.min_value = 0
	threshold_spin.max_value = 9999
	threshold_spin.value = r.get("threshold", 0)
	threshold_spin.value_changed.connect(func(v): r["threshold"] = int(v))
	form.add_child(_form_row("阈值", threshold_spin))
	var desc_edit: LineEdit = _form_field(form, "描述", r.get("description", ""))
	desc_edit.text_changed.connect(func(t): r["description"] = t)
	return form

func _save_reward_editor(r: Dictionary) -> void:
	if _editing_index >= 0:
		ConfigManager.update_reward(_editing_index, r)
	else:
		ConfigManager.add_reward(r)
	_show_save_status("奖励已保存", _color_success)

func _delete_reward(index: int) -> void:
	_show_confirm("删除奖励", "确定要删除这个奖励吗？\n此操作不可撤销。", func():
		ConfigManager.delete_reward(index)
		_show_save_status("奖励已删除", _color_success)
	)

func _on_back() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu/main_menu.tscn")
