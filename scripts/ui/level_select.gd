extends Control

var scene_manager: SceneManager
var game_manager: GameManager
var statistics_manager: StatisticsManager

@onready var back_button: Button = $VBoxContainer/Header/BackButton
@onready var level_grid: GridContainer = $VBoxContainer/LevelScroll/LevelGrid

func _ready():
	var main: Node = get_tree().root.get_node_or_null("Main")
	if main:
		scene_manager = main.get_node_or_null("SceneManager")
		game_manager = main.get_node_or_null("GameManager")
		statistics_manager = main.get_node_or_null("StatisticsManager")
	
	back_button.pressed.connect(_on_back_button_pressed)
	
	_populate_levels()

func _populate_levels():
	if not game_manager:
		return
	
	var levels: Array[LevelData] = game_manager.get_all_levels()
	for level in levels:
		var card: Panel = _create_level_card(level)
		level_grid.add_child(card)

func _create_level_card(level: LevelData) -> Panel:
	var card: Panel = Panel.new()
	card.custom_minimum_size = Vector2(320, 200)
	
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.layout_mode = 1
	vbox.anchors_preset = 15
	vbox.anchor_right = 1
	vbox.anchor_bottom = 1
	vbox.offset_left = 15
	vbox.offset_top = 15
	vbox.offset_right = -15
	vbox.offset_bottom = -15
	vbox.theme_override_constants.separation = 8
	card.add_child(vbox)
	
	var header: HBoxContainer = HBoxContainer.new()
	header.theme_override_constants.separation = 10
	vbox.add_child(header)
	
	var diff_label: Label = Label.new()
	diff_label.text = level.get_difficulty_name()
	diff_label.theme_override_colors.font_color = level.get_difficulty_color()
	diff_label.theme_override_font_sizes.font_size = 14
	header.add_child(diff_label)
	
	var patient_label: Label = Label.new()
	patient_label.text = "%d位患者" % level.patient_count
	patient_label.size_flags_horizontal = 3
	patient_label.horizontal_alignment = 2
	patient_label.theme_override_colors.font_color = Color(0.7, 0.7, 0.7, 1)
	header.add_child(patient_label)
	
	var name_label: Label = Label.new()
	name_label.text = level.name
	name_label.theme_override_colors.font_color = Color(0.95, 0.95, 0.95, 1)
	name_label.theme_override_font_sizes.font_size = 22
	vbox.add_child(name_label)
	
	var desc_label: Label = Label.new()
	desc_label.text = level.description
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_label.custom_minimum_size = Vector2(0, 50)
	desc_label.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
	vbox.add_child(desc_label)
	
	var stats: HBoxContainer = HBoxContainer.new()
	stats.theme_override_constants.separation = 15
	vbox.add_child(stats)
	
	var time_label: Label = Label.new()
	time_label.text = "⏱ %d秒" % level.time_limit
	time_label.theme_override_colors.font_color = Color(0.8, 0.8, 0.6, 1)
	stats.add_child(time_label)
	
	var acc_label: Label = Label.new()
	acc_label.text = "🎯 %d%%正确率" % int(level.target_accuracy * 100)
	acc_label.theme_override_colors.font_color = Color(0.6, 0.8, 0.9, 1)
	stats.add_child(acc_label)
	
	if statistics_manager:
		var level_stat: Dictionary = statistics_manager.get_level_statistics(level.id)
		if level_stat and level_stat.get("attempts", 0) > 0:
			var best_label: Label = Label.new()
			best_label.text = "🏆 %d分" % level_stat.get("best_score", 0)
			best_label.size_flags_horizontal = 3
			best_label.horizontal_alignment = 2
			best_label.theme_override_colors.font_color = Color(1, 0.85, 0.2, 1)
			stats.add_child(best_label)
	
	var start_button: Button = Button.new()
	start_button.text = "开始训练"
	start_button.custom_minimum_size = Vector2(0, 40)
	start_button.theme_override_font_sizes.font_size = 16
	start_button.pressed.connect(_on_level_start_pressed.bind(level.id))
	vbox.add_child(start_button)
	
	return card

func _on_level_start_pressed(level_id: String):
	if scene_manager:
		scene_manager.go_to_game_level(level_id)

func _on_back_button_pressed():
	if scene_manager:
		scene_manager.go_to_main_menu()
