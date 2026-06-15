extends Node

signal scene_changed(scene_name: String)

const SCENES := {
	"main_menu": "res://scenes/MainMenu.tscn",
	"level_select": "res://scenes/LevelSelect.tscn",
	"textbook_identify": "res://scenes/TextbookIdentify.tscn",
	"approval_select": "res://scenes/ApprovalSelect.tscn",
	"course_sort": "res://scenes/CourseSort.tscn",
	"classroom_allocate": "res://scenes/ClassroomAllocate.tscn",
	"result": "res://scenes/ResultScreen.tscn",
	"statistics": "res://scenes/Statistics.tscn",
	"config": "res://scenes/ConfigScreen.tscn"
}

var current_scene_name: String = ""
var current_level_type: String = ""
var current_level_index: int = 0
var last_result: Dictionary = {}

func change_scene(scene_name: String) -> void:
	if not SCENES.has(scene_name):
		push_error("Scene not found: " + scene_name)
		return
	
	current_scene_name = scene_name
	var packed_scene = load(SCENES[scene_name])
	if packed_scene:
		get_tree().change_scene_to_packed(packed_scene)
		scene_changed.emit(scene_name)

func start_level(level_type: String, level_index: int) -> void:
	current_level_type = level_type
	current_level_index = level_index
	GameManager.start_level(level_type, level_index)
	change_scene(level_type)

func show_result(result_data: Dictionary) -> void:
	last_result = result_data
	change_scene("result")

func go_back() -> void:
	match current_scene_name:
		"result", "textbook_identify", "approval_select", "course_sort", "classroom_allocate":
			change_scene("level_select")
		"level_select", "statistics", "config":
			change_scene("main_menu")
		_:
			change_scene("main_menu")
