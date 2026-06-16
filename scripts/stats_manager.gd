extends Node

var _round_history: Array = []
var _leaderboard_revisit: Array = []
var _leaderboard_time: Array = []

signal stats_updated()
signal leaderboard_changed()

func _ready() -> void:
	_load_stats()

func record_round(summary: Dictionary) -> void:
	_round_history.append(summary)
	if _round_history.size() > 50:
		_round_history.pop_front()
	_update_leaderboard(summary)
	stats_updated.emit()
	leaderboard_changed.emit()
	_save_stats()

func get_revisit_rate_overall() -> float:
	if _round_history.is_empty():
		return 0.0
	var total_completed = 0
	var total_no_show = 0
	for r in _round_history:
		total_completed += r.get("patients_completed", 0)
		total_no_show += r.get("patients_no_show", 0)
	var total = total_completed + total_no_show
	if total == 0:
		return 0.0
	return float(total_completed) / float(total)

func get_revisit_rate_trend() -> Array:
	var trend = []
	for r in _round_history:
		trend.append(r.get("revisit_rate", 0.0))
	return trend

func get_error_breakdown() -> Dictionary:
	var breakdown = {}
	for r in _round_history:
		var cats = r.get("error_categories", {})
		for key in cats:
			if not breakdown.has(key):
				breakdown[key] = 0
			breakdown[key] += cats[key]
	return breakdown

func get_leaderboard_by_revisit() -> Array:
	return _leaderboard_revisit.duplicate(true)

func get_leaderboard_by_time() -> Array:
	return _leaderboard_time.duplicate(true)

func _update_leaderboard(summary: Dictionary) -> void:
	var entry = {
		"round": summary.get("round", 0),
		"revisit_rate": summary.get("revisit_rate", 0.0),
		"elapsed_time": summary.get("elapsed_time", 0.0),
		"patients_completed": summary.get("patients_completed", 0),
		"total_errors": summary.get("total_errors", 0),
	}
	_leaderboard_revisit.append(entry)
	_leaderboard_revisit.sort_custom(func(a, b): return a["revisit_rate"] > b["revisit_rate"])
	if _leaderboard_revisit.size() > 20:
		_leaderboard_revisit = _leaderboard_revisit.slice(0, 20)
	_leaderboard_time.append(entry)
	_leaderboard_time.sort_custom(func(a, b): return a["elapsed_time"] < b["elapsed_time"])
	if _leaderboard_time.size() > 20:
		_leaderboard_time = _leaderboard_time.slice(0, 20)

func get_stats_summary() -> Dictionary:
	return {
		"total_rounds": _round_history.size(),
		"overall_revisit_rate": get_revisit_rate_overall(),
		"revisit_rate_trend": get_revisit_rate_trend(),
		"error_breakdown": get_error_breakdown(),
		"leaderboard_revisit": _leaderboard_revisit,
		"leaderboard_time": _leaderboard_time,
	}

func _save_stats() -> void:
	var save_data = {
		"round_history": _round_history,
		"leaderboard_revisit": _leaderboard_revisit,
		"leaderboard_time": _leaderboard_time,
	}
	var file = FileAccess.open("user://stats.save", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(save_data))
		file.close()

func _load_stats() -> void:
	if FileAccess.file_exists("user://stats.save"):
		var file = FileAccess.open("user://stats.save", FileAccess.READ)
		if file:
			var json = JSON.new()
			var err = json.parse(file.get_as_text())
			file.close()
			if err == OK:
				var data = json.data
				if data is Dictionary:
					_round_history = data.get("round_history", [])
					_leaderboard_revisit = data.get("leaderboard_revisit", [])
					_leaderboard_time = data.get("leaderboard_time", [])
