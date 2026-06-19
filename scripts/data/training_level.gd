class_name TrainingLevel
extends RefCounted

enum Difficulty { BEGINNER, INTERMEDIATE, ADVANCED, EXPERT }

var id: int
var name: String
var description: String
var difficulty: Difficulty
var objective: String
var target_completion_time: float
var target_repair_rate: float
var min_score: int
var order_count: int
var available_parts: Array[String]
var available_services: Array[String]
var time_multiplier: float
var score_multiplier: float
var is_tutorial: bool
var tutorial_steps: Array[TutorialStep]
var required_completed_levels: Array[int]

func _init(p_id: int, p_name: String, p_desc: String, p_difficulty: Difficulty, p_objective: String, p_target_time: float, p_target_repair: float, p_min_score: int, p_order_count: int, p_is_tutorial: bool = false):
	id = p_id
	name = p_name
	description = p_desc
	difficulty = p_difficulty
	objective = p_objective
	target_completion_time = p_target_time
	target_repair_rate = p_target_repair
	min_score = p_min_score
	order_count = p_order_count
	available_parts = []
	available_services = []
	time_multiplier = 1.0
	score_multiplier = 1.0
	is_tutorial = p_is_tutorial
	tutorial_steps = []
	required_completed_levels = []

func get_difficulty_text() -> String:
	match difficulty:
		Difficulty.BEGINNER:
			return "入门"
		Difficulty.INTERMEDIATE:
			return "中级"
		Difficulty.ADVANCED:
			return "高级"
		Difficulty.EXPERT:
			return "专家"
		_:
			return "未知"

func get_difficulty_color() -> Color:
	match difficulty:
		Difficulty.BEGINNER:
			return Color(0.3, 0.8, 0.3)
		Difficulty.INTERMEDIATE:
			return Color(1.0, 0.8, 0.2)
		Difficulty.ADVANCED:
			return Color(1.0, 0.5, 0.2)
		Difficulty.EXPERT:
			return Color(1.0, 0.2, 0.2)
		_:
			return Color.WHITE

func get_stars(p_time: float, p_repair_rate: float, p_score: int) -> int:
	var stars = 0
	if p_time <= target_completion_time:
		stars += 1
	if p_repair_rate <= target_repair_rate:
		stars += 1
	if p_score >= min_score:
		stars += 1
	return stars

func is_unlocked(p_completed_levels: Array[int]) -> bool:
	for required in required_completed_levels:
		if not p_completed_levels.has(required):
			return false
	return true

func add_tutorial_step(p_target: String, p_instruction: String, p_hint: String = "", p_highlight_path: String = "") -> void:
	var step = TutorialStep.new()
	step.target_element = p_target
	step.instruction = p_instruction
	step.hint = p_hint
	step.highlight_path = p_highlight_path
	tutorial_steps.append(step)

func set_available_parts(p_parts: Array[String]) -> void:
	available_parts = p_parts

func set_available_services(p_services: Array[String]) -> void:
	available_services = p_services

func set_required_levels(p_levels: Array[int]) -> void:
	required_completed_levels = p_levels


class TutorialStep extends RefCounted:
	var target_element: String
	var instruction: String
	var hint: String
	var highlight_path: String
	var is_completed: bool = false
	var skip_waiting: bool = false

	func _init():
		pass
