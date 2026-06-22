class_name LeaderboardManager
extends Node

const MAX_ENTRIES: int = 50
const LEADERBOARD_FILE: String = "user://leaderboard.json"

class LeaderboardEntry:
	var player_name: String = ""
	var score: int = 0
	var task_id: String = ""
	var timestamp: Dictionary = {}
	var completion_time: float = 0.0

	func to_dict() -> Dictionary:
		return {
			"player_name": player_name,
			"score": score,
			"task_id": task_id,
			"timestamp": timestamp,
			"completion_time": completion_time,
		}

	static func from_dict(data: Dictionary) -> LeaderboardEntry:
		var entry: LeaderboardEntry = LeaderboardEntry.new()
		entry.player_name = data.get("player_name", "")
		entry.score = data.get("score", 0)
		entry.task_id = data.get("task_id", "")
		entry.timestamp = data.get("timestamp", {})
		entry.completion_time = data.get("completion_time", 0.0)
		return entry

func add_entry(player_name: String, score: int, task_id: String, completion_time: float) -> bool:
	var entries: Array = _load_leaderboard()
	var entry: LeaderboardEntry = LeaderboardEntry.new()
	entry.player_name = player_name
	entry.score = score
	entry.task_id = task_id
	entry.timestamp = Time.get_datetime_dict_from_system()
	entry.completion_time = completion_time
	entries.append(entry.to_dict())
	entries.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return a.get("score", 0) > b.get("score", 0)
	)
	if entries.size() > MAX_ENTRIES:
		entries = entries.slice(0, MAX_ENTRIES)
	return _save_leaderboard(entries)

func get_entries(task_id: String = "") -> Array:
	var entries: Array = _load_leaderboard()
	if task_id != "":
		entries = entries.filter(func(e: Dictionary) -> bool:
			return e.get("task_id", "") == task_id
		)
	entries.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return a.get("score", 0) > b.get("score", 0)
	)
	return entries

func get_top_entries(count: int = 10, task_id: String = "") -> Array:
	var entries: Array = get_entries(task_id)
	if entries.size() <= count:
		return entries
	return entries.slice(0, count)

func get_player_best(player_name: String) -> Dictionary:
	var entries: Array = _load_leaderboard()
	var player_entries: Array = entries.filter(func(e: Dictionary) -> bool:
		return e.get("player_name", "") == player_name
	)
	if player_entries.is_empty():
		return {}
	player_entries.sort_custom(func(a: Dictionary, b: Dictionary) -> bool:
		return a.get("score", 0) > b.get("score", 0)
	)
	return player_entries[0]

func clear_leaderboard() -> bool:
	return _save_leaderboard([])

func _load_leaderboard() -> Array:
	if not FileAccess.file_exists(LEADERBOARD_FILE):
		return []
	var file: FileAccess = FileAccess.open(LEADERBOARD_FILE, FileAccess.READ)
	if file == null:
		return []
	var json_string: String = file.get_as_text()
	file.close()
	var json: JSON = JSON.new()
	var result: Error = json.parse(json_string)
	if result != OK:
		return []
	return json.data if json.data is Array else []

func _save_leaderboard(entries: Array) -> bool:
	var file: FileAccess = FileAccess.open(LEADERBOARD_FILE, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(entries))
	file.close()
	return true
