extends Node
class_name SceneManager

signal scene_changed(scene_name: String)

var current_scene: String = ""
var scene_transition: CanvasLayer = null

func _ready():
	_create_transition_layer()

func _create_transition_layer():
	scene_transition = CanvasLayer.new()
	scene_transition.name = "SceneTransition"
	scene_transition.z_index = 1000
	
	var color_rect: ColorRect = ColorRect.new()
	color_rect.name = "TransitionRect"
	color_rect.color = Color(0, 0, 0, 0)
	color_rect.anchor_right = 1
	color_rect.anchor_bottom = 1
	scene_transition.add_child(color_rect)
	
	add_child(scene_transition)

func switch_to_scene(scene_path: String, with_transition: bool = true):
	if with_transition:
		_play_transition(scene_path)
	else:
		_load_scene(scene_path)

func _play_transition(scene_path: String):
	var rect: ColorRect = scene_transition.get_node("TransitionRect")
	var tween: Tween = create_tween()
	tween.tween_property(rect, "color", Color(0, 0, 0, 1), 0.3)
	tween.tween_callback(_load_scene.bind(scene_path))
	tween.tween_property(rect, "color", Color(0, 0, 0, 0), 0.3)
	tween.chain()

func _load_scene(scene_path: String):
	var packed_scene: PackedScene = load(scene_path)
	if packed_scene:
		get_tree().change_scene_to_packed(packed_scene)
		current_scene = scene_path
		emit_signal("scene_changed", scene_path)
	else:
		push_error("无法加载场景: " + scene_path)

func reload_current_scene():
	if current_scene:
		switch_to_scene(current_scene)

func go_to_main_menu():
	switch_to_scene("res://scenes/MainMenu.tscn")

func go_to_level_select():
	switch_to_scene("res://scenes/LevelSelect.tscn")

func go_to_game_level(level_id: String):
	if Globals:
		Globals.pending_level_id = level_id
	switch_to_scene("res://scenes/GameLevel.tscn")

func go_to_review(replay_data: Dictionary):
	if Globals:
		Globals.pending_replay_data = replay_data.duplicate(true)
	switch_to_scene("res://scenes/ReviewScene.tscn")

func go_to_statistics():
	switch_to_scene("res://scenes/StatisticsScene.tscn")

func quit_game():
	get_tree().quit()
