extends Control

@onready var sound_toggle: CheckBox = $Panel/MarginContainer/VBoxContainer/ScrollContainer/SettingsList/SoundRow/CheckBox
@onready var vibration_toggle: CheckBox = $Panel/MarginContainer/VBoxContainer/ScrollContainer/SettingsList/VibrationRow/CheckBox2
@onready var animation_toggle: CheckBox = $Panel/MarginContainer/VBoxContainer/ScrollContainer/SettingsList/AnimationRow/CheckBox3
@onready var music_slider: HSlider = $Panel/MarginContainer/VBoxContainer/ScrollContainer/SettingsList/MusicRow/HSlider
@onready var music_value: Label = $Panel/MarginContainer/VBoxContainer/ScrollContainer/SettingsList/MusicRow/ValueLabel
@onready var sfx_slider: HSlider = $Panel/MarginContainer/VBoxContainer/ScrollContainer/SettingsList/SfxRow/HSlider2
@onready var sfx_value: Label = $Panel/MarginContainer/VBoxContainer/ScrollContainer/SettingsList/SfxRow/ValueLabel2
@onready var reset_button: Button = $Panel/MarginContainer/VBoxContainer/ButtonRow/ResetButton
@onready var back_button: Button = $Panel/MarginContainer/VBoxContainer/ButtonRow/BackButton

func _ready():
	AudioManager.play_sfx("click")
	_load_settings()
	_connect_signals()

func _load_settings():
	sound_toggle.button_pressed = SettingsManager.get("sound_enabled", true)
	vibration_toggle.button_pressed = SettingsManager.get("vibration_enabled", true)
	animation_toggle.button_pressed = SettingsManager.get("animation_enabled", true)
	
	var music_volume = SettingsManager.get("music_volume", 0.7)
	music_slider.value = music_volume
	music_value.text = "%d%%" % int(music_volume * 100)
	
	var sfx_volume = SettingsManager.get("sfx_volume", 0.8)
	sfx_slider.value = sfx_volume
	sfx_value.text = "%d%%" % int(sfx_volume * 100)

func _connect_signals():
	sound_toggle.toggled.connect(_on_sound_toggled)
	vibration_toggle.toggled.connect(_on_vibration_toggled)
	animation_toggle.toggled.connect(_on_animation_toggled)
	music_slider.value_changed.connect(_on_music_volume_changed)
	sfx_slider.value_changed.connect(_on_sfx_volume_changed)
	reset_button.pressed.connect(_on_reset_pressed)
	back_button.pressed.connect(_on_back_pressed)

func _on_sound_toggled(enabled: bool):
	AudioManager.play_sfx("click")
	SettingsManager.set("sound_enabled", enabled)
	SettingsManager.save_settings()

func _on_vibration_toggled(enabled: bool):
	AudioManager.play_sfx("click")
	SettingsManager.set("vibration_enabled", enabled)
	SettingsManager.save_settings()

func _on_animation_toggled(enabled: bool):
	AudioManager.play_sfx("click")
	SettingsManager.set("animation_enabled", enabled)
	SettingsManager.save_settings()

func _on_music_volume_changed(value: float):
	music_value.text = "%d%%" % int(value * 100)
	SettingsManager.set_music_volume(value)
	SettingsManager.save_settings()

func _on_sfx_volume_changed(value: float):
	sfx_value.text = "%d%%" % int(value * 100)
	SettingsManager.set_sfx_volume(value)
	SettingsManager.save_settings()

func _on_reset_pressed():
	AudioManager.play_sfx("click")
	SettingsManager.reset_to_default()
	_load_settings()

func _on_back_pressed():
	AudioManager.play_sfx("click")
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
