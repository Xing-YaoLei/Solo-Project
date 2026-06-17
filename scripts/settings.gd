extends Control

@onready var sound_switch: CheckButton = $CenterContainer/SettingsPanel/SettingsVBox/SoundRow/SoundSwitch
@onready var animation_switch: CheckButton = $CenterContainer/SettingsPanel/SettingsVBox/AnimationRow/AnimationSwitch
@onready var vibration_switch: CheckButton = $CenterContainer/SettingsPanel/SettingsVBox/VibrationRow/VibrationSwitch

func _ready() -> void:
	sound_switch.button_pressed = SettingsManager.sound_enabled
	animation_switch.button_pressed = SettingsManager.animation_enabled
	vibration_switch.button_pressed = SettingsManager.vibration_enabled

func _on_back_pressed() -> void:
	AudioManager.play_click_sfx()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _on_sound_toggled(button_pressed: bool) -> void:
	SettingsManager.set_sound_enabled(button_pressed)
	if button_pressed:
		AudioManager.play_click_sfx()

func _on_animation_toggled(button_pressed: bool) -> void:
	AudioManager.play_click_sfx()
	SettingsManager.set_animation_enabled(button_pressed)

func _on_vibration_toggled(button_pressed: bool) -> void:
	AudioManager.play_click_sfx()
	SettingsManager.set_vibration_enabled(button_pressed)
