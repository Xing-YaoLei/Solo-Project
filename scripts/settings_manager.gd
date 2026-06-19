extends Node

signal settings_changed()

var settings = {
	"sound_enabled": true,
	"vibration_enabled": true,
	"animation_enabled": true,
	"music_volume": 0.7,
	"sfx_volume": 0.8,
	"show_tutorial": true,
	"high_contrast": false
}

const SAVE_PATH = "user://settings.save"

func _ready():
	_load_settings()

func _load_settings():
	var file = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var data = file.get_var()
		if data is Dictionary:
			for key in data.keys():
				if settings.has(key):
					settings[key] = data[key]
		file.close()

func save_settings():
	var file = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_var(settings)
		file.close()
		settings_changed.emit()

func get(setting_name: String, default_value = null):
	return settings.get(setting_name, default_value)

func set(setting_name: String, value):
	if settings.has(setting_name):
		settings[setting_name] = value
		settings_changed.emit()

func toggle_sound():
	settings["sound_enabled"] = not settings["sound_enabled"]
	settings_changed.emit()
	return settings["sound_enabled"]

func toggle_vibration():
	settings["vibration_enabled"] = not settings["vibration_enabled"]
	settings_changed.emit()
	return settings["vibration_enabled"]

func toggle_animation():
	settings["animation_enabled"] = not settings["animation_enabled"]
	settings_changed.emit()
	return settings["animation_enabled"]

func set_music_volume(value: float):
	settings["music_volume"] = clamp(value, 0.0, 1.0)
	settings_changed.emit()

func set_sfx_volume(value: float):
	settings["sfx_volume"] = clamp(value, 0.0, 1.0)
	settings_changed.emit()

func set_show_tutorial(show: bool):
	settings["show_tutorial"] = show
	settings_changed.emit()

func reset_to_default():
	settings = {
		"sound_enabled": true,
		"vibration_enabled": true,
		"animation_enabled": true,
		"music_volume": 0.7,
		"sfx_volume": 0.8,
		"show_tutorial": true,
		"high_contrast": false
	}
	save_settings()
