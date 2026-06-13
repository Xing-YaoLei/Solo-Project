extends Node

var events: Array = []
var session_data: Dictionary = {}
var max_events: int = 1000

var custom_events: Dictionary = {}

func _ready() -> void:
	EventBus.analytics_event.connect(_on_analytics_event)
	_init_session()

func _init_session() -> void:
	session_data = {
		"session_id": "session_" + str(Time.get_unix_time_from_system()),
		"start_time": Time.get_datetime_string_from_system(),
		"total_plays": 0,
		"total_score": 0,
		"high_score": 0,
		"games_completed": 0,
		"most_used_item": "",
		"item_usage_count": {}
	}
	_load_session_data()

func _on_analytics_event(event_name: String, event_data: Dictionary) -> void:
	var event = {
		"timestamp": Time.get_ticks_msec() / 1000.0,
		"event_name": event_name,
		"event_data": event_data
	}
	events.append(event)
	if events.size() > max_events:
		events.pop_front()
	
	_process_event(event_name, event_data)

func _process_event(event_name: String, event_data: Dictionary) -> void:
	match event_name:
		"game_started":
			session_data["total_plays"] += 1
		"game_ended":
			if event_data.get("success", false):
				session_data["games_completed"] += 1
			var score = event_data.get("score", 0)
			session_data["total_score"] += score
			if score > session_data["high_score"]:
				session_data["high_score"] = score
		"item_used":
			var item_id = event_data.get("id", "")
			if not (item_id in session_data["item_usage_count"]):
				session_data["item_usage_count"][item_id] = 0
			session_data["item_usage_count"][item_id] += 1

func track_custom_event(event_name: String, data: Dictionary = {}) -> void:
	if not (event_name in custom_events):
		custom_events[event_name] = 0
	custom_events[event_name] += 1
	EventBus.emit_analytics(event_name, data)

func get_events_by_name(event_name: String) -> Array:
	var result = []
	for event in events:
		if event["event_name"] == event_name:
			result.append(event)
	return result

func get_event_count(event_name: String) -> int:
	return get_events_by_name(event_name).size()

func get_session_summary() -> Dictionary:
	var summary = session_data.duplicate()
	summary["total_events"] = events.size()
	summary["custom_events"] = custom_events.duplicate()
	return summary

func reset_events() -> void:
	events.clear()

func _load_session_data() -> void:
	var save_path = "user://analytics_save.cfg"
	var config = ConfigFile.new()
	var err = config.load(save_path)
	if err == OK:
		session_data["total_plays"] = config.get_value("session", "total_plays", 0)
		session_data["total_score"] = config.get_value("session", "total_score", 0)
		session_data["high_score"] = config.get_value("session", "high_score", 0)
		session_data["games_completed"] = config.get_value("session", "games_completed", 0)

func save_session_data() -> void:
	var save_path = "user://analytics_save.cfg"
	var config = ConfigFile.new()
	config.set_value("session", "total_plays", session_data["total_plays"])
	config.set_value("session", "total_score", session_data["total_score"])
	config.set_value("session", "high_score", session_data["high_score"])
	config.set_value("session", "games_completed", session_data["games_completed"])
	config.save(save_path)

func get_average_score() -> float:
	if session_data["total_plays"] == 0:
		return 0.0
	return float(session_data["total_score"]) / float(session_data["total_plays"])

func get_completion_rate() -> float:
	if session_data["total_plays"] == 0:
		return 0.0
	return float(session_data["games_completed"]) / float(session_data["total_plays"])
