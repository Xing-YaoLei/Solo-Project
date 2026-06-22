class_name TaskData
extends Resource

@export var task_id: String = ""
@export var title: String = ""
@export var description: String = ""
@export var document_type: String = ""
@export var legal_category: String = ""
@export var correct_category: String = ""
@export var correct_sub_category: String = ""
@export var difficulty: int = 1
@export var time_limit: float = 0.0
@export var clue_ids: PackedStringArray = []
@export var risk_word_ids: PackedStringArray = []
@export var is_unlocked: bool = false
@export var required_level: int = 0

func serialize() -> Dictionary:
	return {
		"task_id": task_id,
		"title": title,
		"description": description,
		"document_type": document_type,
		"legal_category": legal_category,
		"correct_category": correct_category,
		"correct_sub_category": correct_sub_category,
		"difficulty": difficulty,
		"time_limit": time_limit,
		"clue_ids": clue_ids,
		"risk_word_ids": risk_word_ids,
		"is_unlocked": is_unlocked,
		"required_level": required_level,
	}

func deserialize(data: Dictionary) -> void:
	task_id = data.get("task_id", "")
	title = data.get("title", "")
	description = data.get("description", "")
	document_type = data.get("document_type", "")
	legal_category = data.get("legal_category", "")
	correct_category = data.get("correct_category", "")
	correct_sub_category = data.get("correct_sub_category", "")
	difficulty = data.get("difficulty", 1)
	time_limit = data.get("time_limit", 0.0)
	clue_ids = PackedStringArray(data.get("clue_ids", []))
	risk_word_ids = PackedStringArray(data.get("risk_word_ids", []))
	is_unlocked = data.get("is_unlocked", false)
	required_level = data.get("required_level", 0)
