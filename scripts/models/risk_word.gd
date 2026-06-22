class_name RiskWord
extends Resource

@export var word_id: String = ""
@export var word: String = ""
@export var severity: int = 1
@export var category: String = ""
@export var description: String = ""
@export var legal_reference: String = ""
@export var appears_in_task: String = ""
@export var hint: String = ""

func serialize() -> Dictionary:
	return {
		"word_id": word_id,
		"word": word,
		"severity": severity,
		"category": category,
		"description": description,
		"legal_reference": legal_reference,
		"appears_in_task": appears_in_task,
		"hint": hint,
	}

func deserialize(data: Dictionary) -> void:
	word_id = data.get("word_id", "")
	word = data.get("word", "")
	severity = data.get("severity", 1)
	category = data.get("category", "")
	description = data.get("description", "")
	legal_reference = data.get("legal_reference", "")
	appears_in_task = data.get("appears_in_task", "")
	hint = data.get("hint", "")
