extends Node

signal game_started(mode: String)
signal game_completed(result: Dictionary)
signal question_answered(correct: bool, question_id: String)
signal permission_violation(reason: String)
signal scene_changed(scene_name: String)

const SCENES = {
	"main_menu": "res://scenes/MainMenu.tscn",
	"formal_training": "res://scenes/FormalTrainingSelect.tscn",
	"free_practice": "res://scenes/FreePracticeSelect.tscn",
	"evidence_identification": "res://scenes/games/EvidenceIdentification.tscn",
	"template_selection": "res://scenes/games/TemplateSelection.tscn",
	"checklist_sorting": "res://scenes/games/ChecklistSorting.tscn",
	"sampling_processing": "res://scenes/games/SamplingProcessing.tscn",
	"result_review": "res://scenes/ResultReview.tscn",
	"config_management": "res://scenes/ConfigManagement.tscn"
}

var current_scene_name: String = "main_menu"
var current_mode: String = ""
var current_level: Dictionary = {}
var training_record: Dictionary = {}

func _ready() -> void:
	DataManager.load_all_data()
	TrainingRecordManager.load_records()

func change_scene(scene_key: String) -> void:
	if scene_key in SCENES:
		current_scene_name = scene_key
		get_tree().change_scene_to_file(SCENES[scene_key])
		emit_signal("scene_changed", scene_key)

func start_game(mode: String, level_data: Dictionary) -> void:
	current_mode = mode
	current_level = level_data
	training_record = {
		"mode": mode,
		"level_id": level_data.get("id", ""),
		"level_name": level_data.get("name", ""),
		"start_time": Time.get_unix_time_from_system(),
		"questions": [],
		"total_score": 0,
		"max_score": 0,
		"permission_violations": [],
		"mistakes": []
	}
	emit_signal("game_started", mode)

func record_answer(question_id: String, correct: bool, score: int, max_score: int, user_answer, correct_answer, mistake_type: String = "") -> void:
	var record := {
		"question_id": question_id,
		"correct": correct,
		"score": score,
		"max_score": max_score,
		"user_answer": user_answer,
		"correct_answer": correct_answer,
		"timestamp": Time.get_unix_time_from_system()
	}
	training_record["questions"].append(record)
	training_record["total_score"] += score
	training_record["max_score"] += max_score
	if not correct:
		training_record["mistakes"].append({
			"question_id": question_id,
			"mistake_type": mistake_type,
			"user_answer": user_answer,
			"correct_answer": correct_answer
		})
	emit_signal("question_answered", correct, question_id)

func record_permission_violation(reason: String) -> void:
	training_record["permission_violations"].append({
		"reason": reason,
		"timestamp": Time.get_unix_time_from_system()
	})
	emit_signal("permission_violation", reason)

func finish_game() -> Dictionary:
	training_record["end_time"] = Time.get_unix_time_from_system()
	training_record["duration"] = training_record["end_time"] - training_record["start_time"]
	training_record["accuracy"] = float(training_record["total_score"]) / float(training_record["max_score"]) if training_record["max_score"] > 0 else 0.0
	TrainingRecordManager.add_record(training_record)
	emit_signal("game_completed", training_record)
	return training_record
