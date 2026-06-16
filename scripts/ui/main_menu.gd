extends Control

@onready var title_label: Label = $VBoxContainer/TitleLabel
@onready var formal_btn: Button = $VBoxContainer/ButtonContainer/FormalButton
@onready var free_btn: Button = $VBoxContainer/ButtonContainer/FreeButton
@onready var review_btn: Button = $VBoxContainer/ButtonContainer/ReviewButton
@onready var settings_btn: Button = $VBoxContainer/ButtonContainer/SettingsButton
@onready var quit_btn: Button = $VBoxContainer/ButtonContainer/QuitButton

func _ready() -> void:
	formal_btn.pressed.connect(_on_formal_pressed)
	free_btn.pressed.connect(_on_free_pressed)
	review_btn.pressed.connect(_on_review_pressed)
	settings_btn.pressed.connect(_on_settings_pressed)
	quit_btn.pressed.connect(_on_quit_pressed)
	_animate_title()

func _animate_title() -> void:
	if not SettingsManager.animation_enabled:
		return
	title_label.modulate.a = 0.0
	var tween := create_tween()
	tween.tween_property(title_label, "modulate:a", 1.0, 0.8)

func _on_formal_pressed() -> void:
	AudioManager.play_sfx("tick")
	get_tree().change_scene_to_file("res://scenes/ui/level_select.tscn")
	GameState.current_mode = "formal"

func _on_free_pressed() -> void:
	AudioManager.play_sfx("tick")
	get_tree().change_scene_to_file("res://scenes/ui/level_select.tscn")
	GameState.current_mode = "free"

func _on_review_pressed() -> void:
	AudioManager.play_sfx("tick")
	get_tree().change_scene_to_file("res://scenes/ui/review.tscn")

func _on_settings_pressed() -> void:
	AudioManager.play_sfx("tick")
	get_tree().change_scene_to_file("res://scenes/ui/settings.tscn")

func _on_quit_pressed() -> void:
	AudioManager.play_sfx("tick")
	if OS.has_feature("web"):
		get_tree().change_scene_to_file("res://scenes/ui/main_menu.tscn")
	else:
		get_tree().quit()
