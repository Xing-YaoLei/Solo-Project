extends Control

@onready var _start_button: Button = $VBoxContainer/StartButton
@onready var _stats_button: Button = $VBoxContainer/StatsButton
@onready var _level_list: VBoxContainer = $VBoxContainer/ScrollContainer/LevelList
@onready var _scroll_container: ScrollContainer = $VBoxContainer/ScrollContainer

var _buttons: Array[BaseButton] = []
var _selected_level: String = ""

func _ready() -> void:
	_populate_levels()
	_buttons = [_start_button, _stats_button]
	for btn in _buttons:
		btn.focus_mode = Control.FOCUS_ALL
	InputManager.setup_focus_group(_buttons)
	_start_button.grab_focus()

func _populate_levels() -> void:
	for child in _level_list.get_children():
		child.queue_free()
	var level_ids := LevelData.get_all_level_ids()
	for lid in level_ids:
		var data := LevelData.get_level(lid)
		var btn := Button.new()
		btn.text = "%s - %s" % [lid, data.get("title", "")]
		btn.custom_minimum_size = Vector2(600, 48)
		btn.focus_mode = Control.FOCUS_ALL
		btn.pressed.connect(_on_level_selected.bind(lid))
		_level_list.add_child(btn)
		_buttons.append(btn)

func _on_level_selected(level_id: String) -> void:
	_selected_level = level_id
	_start_button.text = "开始: %s" % LevelData.get_level(level_id).get("title", level_id)

func _on_start_button_pressed() -> void:
	if _selected_level.is_empty():
		_selected_level = "level_01"
	var data := LevelData.get_level(_selected_level)
	GameManager.start_level(_selected_level, data)
	SceneManager.goto_scene("res://scenes/game_level/game_level.tscn")

func _on_stats_button_pressed() -> void:
	SceneManager.goto_scene("res://scenes/stats/stats_page.tscn")

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel") and not _selected_level.is_empty():
		_selected_level = ""
		_start_button.text = "选择关卡开始"
