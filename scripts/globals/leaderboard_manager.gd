extends Node

signal leaderboard_updated()

class LeaderboardEntry extends RefCounted:
	var player_name: String
	var score: int
	var completion_time: float
	var repair_rate: float
	var completed_orders: int
	var difficulty: int
	var timestamp: float
	var is_training_mode: bool
	var level_id: int

	func _init(p_name: String, p_score: int, p_time: float, p_repair: float, p_orders: int, p_difficulty: int, p_is_training: bool = false, p_level: int = 0):
		player_name = p_name
		score = p_score
		completion_time = p_time
		repair_rate = p_repair
		completed_orders = p_orders
		difficulty = p_difficulty
		timestamp = Time.get_unix_time_from_system()
		is_training_mode = p_is_training
		level_id = p_level

	func to_dict() -> Dictionary:
		return {
			"player_name": player_name,
			"score": score,
			"completion_time": completion_time,
			"repair_rate": repair_rate,
			"completed_orders": completed_orders,
			"difficulty": difficulty,
			"timestamp": timestamp,
			"is_training_mode": is_training_mode,
			"level_id": level_id
		}

	func from_dict(p_dict: Dictionary) -> void:
		player_name = p_dict.get("player_name", "Unknown")
		score = p_dict.get("score", 0)
		completion_time = p_dict.get("completion_time", 0.0)
		repair_rate = p_dict.get("repair_rate", 0.0)
		completed_orders = p_dict.get("completed_orders", 0)
		difficulty = p_dict.get("difficulty", 0)
		timestamp = p_dict.get("timestamp", 0.0)
		is_training_mode = p_dict.get("is_training_mode", false)
		level_id = p_dict.get("level_id", 0)

var time_leaderboard: Array[LeaderboardEntry] = []
var repair_leaderboard: Array[LeaderboardEntry] = []
var max_entries: int = 100

const SAVE_PATH_TIME := "user://leaderboard_time.cfg"
const SAVE_PATH_REPAIR := "user://leaderboard_repair.cfg"

func _ready():
	load_leaderboards()

func add_entry(p_player_name: String, p_score: int, p_time: float, p_repair_rate: float, p_orders: int, p_difficulty: int, p_is_training: bool = false, p_level: int = 0) -> void:
	var entry = LeaderboardEntry.new(p_player_name, p_score, p_time, p_repair_rate, p_orders, p_difficulty, p_is_training, p_level)

	_add_to_time_board(entry.duplicate())
	_add_to_repair_board(entry.duplicate())

	save_leaderboards()
	leaderboard_updated.emit()

func _add_to_time_board(p_entry: LeaderboardEntry) -> void:
	time_leaderboard.append(p_entry)
	time_leaderboard.sort_custom(func(a: LeaderboardEntry, b: LeaderboardEntry) -> bool:
		return a.completion_time < b.completion_time
	)
	if time_leaderboard.size() > max_entries:
		time_leaderboard.resize(max_entries)

func _add_to_repair_board(p_entry: LeaderboardEntry) -> void:
	repair_leaderboard.append(p_entry)
	repair_leaderboard.sort_custom(func(a: LeaderboardEntry, b: LeaderboardEntry) -> bool:
		return a.repair_rate < b.repair_rate
	)
	if repair_leaderboard.size() > max_entries:
		repair_leaderboard.resize(max_entries)

func get_time_leaderboard(p_limit: int = 10, p_is_training_mode: bool = false, p_level: int = -1) -> Array[LeaderboardEntry]:
	var result: Array[LeaderboardEntry] = []
	for entry in time_leaderboard:
		var match_mode = true
		if p_level != -1:
			match_mode = entry.is_training_mode == p_is_training_mode
		var match_level = p_level == -1 or entry.level_id == p_level
		if match_mode and match_level:
			result.append(entry)
			if result.size() >= p_limit:
				break
	return result

func get_repair_leaderboard(p_limit: int = 10, p_is_training_mode: bool = false, p_level: int = -1) -> Array[LeaderboardEntry]:
	var result: Array[LeaderboardEntry] = []
	for entry in repair_leaderboard:
		var match_mode = true
		if p_level != -1:
			match_mode = entry.is_training_mode == p_is_training_mode
		var match_level = p_level == -1 or entry.level_id == p_level
		if match_mode and match_level:
			result.append(entry)
			if result.size() >= p_limit:
				break
	return result

func get_time_rank(p_time: float, p_is_training: bool = false, p_level: int = -1) -> int:
	var rank = 1
	for entry in time_leaderboard:
		var match_training = entry.is_training_mode == p_is_training
		var match_level = p_level == -1 or entry.level_id == p_level
		if match_training and match_level and entry.completion_time < p_time:
			rank += 1
	return rank

func get_repair_rank(p_repair_rate: float, p_is_training: bool = false, p_level: int = -1) -> int:
	var rank = 1
	for entry in repair_leaderboard:
		var match_training = entry.is_training_mode == p_is_training
		var match_level = p_level == -1 or entry.level_id == p_level
		if match_training and match_level and entry.repair_rate < p_repair_rate:
			rank += 1
	return rank

func clear_leaderboards() -> void:
	time_leaderboard.clear()
	repair_leaderboard.clear()
	save_leaderboards()
	leaderboard_updated.emit()

func save_leaderboards() -> void:
	var config_time = ConfigFile.new()
	for i in range(time_leaderboard.size()):
		var key = "entry_%d" % i
		config_time.set_value("Leaderboard", key, time_leaderboard[i].to_dict())
	config_time.save(SAVE_PATH_TIME)

	var config_repair = ConfigFile.new()
	for i in range(repair_leaderboard.size()):
		var key = "entry_%d" % i
		config_repair.set_value("Leaderboard", key, repair_leaderboard[i].to_dict())
	config_repair.save(SAVE_PATH_REPAIR)

func load_leaderboards() -> void:
	var config_time = ConfigFile.new()
	var error = config_time.load(SAVE_PATH_TIME)
	if error == OK:
		time_leaderboard.clear()
		for i in range(max_entries):
			var key = "entry_%d" % i
			if config_time.has_section_key("Leaderboard", key):
				var data = config_time.get_value("Leaderboard", key)
				var entry = LeaderboardEntry.new("", 0, 0.0, 0.0, 0, 0)
				entry.from_dict(data)
				time_leaderboard.append(entry)

	var config_repair = ConfigFile.new()
	error = config_repair.load(SAVE_PATH_REPAIR)
	if error == OK:
		repair_leaderboard.clear()
		for i in range(max_entries):
			var key = "entry_%d" % i
			if config_repair.has_section_key("Leaderboard", key):
				var data = config_repair.get_value("Leaderboard", key)
				var entry = LeaderboardEntry.new("", 0, 0.0, 0.0, 0, 0)
				entry.from_dict(data)
				repair_leaderboard.append(entry)

func format_time(p_seconds: float) -> String:
	var minutes = int(p_seconds / 60)
	var seconds = int(p_seconds % 60)
	var ms = int((p_seconds - int(p_seconds)) * 100)
	return "%02d:%02d.%02d" % [minutes, seconds, ms]

func format_repair_rate(p_rate: float) -> String:
	return "%.1f%%" % [p_rate * 100.0]
