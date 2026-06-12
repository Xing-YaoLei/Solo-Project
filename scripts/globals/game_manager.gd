extends Node

signal scene_changed(scene_name)
signal game_started(level_id)
signal game_completed(score, accuracy)
signal training_recorded(record)

enum GameMode { TRAINING, FREE_PRACTICE }

var current_scene: String = "Main"
var current_level_id: String = ""
var current_game_mode: int = GameMode.TRAINING
var current_score: int = 0
var current_accuracy: float = 0.0
var total_questions: int = 0
var correct_questions: int = 0
var gameplay_data: Dictionary = {}

var unlocked_levels: Array = ["level_1"]

func _ready() -> void:
	load_progress()

func change_scene(scene_name: String) -> void:
	current_scene = scene_name
	var scene_path: String = "res://scenes/%s.tscn" % scene_name
	if ResourceLoader.exists(scene_path):
		get_tree().change_scene_to_file(scene_path)
		scene_changed.emit(scene_name)

func start_game(level_id: String, mode: int = GameMode.TRAINING) -> void:
	current_level_id = level_id
	current_game_mode = mode
	current_score = 0
	current_accuracy = 0.0
	total_questions = 0
	correct_questions = 0
	gameplay_data.clear()
	game_started.emit(level_id)
	change_scene("Gameplay")

func end_game() -> void:
	if total_questions > 0:
		current_accuracy = float(correct_questions) / float(total_questions) * 100.0
	else:
		current_accuracy = 0.0
	var record: Dictionary = {
		"level_id": current_level_id,
		"mode": current_game_mode,
		"score": current_score,
		"accuracy": current_accuracy,
		"total_questions": total_questions,
		"correct_questions": correct_questions,
		"timestamp": Time.get_unix_time_from_system(),
		"gameplay_data": gameplay_data.duplicate()
	}
	DataManager.save_training_record(record)
	training_recorded.emit(record)
	game_completed.emit(current_score, current_accuracy)
	unlock_next_level(current_level_id)
	save_progress()
	change_scene("Result")

func add_question_result(is_correct: bool, score: int, question_type: String, extra: Dictionary = {}) -> void:
	total_questions += 1
	if is_correct:
		correct_questions += 1
		current_score += score
	var key: String = "%s_%d" % [question_type, total_questions]
	var data: Dictionary = {
		"type": question_type,
		"is_correct": is_correct,
		"score": score
	}
	data.merge(extra)
	gameplay_data[key] = data

func unlock_next_level(completed_level_id: String) -> void:
	var levels: Array = DataManager.get_levels()
	for i in range(levels.size()):
		if levels[i]["id"] == completed_level_id and i + 1 < levels.size():
			var next_level_id: String = levels[i + 1]["id"]
			if next_level_id not in unlocked_levels:
				unlocked_levels.append(next_level_id)
			break

func is_level_unlocked(level_id: String) -> bool:
	return level_id in unlocked_levels or current_game_mode == GameMode.FREE_PRACTICE

func save_progress() -> void:
	var save_data: Dictionary = {
		"unlocked_levels": unlocked_levels.duplicate()
	}
	var file: FileAccess = FileAccess.open("user://progress.save", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(save_data))
		file.close()

func load_progress() -> void:
	if FileAccess.file_exists("user://progress.save"):
		var file: FileAccess = FileAccess.open("user://progress.save", FileAccess.READ)
		if file:
			var content: String = file.get_as_text()
			file.close()
			var data: Variant = JSON.parse_string(content)
			if data is Dictionary:
				if data.has("unlocked_levels"):
					unlocked_levels = data["unlocked_levels"]
