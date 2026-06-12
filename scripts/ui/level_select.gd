extends Control

@onready var back_btn: Button = $Background/TopBar/BackBtn
@onready var title_label: Label = $Background/TopBar/TitleLabel
@onready var mode_label: Label = $Background/TopBar/ModeLabel
@onready var levels_container: GridContainer = $Background/ScrollContainer/LevelsContainer
@onready var start_btn: Button = $Background/BottomBar/StartBtn
@onready var info_panel: PanelContainer = $Background/InfoPanel
@onready var info_title: Label = $Background/InfoPanel/MarginContainer/VBoxContainer/InfoTitle
@onready var info_desc: Label = $Background/InfoPanel/MarginContainer/VBoxContainer/InfoDesc
@onready var info_detail: Label = $Background/InfoPanel/MarginContainer/VBoxContainer/InfoDetail
@onready var info_types: Label = $Background/InfoPanel/MarginContainer/VBoxContainer/InfoTypes

var selected_level_id: String = ""
var level_buttons: Dictionary = {}

func _ready() -> void:
	setup_connections()
	load_levels()
	update_mode_label()
	update_start_button()

func setup_connections() -> void:
	back_btn.pressed.connect(_on_back_pressed)
	start_btn.pressed.connect(_on_start_pressed)

func update_mode_label() -> void:
	if GameManager.current_game_mode == GameManager.GameMode.TRAINING:
		mode_label.text = "🎯 训练模式"
		mode_label.modulate = Color(0.2, 0.5, 0.8, 1)
	else:
		mode_label.text = "📝 自由练习模式"
		mode_label.modulate = Color(0.8, 0.5, 0.2, 1)

func load_levels() -> void:
	for child in levels_container.get_children():
		child.queue_free()
	level_buttons.clear()
	
	var levels: Array = DataManager.get_levels()
	for i in range(levels.size()):
		var level: Dictionary = levels[i]
		var btn: Button = create_level_button(level)
		levels_container.add_child(btn)
		level_buttons[level["id"]] = btn

func create_level_button(level: Dictionary) -> Button:
	var btn: Button = Button.new()
	btn.custom_minimum_size = Vector2(280, 160)
	btn.theme_override_font_sizes.font_size = 16
	
	var is_unlocked: bool = GameManager.is_level_unlocked(level["id"])
	btn.disabled = not is_unlocked
	
	var level_text: String = ""
	var stars: String = "★" * level["difficulty"] + "☆" * (3 - level["difficulty"])
	
	if is_unlocked:
		level_text = "%s\n%s\n难度: %s\n⏱ %d秒  🏆 %d分通过" % [
			level["name"],
			level["description"],
			stars,
			level["time_limit"],
			level["pass_score"]
		]
		btn.add_theme_color_override("font_color", Color(0.2, 0.1, 0.05, 1))
	else:
		level_text = "🔒 未解锁\n%s\n完成上一关卡解锁" % level["name"]
		btn.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
	
	btn.text = level_text
	btn.pressed.connect(func(): _on_level_selected(level["id"]))
	
	return btn

func _on_level_selected(level_id: String) -> void:
	AudioManager.play_click()
	selected_level_id = level_id
	update_level_selection()
	update_level_info(level_id)
	update_start_button()

func update_level_selection() -> void:
	for lid in level_buttons:
		var btn: Button = level_buttons[lid]
		if lid == selected_level_id:
			btn.modulate = Color(1.1, 1.1, 0.9, 1)
			btn.add_theme_stylebox_override("normal", create_selected_style())
		else:
			btn.modulate = Color(1, 1, 1, 1)
			btn.remove_theme_stylebox_override("normal")

func create_selected_style() -> StyleBoxFlat:
	var style: StyleBoxFlat = StyleBoxFlat.new()
	style.bg_color = Color(0.98, 0.94, 0.88, 1)
	style.border_color = Color(0.9, 0.5, 0.2, 1)
	style.border_width_left = 4
	style.border_width_right = 4
	style.border_width_top = 4
	style.border_width_bottom = 4
	style.corner_radius_top_left = 12
	style.corner_radius_top_right = 12
	style.corner_radius_bottom_right = 12
	style.corner_radius_bottom_left = 12
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 16
	style.content_margin_bottom = 16
	return style

func update_level_info(level_id: String) -> void:
	var level: Dictionary = DataManager.get_level(level_id)
	if level.is_empty():
		return
	
	info_title.text = "📋 " + level["name"]
	info_desc.text = level["description"]
	
	var type_names: Dictionary = {
		"review_opinion": "复核意见识别",
		"store_selection": "责任门店选择",
		"amount_sorting": "成本金额排序",
		"approval_record": "审批记录处理"
	}
	
	var types_text: String = "包含题型：\n"
	for qtype in level["question_types"]:
		types_text += "  • " + type_names.get(qtype, qtype) + "\n"
	info_types.text = types_text
	
	info_detail.text = "时间限制：%d秒  |  通过分数：%d分  |  难度：%d星" % [
		level["time_limit"],
		level["pass_score"],
		level["difficulty"]
	]

func update_start_button() -> void:
	start_btn.disabled = selected_level_id == ""
	if not start_btn.disabled:
		start_btn.text = "▶️ 开始训练"
	else:
		start_btn.text = "请选择关卡"

func _on_back_pressed() -> void:
	AudioManager.play_click()
	GameManager.change_scene("Main")

func _on_start_pressed() -> void:
	if selected_level_id == "":
		return
	AudioManager.play_click()
	GameManager.start_game(selected_level_id, GameManager.current_game_mode)
