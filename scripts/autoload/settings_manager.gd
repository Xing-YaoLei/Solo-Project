extends Node

signal settings_changed

var sound_enabled: bool = true
var animation_enabled: bool = true
var vibration_enabled: bool = true

const SAVE_PATH := "user://settings.save"

func _ready() -> void:
	_load_settings()

func _load_settings() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var data: Variant = file.get_var()
		if data is Dictionary:
			if data.has("sound_enabled"):
				sound_enabled = data.sound_enabled
			if data.has("animation_enabled"):
				animation_enabled = data.animation_enabled
			if data.has("vibration_enabled"):
				vibration_enabled = data.vibration_enabled
		file.close()

func save_settings() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		var data: Dictionary = {
			"sound_enabled": sound_enabled,
			"animation_enabled": animation_enabled,
			"vibration_enabled": vibration_enabled
		}
		file.store_var(data)
		file.close()

func set_sound_enabled(enabled: bool) -> void:
	if sound_enabled != enabled:
		sound_enabled = enabled
		save_settings()
		settings_changed.emit()

func set_animation_enabled(enabled: bool) -> void:
	if animation_enabled != enabled:
		animation_enabled = enabled
		save_settings()
		settings_changed.emit()

func set_vibration_enabled(enabled: bool) -> void:
	if vibration_enabled != enabled:
		vibration_enabled = enabled
		save_settings()
		settings_changed.emit()
