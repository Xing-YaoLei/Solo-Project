extends Control

@onready var tab_container: TabContainer = %TabContainer
@onready var training_scroll: ScrollContainer = %TrainingScroll
@onready var practice_scroll: ScrollContainer = %PracticeScroll
@onready var training_grid: GridContainer = %TrainingGrid
@onready var practice_grid: GridContainer = %PracticeGrid
@onready var level_info_panel: PanelContainer = %LevelInfoPanel
@onready var level_name_label: Label = %LevelNameLabel
@onready var level_desc_label: Label = %LevelDescLabel
@onready var level_difficulty_label: Label = %LevelDifficultyLabel
@onready var level_target_label: Label = %LevelTargetLabel
@onready var level_time_label: Label = %LevelTimeLabel
@onready var start_button: Button = %StartButton
@onready var back_button: Button = %BackButton

var training_levels: Array = []
var practice_levels: Array = []
var selected_level_id: String = ""
var level_cards: Dictionary = {}

func _ready():
	training_levels = GameData.get_training_levels()
	practice_levels = GameData.get_practice_levels()
	
	_populate_training_levels()
	_populate_practice_levels()
	
	tab_container.tab_changed.connect(_on_tab_changed)
	start_button.pressed.connect(_on_start_pressed)
	back_button.pressed.connect(_on_back_pressed)
	
	_update_level_info()

func _populate_training_levels():
	for level in training_levels:
		var card = _create_level_card(level)
		training_grid.add_child(card)
		level_cards[level.id] = card

func _populate_practice_levels():
	for level in practice_levels:
		var card = _create_level_card(level)
		practice_grid.add_child(card)
		level_cards[level.id] = card

func _create_level_card(level) -> PanelContainer:
	var card = PanelContainer.new()
	card.custom_minimum_size = Vector2(280, 160)
	
	var vbox = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	card.add_child(vbox)
	
	var name_label = Label.new()
	name_label.text = level.name
	name_label.add_theme_font_size_override("font_size", 18)
	name_label.add_theme_color_override("font_color", Color(0.2, 0.6, 0.86, 1))
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(name_label)
	
	var desc_label = Label.new()
	desc_label.text = level.description
	desc_label.add_theme_font_size_override("font_size", 12)
	desc_label.add_theme_color_override("font_color", Color(0.7, 0.75, 0.8, 1))
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(desc_label)
	
	var info_hbox = HBoxContainer.new()
	info_hbox.alignment = BoxContainer.ALIGNMENT_CENTER
	info_hbox.add_theme_constant_override("separation", 16)
	vbox.add_child(info_hbox)
	
	var diff_label = Label.new()
	diff_label.text = "难度: %s" % _get_difficulty_text(level.difficulty)
	diff_label.add_theme_font_size_override("font_size", 11)
	diff_label.add_theme_color_override("font_color", _get_difficulty_color(level.difficulty))
	info_hbox.add_child(diff_label)
	
	var target_label = Label.new()
	target_label.text = "目标: %.0f%%" % (level.target_conversion_rate * 100)
	target_label.add_theme_font_size_override("font_size", 11)
	target_label.add_theme_color_override("font_color", Color(0.6, 0.8, 0.6, 1))
	info_hbox.add_child(target_label)
	
	var time_label = Label.new()
	time_label.text = "时间: %ds" % level.time_limit
	time_label.add_theme_font_size_override("font_size", 11)
	time_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.6, 1))
	info_hbox.add_child(time_label)
	
	card.gui_input.connect(func(event): _on_card_clicked(event, level.id))
	
	return card

func _get_difficulty_text(diff: int) -> String:
	match diff:
		1:
			return "简单"
		2:
			return "普通"
		3:
			return "困难"
		4:
			return "专家"
		5:
			return "大师"
		_:
			return "未知"

func _get_difficulty_color(diff: int) -> Color:
	match diff:
		1:
			return Color(0.18, 0.8, 0.44, 1)
		2:
			return Color(0.2, 0.6, 0.86, 1)
		3:
			return Color(0.95, 0.61, 0.07, 1)
		4:
			return Color(0.91, 0.3, 0.24, 1)
		5:
			return Color(0.8, 0.2, 0.8, 1)
		_:
			return Color.WHITE

func _on_card_clicked(event, level_id: String):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		selected_level_id = level_id
		_highlight_card(level_id)
		_update_level_info()

func _highlight_card(selected_id: String):
	for level_id in level_cards:
		var card = level_cards[level_id]
		if level_id == selected_id:
			card.add_theme_stylebox_override("panel", _get_highlight_stylebox())
		else:
			card.remove_theme_stylebox_override("panel")

func _get_highlight_stylebox() -> StyleBoxFlat:
	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.15, 0.25, 0.35, 0.95)
	style.border_color = Color(0.2, 0.6, 0.86, 1)
	style.border_width_left = 3
	style.border_width_top = 3
	style.border_width_right = 3
	style.border_width_bottom = 3
	style.corner_radius_top_left = 12
	style.corner_radius_top_right = 12
	style.corner_radius_bottom_right = 12
	style.corner_radius_bottom_left = 12
	style.content_margin_left = 20
	style.content_margin_top = 20
	style.content_margin_right = 20
	style.content_margin_bottom = 20
	return style

func _update_level_info():
	var level = GameData.get_level(selected_level_id)
	if level:
		level_info_panel.visible = true
		level_name_label.text = level.name
		level_desc_label.text = level.description
		level_difficulty_label.text = "难度: %s" % _get_difficulty_text(level.difficulty)
		level_difficulty_label.add_theme_color_override("font_color", _get_difficulty_color(level.difficulty))
		level_target_label.text = "目标转化率: %.0f%%" % (level.target_conversion_rate * 100)
		level_time_label.text = "时间限制: %d秒" % level.time_limit
		start_button.disabled = false
	else:
		level_info_panel.visible = false
		start_button.disabled = true

func _on_tab_changed(tab_index: int):
	selected_level_id = ""
	_highlight_card("")
	_update_level_info()

func _on_start_pressed():
	if selected_level_id != "":
		AudioManager.play_sfx("click")
		GameManager.start_game(selected_level_id)
		get_tree().change_scene_to_file("res://scenes/game_main.tscn")

func _on_back_pressed():
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
