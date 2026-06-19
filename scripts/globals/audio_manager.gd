extends Node

signal sound_played(p_sound_type: String)

const SFX_PATH := "res://assets/sounds/"

enum SFXType {
	CLICK,
	SUCCESS,
	FAILURE,
	WARNING,
	PART_LOW,
	PART_OUT,
	ORDER_COMPLETE,
	ORDER_FAIL,
	TICK,
	NEW_ORDER,
	QUOTE_APPROVED,
	QUOTE_REJECTED,
	MENU_NAVIGATE,
	BUTTON_HOVER
}

var sound_players: Array[AudioStreamPlayer] = []
var music_player: AudioStreamPlayer
var max_sound_players: int = 10

var sound_cache: Dictionary = {}

func _ready():
	music_player = AudioStreamPlayer.new()
	music_player.bus = "Music"
	add_child(music_player)

	for i in range(max_sound_players):
		var player = AudioStreamPlayer.new()
		player.bus = "SFX"
		add_child(player)
		sound_players.append(player)

	_load_sound_effects()

func _load_sound_effects() -> void:
	sound_cache["placeholder"] = _create_placeholder_sound(440.0, 0.1, 0.2)

func _create_placeholder_sound(p_freq: float, p_duration: float, p_volume: float = 0.5) -> AudioStreamGeneratorPlayback:
	var stream = AudioStreamGenerator.new()
	stream.mix_rate = 44100
	stream.buffer_length = p_duration

	var playback = AudioStreamGeneratorPlayback.new()
	playback.stream = stream

	var frames = int(stream.mix_rate * p_duration)
	for i in range(frames):
		var t = float(i) / stream.mix_rate
		var sample = sin(t * TAU * p_freq) * p_volume * (1.0 - t / p_duration)
		playback.push_frame(Vector2(sample, sample))

	return playback

func play_sfx(p_type: SFXType, p_volume: float = 1.0, p_pitch: float = 1.0) -> void:
	if not SettingsManager.sound_enabled:
		return

	var player = _get_available_player()
	if not player:
		return

	var freq = 440.0
	var duration = 0.1
	var volume = 0.3

	match p_type:
		SFXType.CLICK:
			freq = 800.0
			duration = 0.05
		SFXType.SUCCESS:
			freq = 880.0
			duration = 0.2
		SFXType.FAILURE:
			freq = 220.0
			duration = 0.3
		SFXType.WARNING:
			freq = 660.0
			duration = 0.15
		SFXType.PART_LOW:
			freq = 550.0
			duration = 0.2
		SFXType.PART_OUT:
			freq = 330.0
			duration = 0.3
		SFXType.ORDER_COMPLETE:
			freq = 1047.0
			duration = 0.3
		SFXType.ORDER_FAIL:
			freq = 196.0
			duration = 0.4
		SFXType.TICK:
			freq = 1200.0
			duration = 0.03
			volume = 0.1
		SFXType.NEW_ORDER:
			freq = 784.0
			duration = 0.15
		SFXType.QUOTE_APPROVED:
			freq = 988.0
			duration = 0.25
		SFXType.QUOTE_REJECTED:
			freq = 294.0
			duration = 0.25
		SFXType.MENU_NAVIGATE:
			freq = 600.0
			duration = 0.08
		SFXType.BUTTON_HOVER:
			freq = 900.0
			duration = 0.04
			volume = 0.15

	_play_tone(player, freq, duration, p_volume * volume, p_pitch)
	sound_played.emit(str(p_type))

func play_sound_by_name(p_name: String, p_volume: float = 1.0) -> void:
	if not SettingsManager.sound_enabled:
		return

	if sound_cache.has(p_name):
		var player = _get_available_player()
		if player:
			player.stream = sound_cache[p_name].stream
			player.volume_db = linear_to_db(p_volume)
			player.play()
			sound_played.emit(p_name)

func play_music(p_name: String, p_loop: bool = true) -> void:
	if not SettingsManager.music_enabled:
		return

	var placeholder = _create_placeholder_sound(330.0, 1.0, 0.1)
	music_player.stream = placeholder.stream
	music_player.volume_db = linear_to_db(SettingsManager.music_volume)
	music_player.play()

func stop_music() -> void:
	music_player.stop()

func pause_music() -> void:
	music_player.stream_paused = true

func resume_music() -> void:
	music_player.stream_paused = false

func set_music_volume(p_volume: float) -> void:
	music_player.volume_db = linear_to_db(clamp(p_volume, 0.0, 1.0))

func stop_all_sounds() -> void:
	for player in sound_players:
		player.stop()
	music_player.stop()

func _get_available_player() -> AudioStreamPlayer:
	for player in sound_players:
		if not player.playing:
			return player

	var new_player = AudioStreamPlayer.new()
	new_player.bus = "SFX"
	add_child(new_player)
	sound_players.append(new_player)
	return new_player

func _play_tone(p_player: AudioStreamPlayer, p_freq: float, p_duration: float, p_volume: float = 0.5, p_pitch: float = 1.0) -> void:
	var stream = AudioStreamGenerator.new()
	stream.mix_rate = 44100
	stream.buffer_length = p_duration

	p_player.stream = stream
	p_player.pitch_scale = p_pitch
	p_player.volume_db = linear_to_db(p_volume * SettingsManager.sfx_volume)
	p_player.play()

	var playback = p_player.get_stream_playback()
	if playback:
		var frames = int(stream.mix_rate * p_duration)
		for i in range(frames):
			var t = float(i) / stream.mix_rate
			var envelope = 1.0 - (t / p_duration)
			var sample = sin(t * TAU * p_freq) * envelope * 0.5
			playback.push_frame(Vector2(sample, sample))

func play_click() -> void:
	play_sfx(SFXType.CLICK)

func play_success() -> void:
	play_sfx(SFXType.SUCCESS)

func play_failure() -> void:
	play_sfx(SFXType.FAILURE)
	SettingsManager.vibrate(0.2)

func play_warning() -> void:
	play_sfx(SFXType.WARNING)
	SettingsManager.vibrate(0.1)

func play_order_complete() -> void:
	play_sfx(SFXType.ORDER_COMPLETE, 1.2)
	SettingsManager.vibrate(0.15)

func play_order_fail() -> void:
	play_sfx(SFXType.ORDER_FAIL)
	SettingsManager.vibrate(0.3)

func update_mix() -> void:
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Master"), linear_to_db(SettingsManager.master_volume))
	AudioServer.set_bus_volume_db(AudioServer.get_bus_index("SFX"), linear_to_db(SettingsManager.sfx_volume))
	if SettingsManager.music_enabled:
		AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"), linear_to_db(SettingsManager.music_volume))
	else:
		AudioServer.set_bus_volume_db(AudioServer.get_bus_index("Music"), -80.0)
