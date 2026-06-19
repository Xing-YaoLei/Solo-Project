extends Node

var _sfx_players: Dictionary = {}
var _music_player: AudioStreamPlayer = null
var _sfx_bus = AudioServer.get_bus_index("Master")

func _ready():
	_create_sfx_players()
	_create_music_player()
	SettingsManager.settings_changed.connect(_on_settings_changed)
	_on_settings_changed()

func _create_sfx_players():
	var sfx_types = ["click", "select", "correct", "wrong", "complete", "timer", "date_select"]
	for sfx in sfx_types:
		var player = AudioStreamPlayer.new()
		player.bus = "Master"
		add_child(player)
		_sfx_players[sfx] = player

func _create_music_player():
	_music_player = AudioStreamPlayer.new()
	_music_player.bus = "Master"
	_music_player.loop = true
	add_child(_music_player)

func play_sfx(sfx_name: String, volume_scale: float = 1.0):
	if not SettingsManager.get("sound_enabled", true):
		return
	
	var player = _sfx_players.get(sfx_name, null)
	if not player:
		return
	
	var volume = SettingsManager.get("sfx_volume", 0.8) * volume_scale
	player.volume_db = linear_to_db(volume)
	player.stream = _get_sfx_stream(sfx_name)
	if player.stream:
		player.play()
	
	if SettingsManager.get("vibration_enabled", true) and sfx_name in ["correct", "wrong", "complete"]:
		_trigger_vibration(sfx_name)

func play_music(music_name: String = "bgm", volume_scale: float = 1.0):
	if not SettingsManager.get("sound_enabled", true):
		return
	
	var volume = SettingsManager.get("music_volume", 0.7) * volume_scale
	_music_player.volume_db = linear_to_db(volume)
	_music_player.stream = _get_music_stream(music_name)
	if _music_player.stream:
		_music_player.play()

func stop_music():
	_music_player.stop()

func _get_sfx_stream(sfx_name: String):
	var noise = AudioStreamGenerator.new()
	noise.mix_rate = 44100
	var playback = AudioStreamGeneratorPlayback.new()
	
	match sfx_name:
		"click":
			return _create_tone(800, 0.05, 0.3)
		"select":
			return _create_tone(600, 0.08, 0.25)
		"correct":
			return _create_chord([523, 659, 784], 0.2, 0.4)
		"wrong":
			return _create_chord([200, 180, 160], 0.3, 0.5)
		"complete":
			return _create_chord([523, 659, 784, 1047], 0.4, 0.5)
		"timer":
			return _create_tone(1000, 0.03, 0.2)
		"date_select":
			return _create_tone(440, 0.06, 0.2)
	return null

func _get_music_stream(music_name: String):
	var noise = AudioStreamGenerator.new()
	noise.mix_rate = 44100
	return _create_ambient_music()

func _create_tone(freq: float, duration: float, volume: float = 0.5):
	var sample_rate = 44100
	var num_frames = int(sample_rate * duration)
	var data = PackedFloat32Array()
	data.resize(num_frames * 2)
	
	for i in range(num_frames):
		var t = float(i) / sample_rate
		var sample = sin(2.0 * PI * freq * t) * volume * (1.0 - t / duration)
		data[i * 2] = sample
		data[i * 2 + 1] = sample
	
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = true
	
	var byte_data = PackedByteArray()
	byte_data.resize(num_frames * 4)
	for i in range(num_frames * 2):
		var sample = int(clamp(data[i], -1.0, 1.0) * 32767)
		byte_data[i * 2] = sample & 0xFF
		byte_data[i * 2 + 1] = (sample >> 8) & 0xFF
	
	stream.data = byte_data
	return stream

func _create_chord(freqs: Array, duration: float, volume: float = 0.5):
	var sample_rate = 44100
	var num_frames = int(sample_rate * duration)
	var data = PackedFloat32Array()
	data.resize(num_frames * 2)
	
	for i in range(num_frames):
		var t = float(i) / sample_rate
		var sample = 0.0
		for freq in freqs:
			sample += sin(2.0 * PI * freq * t)
		sample *= volume / len(freqs) * (1.0 - t / duration * 0.5)
		data[i * 2] = sample
		data[i * 2 + 1] = sample
	
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = true
	
	var byte_data = PackedByteArray()
	byte_data.resize(num_frames * 4)
	for i in range(num_frames * 2):
		var sample = int(clamp(data[i], -1.0, 1.0) * 32767)
		byte_data[i * 2] = sample & 0xFF
		byte_data[i * 2 + 1] = (sample >> 8) & 0xFF
	
	stream.data = byte_data
	return stream

func _create_ambient_music():
	var sample_rate = 44100
	var duration = 30.0
	var num_frames = int(sample_rate * duration)
	var data = PackedFloat32Array()
	data.resize(num_frames * 2)
	
	var bass_notes = [65.4, 82.4, 98.0, 82.4]
	var melody_notes = [261.6, 329.6, 392.0, 493.9, 523.2]
	var note_duration = 1.5
	
	for i in range(num_frames):
		var t = float(i) / sample_rate
		var bar_index = int(t / note_duration) % 4
		
		var bass_freq = bass_notes[bar_index]
		var bass = sin(2.0 * PI * bass_freq * t) * 0.15
		
		var melody_index = int(t / (note_duration / 2)) % len(melody_notes)
		var melody_freq = melody_notes[melody_index]
		var melody = sin(2.0 * PI * melody_freq * t) * 0.08
		
		var env = 0.5 + 0.5 * sin(2.0 * PI * 0.1 * t)
		var sample = (bass + melody) * env
		
		data[i * 2] = sample
		data[i * 2 + 1] = sample
	
	var stream = AudioStreamWAV.new()
	stream.format = AudioStreamWAV.FORMAT_16_BITS
	stream.mix_rate = sample_rate
	stream.stereo = true
	stream.loop_mode = AudioStreamWAV.LOOP_FORWARD
	stream.loop_begin = 0
	stream.loop_end = num_frames
	
	var byte_data = PackedByteArray()
	byte_data.resize(num_frames * 4)
	for i in range(num_frames * 2):
		var sample = int(clamp(data[i], -1.0, 1.0) * 32767)
		byte_data[i * 2] = sample & 0xFF
		byte_data[i * 2 + 1] = (sample >> 8) & 0xFF
	
	stream.data = byte_data
	return stream

func _trigger_vibration(sfx_name: String):
	var duration: float = 0.0
	var intensity: float = 0.0
	match sfx_name:
		"correct":
			duration = 0.1
			intensity = 0.5
		"wrong":
			duration = 0.2
			intensity = 0.8
		"complete":
			duration = 0.5
			intensity = 0.3
	Input.vibrate_handheld(duration)

func _on_settings_changed():
	if not SettingsManager.get("sound_enabled", true):
		stop_music()
	else:
		if not _music_player.playing:
			play_music()
