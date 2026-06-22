extends Control

@onready var back_button: Button = $TopBar/BackButton
@onready var replay_list: ItemList = $MainLayout/LeftPanel/ReplayList
@onready var action_timeline: VBoxContainer = $MainLayout/RightPanel/ActionScroll/ActionTimeline
@onready var stuck_markers: VBoxContainer = $MainLayout/RightPanel/StuckSection/StuckMarkers
@onready var replay_detail_label: RichTextLabel = $MainLayout/RightPanel/DetailPanel/ReplayDetailLabel
@onready var jump_to_stuck_button: Button = $MainLayout/RightPanel/StuckSection/JumpToStuckButton
@onready var prev_action_button: Button = $MainLayout/RightPanel/NavSection/PrevActionButton
@onready var next_action_button: Button = $MainLayout/RightPanel/NavSection/NextActionButton
@onready var action_counter_label: Label = $MainLayout/RightPanel/NavSection/ActionCounterLabel

var _level_id: String = ""
var _preserved_replays: Array = []
var _selected_replay_index: int = -1
var _current_action_index: int = 0
var _current_actions: Array = []
var _current_stuck_points: Array = []

func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)
	replay_list.item_selected.connect(_on_replay_selected)
	jump_to_stuck_button.pressed.connect(_on_jump_to_stuck)
	prev_action_button.pressed.connect(_on_prev_action)
	next_action_button.pressed.connect(_on_next_action)
	_level_id = GameManager.get_meta("review_level_id") if GameManager.has_meta("review_level_id") else ""
	_load_replays()

func _load_replays() -> void:
	replay_list.clear()
	if _level_id == "":
		return
	var all_levels: Dictionary = LevelManager.get_all_levels()
	var level_data: Dictionary = all_levels.get(_level_id, {})
	var tasks: Array = level_data.get("tasks", [])
	for task in tasks:
		var task_id: String = task.get("task_id", "")
		var replays: Array = ReplayManager.get_preserved_replays(task_id)
		for replay_entry in replays:
			_preserved_replays.append(replay_entry)
			var replay_id: String = replay_entry.get("replay_id", "未知")
			replay_list.add_item(replay_id)
	if _preserved_replays.is_empty():
		for task in tasks:
			var task_id: String = task.get("task_id", "")
			var saved: Array = SaveManager.load_replay_records(task_id)
			for record in saved:
				_preserved_replays.append({
					"replay_id": "saved_%s_%d" % [task_id, Time.get_ticks_msec()],
					"task_id": task_id,
					"recording": record,
				})
				replay_list.add_item("回放: %s" % task_id)

func _on_replay_selected(index: int) -> void:
	_selected_replay_index = index
	if index < 0 or index >= _preserved_replays.size():
		return
	var replay: Dictionary = _preserved_replays[index]
	var recording: Dictionary = replay.get("recording", {})
	_current_actions = recording.get("actions", [])
	_current_stuck_points = recording.get("stuck_points", [])
	_current_action_index = 0
	_refresh_timeline()
	_refresh_stuck_markers()
	_update_detail()

func _refresh_timeline() -> void:
	for child in action_timeline.get_children():
		child.queue_free()
	if _current_actions.is_empty():
		var label := Label.new()
		label.text = "无操作记录"
		label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.7, 1))
		action_timeline.add_child(label)
		return
	for i in range(_current_actions.size()):
		var action: Dictionary = _current_actions[i]
		var label := Label.new()
		var action_type: String = action.get("action_type", "")
		var elapsed: float = action.get("elapsed", 0.0)
		var is_stuck: bool = false
		for sp in _current_stuck_points:
			var sp_elapsed: float = sp.get("elapsed", -1.0)
			if abs(sp_elapsed - elapsed) < 2.0:
				is_stuck = true
				break
		if is_stuck:
			label.text = "🔴 [%.1fs] %s" % [elapsed, action_type]
			label.add_theme_color_override("font_color", Color(1.0, 0.4, 0.4))
		else:
			label.text = "[%.1fs] %s" % [elapsed, action_type]
			label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.8, 1))
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		label.custom_minimum_size.x = 280
		action_timeline.add_child(label)

func _refresh_stuck_markers() -> void:
	for child in stuck_markers.get_children():
		child.queue_free()
	if _current_stuck_points.is_empty():
		var label := Label.new()
		label.text = "无卡顿记录"
		label.add_theme_color_override("font_color", Color(0.3, 0.9, 0.3))
		stuck_markers.add_child(label)
		jump_to_stuck_button.disabled = true
		return
	jump_to_stuck_button.disabled = false
	for sp in _current_stuck_points:
		var label := Label.new()
		var desc: String = sp.get("description", "未知")
		var elapsed: float = sp.get("elapsed", 0.0)
		label.text = "📍 %.1fs - %s" % [elapsed, desc]
		label.add_theme_color_override("font_color", Color(1.0, 0.5, 0.5))
		label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		label.custom_minimum_size.x = 280
		stuck_markers.add_child(label)

func _update_detail() -> void:
	if _current_actions.is_empty():
		replay_detail_label.text = "选择一个回放查看详情"
		action_counter_label.text = "0/0"
		return
	if _current_action_index < 0 or _current_action_index >= _current_actions.size():
		return
	var action: Dictionary = _current_actions[_current_action_index]
	var detail: String = ""
	detail += "操作类型: %s\n" % action.get("action_type", "")
	detail += "经过时间: %.1f秒\n" % action.get("elapsed", 0.0)
	var action_data: Dictionary = action.get("action_data", {})
	if not action_data.is_empty():
		for key in action_data:
			detail += "%s: %s\n" % [key, str(action_data[key])]
	replay_detail_label.text = detail
	action_counter_label.text = "%d/%d" % [_current_action_index + 1, _current_actions.size()]
	prev_action_button.disabled = _current_action_index <= 0
	next_action_button.disabled = _current_action_index >= _current_actions.size() - 1

func _on_jump_to_stuck() -> void:
	if _current_stuck_points.is_empty():
		return
	var first_stuck: Dictionary = _current_stuck_points[0]
	var stuck_elapsed: float = first_stuck.get("elapsed", 0.0)
	var closest_index: int = 0
	var closest_diff: float = 999999.0
	for i in range(_current_actions.size()):
		var elapsed: float = _current_actions[i].get("elapsed", 0.0)
		var diff: float = abs(elapsed - stuck_elapsed)
		if diff < closest_diff:
			closest_diff = diff
			closest_index = i
	_current_action_index = closest_index
	_update_detail()

func _on_prev_action() -> void:
	if _current_action_index > 0:
		_current_action_index -= 1
		_update_detail()

func _on_next_action() -> void:
	if _current_action_index < _current_actions.size() - 1:
		_current_action_index += 1
		_update_detail()

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/result.tscn")
