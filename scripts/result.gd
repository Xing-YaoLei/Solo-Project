extends Control

@onready var result_title: Label = $Panel/VBox/ResultTitle
@onready var score_label: Label = $Panel/VBox/ScoreLabel
@onready var pass_label: Label = $Panel/VBox/PassLabel
@onready var stats_grid: GridContainer = $Panel/VBox/StatsGrid
@onready var review_button: Button = $Panel/VBox/ButtonRow/ReviewButton
@onready var retry_button: Button = $Panel/VBox/ButtonRow/RetryButton
@onready var menu_button: Button = $Panel/VBox/ButtonRow/MenuButton
@onready var next_button: Button = $Panel/VBox/ButtonRow/NextButton

var result_data: Dictionary = {}

func _ready() -> void:
	result_data = DataManager.calculate_score()
	_update_result()
	
	review_button.pressed.connect(_on_review_pressed)
	retry_button.pressed.connect(_on_retry_pressed)
	menu_button.pressed.connect(_on_menu_pressed)
	next_button.pressed.connect(_on_next_pressed)

func _update_result() -> void:
	var level: Dictionary = DataManager.get_current_level()
	var level_name: String = level.get("name", "")
	var required_score: int = level.get("required_score", 60)
	var score: float = result_data.get("score", 0.0)
	var is_passed: bool = score >= float(required_score)
	
	result_title.text = "%s - 训练结果" % level_name
	score_label.text = "%.1f" % score
	
	if is_passed:
		pass_label.text = "✓ 训练通过！"
		pass_label.add_theme_color_override("font_color", Color(0.2, 0.7, 0.3))
	else:
		pass_label.text = "✗ 未通过，继续加油！"
		pass_label.add_theme_color_override("font_color", Color(0.8, 0.3, 0.3))
	
	_fill_stats_grid()
	
	var next_level_id: int = level.get("id", 0) + 1
	var has_next: bool = DataManager.get_level_by_id(next_level_id).size() > 0
	next_button.visible = is_passed and has_next

func _fill_stats_grid() -> void:
	for child in stats_grid.get_children():
		child.queue_free()
	
	var stats: Array = [
		{"label": "总订单数", "value": str(result_data.get("total_orders", 0))},
		{"label": "已分配订单", "value": str(result_data.get("assigned_orders", 0))},
		{"label": "冲突订单", "value": str(result_data.get("conflicted_orders", 0))},
		{"label": "准时订单", "value": str(result_data.get("on_time_orders", 0))},
		{"label": "改约订单", "value": str(result_data.get("rescheduled_orders", 0))},
		{"label": "分配率", "value": "%.1f%%" % result_data.get("assignment_rate", 0.0)},
		{"label": "到场率", "value": "%.1f%%" % result_data.get("attendance_rate", 0.0)},
		{"label": "准时率", "value": "%.1f%%" % result_data.get("on_time_rate", 0.0)},
		{"label": "冲突率", "value": "%.1f%%" % result_data.get("conflict_rate", 0.0)},
	]
	
	for stat in stats:
		var label_label: Label = Label.new()
		label_label.text = stat.get("label", "")
		label_label.add_theme_font_size_override("font_size", 14)
		label_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		label_label.horizontal_alignment = 1
		stats_grid.add_child(label_label)
		
		var value_label: Label = Label.new()
		value_label.text = stat.get("value", "")
		value_label.add_theme_font_size_override("font_size", 16)
		value_label.add_theme_color_override("font_color", Color(0.2, 0.3, 0.5))
		value_label.horizontal_alignment = 1
		stats_grid.add_child(value_label)

func _on_review_pressed() -> void:
	pass

func _on_retry_pressed() -> void:
	var level_id: int = GameManager.get_current_level_id()
	GameManager.start_game(level_id, GameManager.get_is_training_mode())
	get_tree().change_scene_to_file("res://scenes/game_play.tscn")

func _on_menu_pressed() -> void:
	GameManager.go_to_menu()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _on_next_pressed() -> void:
	var current_level_id: int = GameManager.get_current_level_id()
	var next_level_id: int = current_level_id + 1
	if DataManager.get_level_by_id(next_level_id).size() > 0:
		GameManager.start_game(next_level_id, GameManager.get_is_training_mode())
		get_tree().change_scene_to_file("res://scenes/game_play.tscn")
