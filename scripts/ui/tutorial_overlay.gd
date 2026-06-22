extends Control

signal tutorial_closed

@onready var title_label: Label = $PanelContainer/VBoxContainer/TitleLabel
@onready var content_label: RichTextLabel = $PanelContainer/VBoxContainer/ContentLabel
@onready var close_button: Button = $PanelContainer/VBoxContainer/CloseButton

var _tutorial_data: Dictionary = {}

func _ready() -> void:
	close_button.pressed.connect(_on_close_pressed)
	_load_tutorial()

func _load_tutorial() -> void:
	var level_id: String = GameManager.current_level_id
	var tutorial_config: TutorialsConfig = load("res://resources/configs/tutorials_config.tres") as TutorialsConfig
	if tutorial_config == null:
		visible = false
		return
	var best_index: int = -1
	var best_order: int = 999
	for i in range(tutorial_config.tutorial_ids.size()):
		if tutorial_config.trigger_levels[i] == level_id:
			if tutorial_config.order_indices[i] < best_order:
				best_order = tutorial_config.order_indices[i]
				best_index = i
	if best_index < 0:
		visible = false
		return
	_tutorial_data = {
		"tutorial_id": tutorial_config.tutorial_ids[best_index],
		"title": tutorial_config.titles[best_index],
		"content": tutorial_config.content_texts[best_index],
	}
	title_label.text = _tutorial_data.get("title", "教程")
	content_label.text = _tutorial_data.get("content", "")

func _on_close_pressed() -> void:
	tutorial_closed.emit()
	visible = false
	get_tree().change_scene_to_file("res://scenes/gameplay.tscn")
