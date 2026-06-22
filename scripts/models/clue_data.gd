class_name ClueData
extends Resource

@export var clue_id: String = ""
@export var task_id: String = ""
@export var content: String = ""
@export var clue_type: String = ""
@export var hint_text: String = ""
@export var relevance: float = 1.0
@export var is_revealed: bool = false
@export var reveal_order: int = 0

func serialize() -> Dictionary:
	return {
		"clue_id": clue_id,
		"task_id": task_id,
		"content": content,
		"clue_type": clue_type,
		"hint_text": hint_text,
		"relevance": relevance,
		"is_revealed": is_revealed,
		"reveal_order": reveal_order,
	}

func deserialize(data: Dictionary) -> void:
	clue_id = data.get("clue_id", "")
	task_id = data.get("task_id", "")
	content = data.get("content", "")
	clue_type = data.get("clue_type", "")
	hint_text = data.get("hint_text", "")
	relevance = data.get("relevance", 1.0)
	is_revealed = data.get("is_revealed", false)
	reveal_order = data.get("reveal_order", 0)
