extends Node

var _music_bus: AudioStreamPlayer
var _sfx_bus: AudioStreamPlayer

func _ready() -> void:
	_music_bus = AudioStreamPlayer.new()
	_music_bus.bus = "Master"
	add_child(_music_bus)
	
	_sfx_bus = AudioStreamPlayer.new()
	_sfx_bus.bus = "Master"
	add_child(_sfx_bus)
	
	SettingsManager.settings_changed.connect(_on_settings_changed)
	_update_volume()

func _update_volume() -> void:
	if SettingsManager.sound_enabled:
		_music_bus.volume_db = 0.0
		_sfx_bus.volume_db = 0.0
	else:
		_music_bus.volume_db = -80.0
		_sfx_bus.volume_db = -80.0

func _on_settings_changed() -> void:
	_update_volume()

func play_sfx(pitch: float = 1.0) -> void:
	if not SettingsManager.sound_enabled:
		return
	
	var sfx := AudioStreamGenerator.new()
	sfx.mix_rate = 44100.0
	_sfx_bus.stream = sfx
	_sfx_bus.pitch_scale = pitch
	_sfx_bus.play()
	
	var playback: AudioStreamGeneratorPlayback = _sfx_bus.get_stream_playback()
	if playback:
		var frames = int(44100 * 0.1)
		for i in range(frames):
			var t = float(i) / 44100.0
			var env = 1.0 - (float(i) / float(frames))
			var sample = sin(2.0 * PI * 440.0 * t) * env * 0.3
			playback.push_frame(Vector2(sample, sample))

func play_correct_sfx() -> void:
	_play_tone(523.25, 0.15)
	_play_tone(659.25, 0.15, 0.1)
	_play_tone(783.99, 0.2, 0.2)

func play_wrong_sfx() -> void:
	_play_tone(200.0, 0.2)

func play_click_sfx() -> void:
	_play_tone(800.0, 0.05)

func play_complete_sfx() -> void:
	_play_tone(523.25, 0.15)
	_play_tone(659.25, 0.15, 0.15)
	_play_tone(783.99, 0.15, 0.3)
	_play_tone(1046.50, 0.3, 0.45)

func _play_tone(freq: float, duration: float, delay: float = 0.0) -> void:
	if not SettingsManager.sound_enabled:
		return
	
	var player := AudioStreamPlayer.new()
	player.bus = "Master"
	add_child(player)
	
	var sfx := AudioStreamGenerator.new()
	sfx.mix_rate = 44100.0
	player.stream = sfx
	
	await get_tree().create_timer(delay).timeout
	player.play()
	
	var playback: AudioStreamGeneratorPlayback = player.get_stream_playback()
	if playback:
		var frames = int(44100 * duration)
		for i in range(frames):
			var t = float(i) / 44100.0
			var env = 1.0 - pow(float(i) / float(frames), 2.0)
			var sample = sin(2.0 * PI * freq * t) * env * 0.2
			playback.push_frame(Vector2(sample, sample))
	
	await get_tree().create_timer(duration + 0.1).timeout
	player.queue_free()

func vibrate(strength: float = 1.0) -> void:
	if not SettingsManager.vibration_enabled:
		return
	if Input.has_method("vibrate_handheld"):
		if Input.has_feature("mobile"):
			Input.vibrate_handheld(int(200 * strength))
