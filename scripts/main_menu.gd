extends Control

@onready var start_btn: Button = $CenterContainer/VBoxContainer/StartButton
@onready var stats_btn: Button = $CenterContainer/VBoxContainer/StatsButton
@onready var tutorial_btn: Button = $CenterContainer/VBoxContainer/TutorialButton
@onready var title_label: Label = $CenterContainer/VBoxContainer/TitleLabel
@onready var subtitle_label: Label = $CenterContainer/VBoxContainer/SubtitleLabel

func _ready() -> void:
	start_btn.pressed.connect(_on_start_pressed)
	stats_btn.pressed.connect(_on_stats_pressed)
	tutorial_btn.pressed.connect(_on_tutorial_pressed)

func _on_start_pressed() -> void:
	GameManager.go_to_level_select()

func _on_stats_pressed() -> void:
	GameManager.go_to_stats()

func _on_tutorial_pressed() -> void:
	GameManager.go_to_tutorial()
