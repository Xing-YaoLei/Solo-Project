extends Node

signal settings_changed()

enum AnimationIntensity { NONE, LOW, MEDIUM, HIGH }

var sound_enabled: bool = true
var music_enabled: bool = true
var vibration_enabled: bool = true
var animation_intensity: AnimationIntensity = AnimationIntensity.MEDIUM
var master_volume: float = 0.7
var sfx_volume: float = 0.7
var music_volume: float = 0.5
var language: int = 0
var show_tutorial: bool = true
var show_hints_enabled: bool = true
var high_contrast: bool = false
var large_text: bool = false
var inventory_sound_enabled: bool = true
var low_stock_warning_enabled: bool = true
var particle_effects_enabled: bool = true
var screen_shake_enabled: bool = true
var auto_save_enabled: bool = true

const SAVE_PATH := "user://settings.cfg"

func _ready():
	load_settings()

func set_sound_enabled(p_enabled: bool) -> void:
	sound_enabled = p_enabled
	settings_changed.emit()
	save_settings()

func set_music_enabled(p_enabled: bool) -> void:
	music_enabled = p_enabled
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"), -80.0 if not p_enabled else linear_to_db(music_volume))
	settings_changed.emit()
	save_settings()

func set_vibration_enabled(p_enabled: bool) -> void:
	vibration_enabled = p_enabled
	settings_changed.emit()
	save_settings()

func set_animation_intensity(p_intensity: AnimationIntensity) -> void:
	animation_intensity = p_intensity
	settings_changed.emit()
	save_settings()

func set_master_volume(p_volume: float) -> void:
	master_volume = clamp(p_volume, 0.0, 1.0)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(master_volume))
	settings_changed.emit()
	save_settings()

func set_sfx_volume(p_volume: float) -> void:
	sfx_volume = clamp(p_volume, 0.0, 1.0)
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"), linear_to_db(sfx_volume))
	settings_changed.emit()
	save_settings()

func set_music_volume(p_volume: float) -> void:
	music_volume = clamp(p_volume, 0.0, 1.0)
	if music_enabled:
		AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"), linear_to_db(music_volume))
	settings_changed.emit()
	save_settings()

func set_show_tutorial(p_show: bool) -> void:
	show_tutorial = p_show
	settings_changed.emit()
	save_settings()

func set_high_contrast(p_enabled: bool) -> void:
	high_contrast = p_enabled
	settings_changed.emit()
	save_settings()

func set_large_text(p_enabled: bool) -> void:
	large_text = p_enabled
	settings_changed.emit()
	save_settings()

func should_play_animation(p_required_intensity: AnimationIntensity) -> bool:
	return animation_intensity >= p_required_intensity

func vibrate(p_duration: float = 0.1) -> void:
	if vibration_enabled:
		if OS.has_feature("mobile"):
			Input.vibrate_handheld(p_duration)

func save_settings() -> void:
	var config = ConfigFile.new()
	config.set_value("Audio", "sound_enabled", sound_enabled)
	config.set_value("Audio", "music_enabled", music_enabled)
	config.set_value("Audio", "master_volume", master_volume)
	config.set_value("Audio", "sfx_volume", sfx_volume)
	config.set_value("Audio", "music_volume", music_volume)
	config.set_value("Audio", "inventory_sound_enabled", inventory_sound_enabled)
	config.set_value("Audio", "low_stock_warning_enabled", low_stock_warning_enabled)
	config.set_value("Feedback", "vibration_enabled", vibration_enabled)
	config.set_value("Feedback", "animation_intensity", animation_intensity)
	config.set_value("Visual", "particle_effects_enabled", particle_effects_enabled)
	config.set_value("Visual", "screen_shake_enabled", screen_shake_enabled)
	config.set_value("Accessibility", "show_tutorial", show_tutorial)
	config.set_value("Accessibility", "show_hints_enabled", show_hints_enabled)
	config.set_value("Accessibility", "high_contrast", high_contrast)
	config.set_value("Accessibility", "large_text", large_text)
	config.set_value("General", "language", language)
	config.set_value("General", "auto_save_enabled", auto_save_enabled)
	config.save(SAVE_PATH)

func load_settings() -> void:
	var config = ConfigFile.new()
	var error = config.load(SAVE_PATH)
	if error == OK:
		sound_enabled = config.get_value("Audio", "sound_enabled", true)
		music_enabled = config.get_value("Audio", "music_enabled", true)
		master_volume = config.get_value("Audio", "master_volume", 0.7)
		sfx_volume = config.get_value("Audio", "sfx_volume", 0.7)
		music_volume = config.get_value("Audio", "music_volume", 0.5)
		inventory_sound_enabled = config.get_value("Audio", "inventory_sound_enabled", true)
		low_stock_warning_enabled = config.get_value("Audio", "low_stock_warning_enabled", true)
		vibration_enabled = config.get_value("Feedback", "vibration_enabled", true)
		animation_intensity = config.get_value("Feedback", "animation_intensity", AnimationIntensity.MEDIUM)
		particle_effects_enabled = config.get_value("Visual", "particle_effects_enabled", true)
		screen_shake_enabled = config.get_value("Visual", "screen_shake_enabled", true)
		show_tutorial = config.get_value("Accessibility", "show_tutorial", true)
		show_hints_enabled = config.get_value("Accessibility", "show_hints_enabled", true)
		high_contrast = config.get_value("Accessibility", "high_contrast", false)
		large_text = config.get_value("Accessibility", "large_text", false)
		language = config.get_value("General", "language", 0)
		auto_save_enabled = config.get_value("General", "auto_save_enabled", true)

		AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(master_volume))
		AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"), linear_to_db(sfx_volume))
		AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"), linear_to_db(music_volume) if music_enabled else -80.0)

func reset_to_default() -> void:
	sound_enabled = true
	music_enabled = true
	vibration_enabled = true
	animation_intensity = AnimationIntensity.MEDIUM
	master_volume = 0.7
	sfx_volume = 0.7
	music_volume = 0.5
	language = 0
	show_tutorial = true
	show_hints_enabled = true
	high_contrast = false
	large_text = false
	inventory_sound_enabled = true
	low_stock_warning_enabled = true
	particle_effects_enabled = true
	screen_shake_enabled = true
	auto_save_enabled = true

	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(master_volume))
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"), linear_to_db(sfx_volume))
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"), linear_to_db(music_volume))

	settings_changed.emit()
	save_settings()

func get_animation_speed() -> float:
	match animation_intensity:
		AnimationIntensity.NONE:
			return 0.0
		AnimationIntensity.LOW:
			return 0.5
		AnimationIntensity.MEDIUM:
			return 1.0
		AnimationIntensity.HIGH:
			return 2.0
		_:
			return 1.0
