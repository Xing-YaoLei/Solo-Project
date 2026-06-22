class_name LevelManager
extends Node

signal level_loaded(level_id: String)
signal task_changed(task_index: int)
signal all_tasks_completed

var levels_data: Dictionary = {}
var current_level: Dictionary = {}
var current_task_index: int = 0
var unlocked_levels: PackedStringArray = []

func _ready() -> void:
	_load_all_levels()
	_restore_unlock_state()
	_ensure_first_level_unlocked()

func _restore_unlock_state() -> void:
	var save_data: Dictionary = SaveManager.load_game(0)
	if save_data.is_empty():
		return
	var saved_unlocked: Array = save_data.get("unlocked_levels", [])
	for level_id in saved_unlocked:
		if levels_data.has(level_id) and not level_id in unlocked_levels:
			unlocked_levels.append(level_id)

func _ensure_first_level_unlocked() -> void:
	if unlocked_levels.is_empty() and not levels_data.is_empty():
		var sorted_ids: Array = levels_data.keys()
		sorted_ids.sort()
		if not sorted_ids.is_empty():
			unlocked_levels.append(sorted_ids[0])

func load_level(level_id: String) -> bool:
	if not levels_data.has(level_id):
		return false
	current_level = levels_data[level_id].duplicate()
	current_task_index = 0
	level_loaded.emit(level_id)
	return true

func get_current_level() -> Dictionary:
	return current_level

func get_current_task() -> Dictionary:
	var tasks: Array = current_level.get("tasks", [])
	if current_task_index < 0 or current_task_index >= tasks.size():
		return {}
	return tasks[current_task_index]

func advance_task() -> bool:
	var tasks: Array = current_level.get("tasks", [])
	if current_task_index + 1 >= tasks.size():
		all_tasks_completed.emit()
		return false
	current_task_index += 1
	task_changed.emit(current_task_index)
	return true

func get_task_clues(task_id: String = "") -> Array:
	var target_task: Dictionary = _find_task(task_id)
	if target_task.is_empty():
		return []
	return target_task.get("clues", [])

func get_task_choices(task_id: String = "") -> Array:
	var target_task: Dictionary = _find_task(task_id)
	if target_task.is_empty():
		return []
	return target_task.get("choices", [])

func get_task_risk_words(task_id: String = "") -> Array:
	var target_task: Dictionary = _find_task(task_id)
	if target_task.is_empty():
		return []
	return target_task.get("risk_words", [])

func unlock_level(level_id: String) -> bool:
	if not levels_data.has(level_id):
		return false
	if level_id in unlocked_levels:
		return false
	unlocked_levels.append(level_id)
	return true

func is_level_unlocked(level_id: String) -> bool:
	return level_id in unlocked_levels

func get_all_levels() -> Dictionary:
	return levels_data

func _load_all_levels() -> void:
	var dir: DirAccess = DirAccess.open("res://data/levels/")
	if dir == null:
		return
	dir.list_dir_begin()
	var file_name: String = dir.get_next()
	while file_name != "":
		if file_name.ends_with(".json"):
			var file_path: String = "res://data/levels/" + file_name
			var level_data: Dictionary = _load_level_from_file(file_path)
			if not level_data.is_empty():
				var level_id: String = level_data.get("level_id", "")
				if level_id != "":
					levels_data[level_id] = level_data
		file_name = dir.get_next()
	dir.list_dir_end()

func _load_level_from_file(file_path: String) -> Dictionary:
	if not FileAccess.file_exists(file_path):
		return {}
	var file: FileAccess = FileAccess.open(file_path, FileAccess.READ)
	if file == null:
		return {}
	var json_string: String = file.get_as_text()
	file.close()
	var json: JSON = JSON.new()
	var result: Error = json.parse(json_string)
	if result != OK:
		return {}
	return json.data if json.data is Dictionary else {}

func _find_task(task_id: String) -> Dictionary:
	var target_id: String = task_id
	if target_id == "":
		return get_current_task()
	var tasks: Array = current_level.get("tasks", [])
	for task: Dictionary in tasks:
		if task.get("task_id", "") == target_id:
			return task
	return {}
