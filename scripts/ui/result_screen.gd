extends Control

@onready var result_title: Label = $Panel/MarginContainer/VBoxContainer/ResultTitle
@onready var stars_container: HBoxContainer = $Panel/MarginContainer/VBoxContainer/StarsContainer
@onready var score_label: Label = $Panel/MarginContainer/VBoxContainer/StatsGrid/ScoreValue
@onready var correct_label: Label = $Panel/MarginContainer/VBoxContainer/StatsGrid/CorrectValue
@onready var total_label: Label = $Panel/MarginContainer/VBoxContainer/StatsGrid/TotalValue
@onready var conversion_label: Label = $Panel/MarginContainer/VBoxContainer/StatsGrid/ConversionValue
@onready var time_label: Label = $Panel/MarginContainer/VBoxContainer/StatsGrid/TimeValue
@onready var replay_button: Button = $Panel/MarginContainer/VBoxContainer/ButtonRow/ReplayButton
@onready var level_select_button: Button = $Panel/MarginContainer/VBoxContainer/ButtonRow/LevelSelectButton
@onready var main_menu_button: Button = $Panel/MarginContainer/VBoxContainer/ButtonRow/MainMenuButton

var game_result: Dictionary = {}
var current_level_id: String = ""

func _ready():
	replay_button.pressed.connect(_on_replay_pressed)
	level_select_button.pressed.connect(_on_level_select_pressed)
	main_menu_button.pressed.connect(_on_main_menu_pressed)

func show_result(result: Dictionary):
	game_result = result
	current_level_id = result.get("level_id", "")
	
	_update_display()

func _update_display():
	var passed = game_result.get("passed", false)
	var conversion_rate = game_result.get("conversion_rate", 0.0)
	var score = game_result.get("score", 0)
	var correct_tasks = game_result.get("correct_tasks", 0)
	var total_tasks = game_result.get("total_tasks", 0)
	var time_taken = game_result.get("time_taken", 0.0)
	
	if passed:
		result_title.text = "挑战成功！"
		result_title.modulate = Color(0.18, 0.8, 0.44, 1)
	else:
		result_title.text = "继续努力！"
		result_title.modulate = Color(0.91, 0.3, 0.24, 1)
	
	_update_stars(conversion_rate)
	
	score_label.text = str(score)
	correct_label.text = str(correct_tasks)
	total_label.text = str(total_tasks)
	conversion_label.text = "%.1f%%" % [conversion_rate * 100]
	
	var mins = int(time_taken / 60)
	var secs = int(time_taken % 60)
	time_label.text = "%02d:%02d" % [mins, secs]

func _update_stars(conversion_rate: float):
	_clear_children(stars_container)
	
	var star_count = 0
	if conversion_rate >= 0.9:
		star_count = 3
	elif conversion_rate >= 0.7:
		star_count = 2
	elif conversion_rate >= 0.5:
		star_count = 1
	
	for i in range(3):
		var star_label = Label.new()
		star_label.add_theme_font_size_override("font_size", 48)
		if i < star_count:
			star_label.text = "★"
			star_label.modulate = Color(1, 0.84, 0, 1)
		else:
			star_label.text = "☆"
			star_label.modulate = Color(0.5, 0.5, 0.5, 1)
		stars_container.add_child(star_label)

func _clear_children(container: Node):
	for child in container.get_children():
		container.remove_child(child)
		child.queue_free()

func _on_replay_pressed():
	AudioManager.play_sfx("click")
	if current_level_id == "":
		_on_main_menu_pressed()
		return
	
	if GameManager.start_game(current_level_id):
		get_tree().change_scene_to_file("res://scenes/game_main.tscn")
		return
	
	_on_main_menu_pressed()

func _on_level_select_pressed():
	AudioManager.play_sfx("click")
	get_tree().change_scene_to_file("res://scenes/level_select.tscn")

func _on_main_menu_pressed():
	AudioManager.play_sfx("click")
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
