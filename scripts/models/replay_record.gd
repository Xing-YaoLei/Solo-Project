class_name ReplayRecord
extends Resource

@export var replay_id: String = ""
@export var task_id: String = ""
@export var attempt_number: int = 1
@export var max_attempts: int = 3
@export var timestamp: Dictionary = {}
@export var actions: Array[Dictionary] = []
@export var final_outcome: String = ""
@export var stuck_positions: Array[Dictionary] = []
@export var error_causes: PackedStringArray = []
@export var duration: float = 0.0
@export var score: int = 0

func serialize() -> Dictionary:
	return {
		"replay_id": replay_id,
		"task_id": task_id,
		"attempt_number": attempt_number,
		"max_attempts": max_attempts,
		"timestamp": timestamp,
		"actions": actions,
		"final_outcome": final_outcome,
		"stuck_positions": stuck_positions,
		"error_causes": error_causes,
		"duration": duration,
		"score": score,
	}

func deserialize(data: Dictionary) -> void:
	replay_id = data.get("replay_id", "")
	task_id = data.get("task_id", "")
	attempt_number = data.get("attempt_number", 1)
	max_attempts = data.get("max_attempts", 3)
	timestamp = data.get("timestamp", {})
	actions = data.get("actions", [])
	final_outcome = data.get("final_outcome", "")
	stuck_positions = data.get("stuck_positions", [])
	error_causes = PackedStringArray(data.get("error_causes", []))
	duration = data.get("duration", 0.0)
	score = data.get("score", 0)
