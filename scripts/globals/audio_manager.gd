extends Node

var sfx_player: AudioStreamPlayer
var music_player: AudioStreamPlayer

var sfx_volume: float = 0.8
var music_volume: float = 0.7
var sound_enabled: bool = true

func _ready() -> void:
	sfx_player = AudioStreamPlayer.new()
	music_player = AudioStreamPlayer.new()
	add_child(sfx_player)
	add_child(music_player)
	sfx_player.volume_db = linear_to_db(sfx_volume)
	music_player.volume_db = linear_to_db(music_volume)
	load_config()

func load_config() -> void:
	var config: Dictionary = DataManager.get_config()
	sound_enabled = config.get("sound_enabled", true)
	music_volume = config.get("music_volume", 0.7)
	sfx_volume = config.get("sfx_volume", 0.8)
	update_volumes()

func update_volumes() -> void:
	sfx_player.volume_db = linear_to_db(sfx_volume) if sound_enabled else -80
	music_player.volume_db = linear_to_db(music_volume) if sound_enabled else -80

func play_sfx(sfx_name: String) -> void:
	if not sound_enabled:
		return
	var sfx_path: String = "res://assets/sounds/%s.wav" % sfx_name
	if ResourceLoader.exists(sfx_path):
		var stream: AudioStream = load(sfx_path)
		if stream:
			sfx_player.stream = stream
			sfx_player.play()

func play_correct() -> void:
	play_sfx("correct")

func play_wrong() -> void:
	play_sfx("wrong")

func play_click() -> void:
	play_sfx("click")

func play_complete() -> void:
	play_sfx("complete")

func play_music(music_name: String) -> void:
	if not sound_enabled:
		return
	var music_path: String = "res://assets/sounds/%s.mp3" % music_name
	if ResourceLoader.exists(music_path):
		var stream: AudioStream = load(music_path)
		if stream:
			music_player.stream = stream
			music_player.loop = true
			music_player.play()

func stop_music() -> void:
	music_player.stop()

func set_sound_enabled(enabled: bool) -> void:
	sound_enabled = enabled
	DataManager.update_config({"sound_enabled": enabled})
	update_volumes()

func set_music_volume(volume: float) -> void:
	music_volume = clamp(volume, 0.0, 1.0)
	DataManager.update_config({"music_volume": music_volume})
	update_volumes()

func set_sfx_volume(volume: float) -> void:
	sfx_volume = clamp(volume, 0.0, 1.0)
	DataManager.update_config({"sfx_volume": sfx_volume})
	update_volumes()
