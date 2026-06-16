extends Control

@onready var sound_check: CheckBox = $Panel/VBoxContainer/SettingsBox/SoundRow/CheckBox
@onready var animation_check: CheckBox = $Panel/VBoxContainer/SettingsBox/AnimationRow/CheckBox
@onready var vibration_check: CheckBox = $Panel/VBoxContainer/SettingsBox/VibrationRow/CheckBox
@onready var back_btn: Button = $Panel/VBoxContainer/BackButton

func _ready() -> void:
	sound_check.button_pressed = SettingsManager.sound_enabled
	animation_check.button_pressed = SettingsManager.animation_enabled
	vibration_check.button_pressed = SettingsManager.vibration_enabled
	sound_check.toggled.connect(_on_sound_toggled)
	animation_check.toggled.connect(_on_animation_toggled)
	vibration_check.toggled.connect(_on_vibration_toggled)
	back_btn.pressed.connect(_on_back_pressed)

func _on_sound_toggled(pressed: bool) -> void:
	SettingsManager.set_sound_enabled(pressed)
	if pressed:
		AudioManager.play_sfx("tick")

func _on_animation_toggled(pressed: bool) -> void:
	SettingsManager.set_animation_enabled(pressed)
	AudioManager.play_sfx("tick")

func _on_vibration_toggled(pressed: bool) -> void:
	SettingsManager.set_vibration_enabled(pressed)
	AudioManager.play_sfx("tick")
	if pressed:
		AudioManager.vibrate(0.3)

func _on_back_pressed() -> void:
	AudioManager.play_sfx("tick")
	get_tree().change_scene_to_file("res://scenes/ui/main_menu.tscn")
