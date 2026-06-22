extends Control

@onready var level_container: VBoxContainer = $ScrollContainer/LevelContainer
@onready var back_button: Button = $BackButton
@onready var title_label: Label = $TitleLabel

var level_buttons: Dictionary = {}

func _ready():
	back_button.pressed.connect(_on_back_pressed)
	title_label.text = "选择训练关卡"
	_populate_levels()

func _populate_levels():
	for child in level_container.get_children():
		child.queue_free()
	level_buttons.clear()
	var levels := LevelManager.get_all_levels()
	for level_id in levels:
		var level_data: Dictionary = levels[level_id]
		var hbox := HBoxContainer.new()
		var level_btn := Button.new()
		var difficulty_label := Label.new()
		var status_label := Label.new()
		level_btn.text = level_data.get("title", level_id)
		level_btn.custom_minimum_size = Vector2(400, 50)
		var difficulty: int = level_data.get("difficulty", 1)
		difficulty_label.text = "难度: " + "*".repeat(difficulty)
		difficulty_label.custom_minimum_size.x = 100
		if LevelManager.is_level_unlocked(level_id):
			status_label.text = "已解锁"
			status_label.add_theme_color_override("font_color", Color(0.4, 0.9, 0.4))
			level_btn.disabled = false
		else:
			status_label.text = "未解锁"
			status_label.add_theme_color_override("font_color", Color(0.9, 0.4, 0.4))
			level_btn.disabled = true
		level_btn.pressed.connect(_on_level_pressed.bind(level_id))
		hbox.add_child(level_btn)
		hbox.add_child(difficulty_label)
		hbox.add_child(status_label)
		level_container.add_child(hbox)
		level_buttons[level_id] = level_btn

func _on_level_pressed(level_id: String):
	LevelManager.load_level(level_id)
	GameManager.start_level(level_id)
	get_tree().change_scene_to_file("res://scenes/gameplay.tscn")

func _on_back_pressed():
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
