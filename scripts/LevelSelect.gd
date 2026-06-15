extends Control

@onready var back_button: Button = $TopBar/MarginContainer/HBoxContainer/BackButton
@onready var title_label: Label = $TopBar/MarginContainer/HBoxContainer/TitleLabel
@onready var level_grid: GridContainer = $MarginContainer/VBoxContainer/ScrollContainer/LevelGrid

var level_cards: Array = []

func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)
	_build_level_cards()

func _build_level_cards() -> void:
	for child in level_grid.get_children():
		child.queue_free()
	level_cards.clear()
	
	var level_types = GameManager.get_level_types()
	for level_type in level_types.keys():
		var type_name = level_types[level_type]
		var levels = GameManager.get_levels(level_type)
		
		var type_panel := _create_type_panel(type_name, level_type, levels)
		level_grid.add_child(type_panel)

func _create_type_panel(type_name: String, level_type: String, levels: Array) -> PanelContainer:
	var panel := PanelContainer.new()
	panel.custom_minimum_size = Vector2(380, 0)
	
	var panel_margin := MarginContainer.new()
	panel_margin.add_theme_constant_override("margin_left", 20)
	panel_margin.add_theme_constant_override("margin_top", 20)
	panel_margin.add_theme_constant_override("margin_right", 20)
	panel_margin.add_theme_constant_override("margin_bottom", 20)
	panel.add_child(panel_margin)
	
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 16)
	panel_margin.add_child(vbox)
	
	var type_label := Label.new()
	type_label.text = type_name
	type_label.add_theme_font_size_override("font_size", 22)
	type_label.add_theme_color_override("font_color", Color(0.1, 0.25, 0.55, 1))
	vbox.add_child(type_label)
	
	var divider := ColorRect.new()
	divider.custom_minimum_size = Vector2(0, 2)
	divider.color = Color(0.8, 0.85, 0.9, 1)
	vbox.add_child(divider)
	
	for i in range(levels.size()):
		var level = levels[i]
		var card := _create_level_card(level, level_type, i)
		vbox.add_child(card)
	
	return panel

func _create_level_card(level: Dictionary, level_type: String, index: int) -> Control:
	var card_vbox := VBoxContainer.new()
	card_vbox.add_theme_constant_override("separation", 8)
	
	var name_label := Label.new()
	name_label.text = "  " + level.get("name", "")
	name_label.add_theme_font_size_override("font_size", 18)
	card_vbox.add_child(name_label)
	
	var desc_label := Label.new()
	desc_label.text = "    " + level.get("description", "")
	desc_label.add_theme_font_size_override("font_size", 14)
	desc_label.add_theme_color_override("font_color", Color(0.45, 0.5, 0.6, 1))
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	card_vbox.add_child(desc_label)
	
	var info_hbox := HBoxContainer.new()
	info_hbox.add_theme_constant_override("separation", 16)
	card_vbox.add_child(info_hbox)
	
	var diff_label := Label.new()
	var stars_text := "★" * int(level.get("difficulty", 1))
	diff_label.text = "    难度: " + stars_text
	diff_label.add_theme_color_override("font_color", Color(0.9, 0.6, 0.1, 1))
	info_hbox.add_child(diff_label)
	
	var time_label := Label.new()
	time_label.text = "  时限: %d秒" % int(level.get("time_limit", 60))
	time_label.add_theme_color_override("font_color", Color(0.45, 0.5, 0.6, 1))
	info_hbox.add_child(time_label)
	
	var start_btn := Button.new()
	start_btn.text = "开始挑战"
	start_btn.custom_minimum_size = Vector2(0, 44)
	start_btn.add_theme_font_size_override("font_size", 16)
	start_btn.pressed.connect(_on_level_start.bind(level_type, index))
	card_vbox.add_child(start_btn)
	
	return card_vbox

func _on_level_start(level_type: String, level_index: int) -> void:
	SceneManager.start_level(level_type, level_index)

func _on_back_pressed() -> void:
	SceneManager.go_back()
