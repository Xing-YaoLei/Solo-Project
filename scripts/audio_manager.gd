extends Node

var _sound_player: AudioStreamPlayer
var _music_player: AudioStreamPlayer

func _ready() -> void:
	_sound_player = AudioStreamPlayer.new()
	_music_player = AudioStreamPlayer.new()
	_music_player.volume_db = -15.0
	add_child(_sound_player)
	add_child(_music_player)

func play_sfx(type: String) -> void:
	if not SettingsManager.sound_enabled:
		return
	match type:
		"correct":
			_play_tone(880.0, 0.1, 0.3)
		"wrong":
			_play_tone(220.0, 0.2, 0.3)
		"combo":
			_play_tone(1320.0, 0.15, 0.25)
		"tick":
			_play_tone(660.0, 0.05, 0.1)
		"complete":
			_play_tone_sequence([523.25, 659.25, 783.99, 1046.50], 0.15, 0.3)
		_:
			_play_tone(440.0, 0.1, 0.2)

func vibrate(strength: float = 0.5) -> void:
	if not SettingsManager.vibration_enabled:
		return
	if OS.has_feature("web"):
		var has_vibrate: bool = bool(JavaScriptBridge.eval("typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'", true))
		if has_vibrate:
			JavaScriptBridge.eval("navigator.vibrate(%d)" % [int(strength * 200)], true)
	else:
		DisplayServer.vibrate_handheld(strength)

func _play_tone(freq: float, duration: float, volume_db: float = 0.0) -> void:
	var stream: AudioStreamGenerator = AudioStreamGenerator.new()
	stream.mix_rate = 22050
	stream.buffer_length = 0.05
	var player := AudioStreamPlayer.new()
	player.stream = stream
	player.volume_db = volume_db
	add_child(player)
	player.play()
	var playback: AudioStreamGeneratorPlayback = player.get_stream_playback()
	var frames: int = int(stream.mix_rate * duration)
	var phase: float = 0.0
	var phase_inc: float = TAU * freq / stream.mix_rate
	var i: int = 0
	while i < frames:
		var amp: float = sin(phase)
		var envelope: float = 1.0 - (float(i) / float(frames))
		var frame := Vector2(amp * envelope * 0.3, amp * envelope * 0.3)
		playback.push_frame(frame)
		phase += phase_inc
		i += 1
	await get_tree().create_timer(duration + 0.1).timeout
	player.stop()
	remove_child(player)
	player.queue_free()

func _play_tone_sequence(freqs: Array, note_duration: float, volume_db: float = 0.0) -> void:
	for f in freqs:
		_play_tone(f, note_duration, volume_db)
		await get_tree().create_timer(note_duration * 0.8).timeout
