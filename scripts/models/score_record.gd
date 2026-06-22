class_name ScoreRecord
extends Resource

@export var record_id: String = ""
@export var task_id: String = ""
@export var player_name: String = ""
@export var timestamp: Dictionary = {}
@export var total_score: int = 0
@export var category_score: int = 0
@export var risk_word_score: int = 0
@export var time_bonus: int = 0
@export var errors: Array[Dictionary] = []
@export var error_summary: String = ""
@export var rejection_triggered: bool = false
@export var rejection_reasons: PackedStringArray = []
@export var completion_time: float = 0.0
@export var stuck_points: Array[Dictionary] = []

func serialize() -> Dictionary:
	return {
		"record_id": record_id,
		"task_id": task_id,
		"player_name": player_name,
		"timestamp": timestamp,
		"total_score": total_score,
		"category_score": category_score,
		"risk_word_score": risk_word_score,
		"time_bonus": time_bonus,
		"errors": errors,
		"error_summary": error_summary,
		"rejection_triggered": rejection_triggered,
		"rejection_reasons": rejection_reasons,
		"completion_time": completion_time,
		"stuck_points": stuck_points,
	}

func deserialize(data: Dictionary) -> void:
	record_id = data.get("record_id", "")
	task_id = data.get("task_id", "")
	player_name = data.get("player_name", "")
	timestamp = data.get("timestamp", {})
	total_score = data.get("total_score", 0)
	category_score = data.get("category_score", 0)
	risk_word_score = data.get("risk_word_score", 0)
	time_bonus = data.get("time_bonus", 0)
	errors = data.get("errors", [])
	error_summary = data.get("error_summary", "")
	rejection_triggered = data.get("rejection_triggered", false)
	rejection_reasons = PackedStringArray(data.get("rejection_reasons", []))
	completion_time = data.get("completion_time", 0.0)
	stuck_points = data.get("stuck_points", [])
