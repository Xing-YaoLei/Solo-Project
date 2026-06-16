extends Node

signal settings_changed

var sound_enabled: bool = true
var animation_enabled: bool = true
var vibration_enabled: bool = true

var _save_path: String = "user://settings.save"

func _ready() -> void:
	_load_settings()

func set_sound_enabled(enabled: bool) -> void:
	sound_enabled = enabled
	emit_signal("settings_changed")
	_save_settings()

func set_animation_enabled(enabled: bool) -> void:
	animation_enabled = enabled
	emit_signal("settings_changed")
	_save_settings()

func set_vibration_enabled(enabled: bool) -> void:
	vibration_enabled = enabled
	emit_signal("settings_changed")
	_save_settings()

func _save_settings() -> void:
	var file := FileAccess.open(_save_path, FileAccess.WRITE)
	if file:
		var data := {
			"sound_enabled": sound_enabled,
			"animation_enabled": animation_enabled,
			"vibration_enabled": vibration_enabled
		}
		file.store_line(JSON.stringify(data))
		file.close()

func _load_settings() -> void:
	if FileAccess.file_exists(_save_path):
		var file := FileAccess.open(_save_path, FileAccess.READ)
		if file:
			var content := file.get_as_text()
			file.close()
			var parsed = JSON.parse_string(content)
			if parsed:
				if "sound_enabled" in parsed:
					sound_enabled = bool(parsed.sound_enabled)
				if "animation_enabled" in parsed:
					animation_enabled = bool(parsed.animation_enabled)
				if "vibration_enabled" in parsed:
					vibration_enabled = bool(parsed.vibration_enabled)
