extends Node

signal tutorial_started()
signal tutorial_step_completed(p_step_index: int)
signal tutorial_completed()
signal tutorial_skipped()

var is_active: bool = false
var current_level: TrainingLevel
var current_step_index: int = 0
var current_step: TrainingLevel.TutorialStep
var has_completed_tutorial: bool = false
var highlight_node: Node
var instruction_label: Label

const TUTORIAL_COMPLETED_KEY := "tutorial_completed"

func _ready():
	load_tutorial_state()

func start_tutorial(p_level: TrainingLevel, p_highlight_node: Node, p_instruction_label: Label) -> void:
	if not SettingsManager.show_tutorial:
		tutorial_skipped.emit()
		return

	if not p_level.is_tutorial or p_level.tutorial_steps.size() == 0:
		tutorial_skipped.emit()
		return

	is_active = true
	current_level = p_level
	current_step_index = 0
	highlight_node = p_highlight_node
	instruction_label = p_instruction_label

	_show_current_step()
	tutorial_started.emit()

func _show_current_step() -> void:
	if current_step_index >= current_level.tutorial_steps.size():
		complete_tutorial()
		return

	current_step = current_level.tutorial_steps[current_step_index]

	if instruction_label:
		instruction_label.text = current_step.instruction
		instruction_label.visible = true

	if highlight_node and current_step.highlight_path:
		var target = highlight_node.get_node_or_null(current_step.highlight_path)
		if target:
			_highlight_node(target)

func _highlight_node(p_node: Node) -> void:
	if p_node is Control:
		var highlight = ColorRect.new()
		highlight.name = "TutorialHighlight"
		highlight.color = Color(1.0, 1.0, 0.0, 0.3)
		highlight.rect_min_size = p_node.rect_size
		highlight.z_index = 100
		p_node.add_child(highlight)

		var tween = create_tween()
		tween.set_loops()
		tween.tween_property(highlight, "modulate", Color(1.0, 1.0, 0.0, 0.1), 0.5)
		tween.tween_property(highlight, "modulate", Color(1.0, 1.0, 0.0, 0.5), 0.5)

func clear_highlights() -> void:
	if highlight_node:
		var highlights = highlight_node.find_children("TutorialHighlight", "*", true, false)
		for h in highlights:
			h.queue_free()

func next_step() -> void:
	if not is_active:
		return

	clear_highlights()

	if current_step:
		current_step.is_completed = true
		tutorial_step_completed.emit(current_step_index)

	current_step_index += 1

	if current_step_index >= current_level.tutorial_steps.size():
		complete_tutorial()
	else:
		_show_current_step()

func complete_tutorial() -> void:
	is_active = false
	has_completed_tutorial = true
	clear_highlights()

	if instruction_label:
		instruction_label.visible = false

	save_tutorial_state()
	tutorial_completed.emit()

func skip_tutorial() -> void:
	is_active = false
	clear_highlights()

	if instruction_label:
		instruction_label.visible = false

	tutorial_skipped.emit()

func is_step_target(p_target_name: String) -> bool:
	if not is_active or not current_step:
		return false
	return current_step.target_element == p_target_name

func check_step_completion(p_action: String, p_data: Dictionary = {}) -> bool:
	if not is_active or not current_step:
		return false

	var should_advance = false

	match current_step.target_element:
		"work_order_card":
			if p_action == "select_order":
				should_advance = true
		"parts_inventory":
			if p_action == "view_parts":
				should_advance = true
		"quote_builder":
			if p_action == "create_quote":
				should_advance = true
		"confirm_button":
			if p_action == "confirm":
				should_advance = true
		"schedule_button":
			if p_action == "schedule":
				should_advance = true

	if should_advance:
		next_step()

	return should_advance

func get_hint() -> String:
	if current_step:
		return current_step.hint
	return ""

func get_progress() -> float:
	if not current_level or current_level.tutorial_steps.size() == 0:
		return 1.0
	return float(current_step_index) / float(current_level.tutorial_steps.size())

func save_tutorial_state() -> void:
	var config = ConfigFile.new()
	config.set_value("Tutorial", "has_completed", has_completed_tutorial)
	config.save("user://tutorial.cfg")

func load_tutorial_state() -> void:
	var config = ConfigFile.new()
	var error = config.load("user://tutorial.cfg")
	if error == OK:
		has_completed_tutorial = config.get_value("Tutorial", "has_completed", false)

func reset_tutorial_state() -> void:
	has_completed_tutorial = false
	save_tutorial_state()

func get_current_step_index() -> int:
	return current_step_index

func get_total_steps() -> int:
	if current_level:
		return current_level.tutorial_steps.size()
	return 0
