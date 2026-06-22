class_name ChoiceData
extends Resource

@export var choice_id: String = ""
@export var task_id: String = ""
@export var display_text: String = ""
@export var category: String = ""
@export var sub_category: String = ""
@export var is_correct: bool = false
@export var score_value: int = 0
@export var feedback: String = ""
@export var error_type: String = ""
@export var triggers_rejection: bool = false
@export var rejection_reason: String = ""

func serialize() -> Dictionary:
	return {
		"choice_id": choice_id,
		"task_id": task_id,
		"display_text": display_text,
		"category": category,
		"sub_category": sub_category,
		"is_correct": is_correct,
		"score_value": score_value,
		"feedback": feedback,
		"error_type": error_type,
		"triggers_rejection": triggers_rejection,
		"rejection_reason": rejection_reason,
	}

func deserialize(data: Dictionary) -> void:
	choice_id = data.get("choice_id", "")
	task_id = data.get("task_id", "")
	display_text = data.get("display_text", "")
	category = data.get("category", "")
	sub_category = data.get("sub_category", "")
	is_correct = data.get("is_correct", false)
	score_value = data.get("score_value", 0)
	feedback = data.get("feedback", "")
	error_type = data.get("error_type", "")
	triggers_rejection = data.get("triggers_rejection", false)
	rejection_reason = data.get("rejection_reason", "")
