extends Control

@onready var result_title: Label = $MainPanel/VBoxContainer/ResultTitle
@onready var result_status: Label = $MainPanel/VBoxContainer/ResultStatus
@onready var score_value: Label = $MainPanel/VBoxContainer/ScoreDisplay/ScorePanel/ScoreVBox/ScoreValue
@onready var combo_value: Label = $MainPanel/VBoxContainer/ScoreDisplay/ComboPanel/ComboVBox/ComboValue
@onready var time_value: Label = $MainPanel/VBoxContainer/StatsGrid/TimeValue
@onready var served_value: Label = $MainPanel/VBoxContainer/StatsGrid/ServedValue
@onready var completion_value: Label = $MainPanel/VBoxContainer/StatsGrid/CompletionValue
@onready var projects_value: Label = $MainPanel/VBoxContainer/StatsGrid/ProjectsValue
@onready var stuck_points_vbox: VBoxContainer = $MainPanel/VBoxContainer/StuckPointsContainer/StuckPointsVBox
@onready var achievements_container: HBoxContainer = $MainPanel/VBoxContainer/AchievementsContainer
@onready var replay_button: Button = $MainPanel/VBoxContainer/ButtonsHBox/ReplayButton
@onready var retry_button: Button = $MainPanel/VBoxContainer/ButtonsHBox/RetryButton
@onready var menu_button: Button = $MainPanel/VBoxContainer/ButtonsHBox/MenuButton

func _ready() -> void:
	_setup_signals()
	_populate_results()

func _setup_signals() -> void:
	replay_button.pressed.connect(_on_replay_pressed)
	retry_button.pressed.connect(_on_retry_pressed)
	menu_button.pressed.connect(_on_menu_pressed)

func _populate_results() -> void:
	var success = false
	var score = 0
	var max_combo = 0
	var elapsed_time = 0.0
	var customers_served = 0
	var customers_total = 0
	var projects_completed = 0
	var projects_failed = 0
	var completion_rate = 0.0
	var stuck_points = []
	var unlocked_achievements = []
	
	var events = Analytics.get_events_by_name("game_ended")
	if events.size() > 0:
		var last_event = events[events.size() - 1]
		var event_data = last_event.get("event_data", {})
		success = event_data.get("success", false)
		score = event_data.get("score", 0)
	else:
		success = GameState.score > 0
		score = GameState.score
	
	score = GameState.score
	max_combo = GameState.max_combo
	elapsed_time = GameState.elapsed_time
	customers_served = GameState.customers_served
	customers_total = GameState.customers_total
	projects_completed = GameState.projects_completed
	projects_failed = GameState.projects_failed
	
	if projects_completed + projects_failed > 0:
		completion_rate = float(projects_completed) / float(projects_completed + projects_failed)
	else:
		completion_rate = 0.0
	
	stuck_points = GameState.stuck_points
	unlocked_achievements = GameState.unlocked_achievements
	
	if success:
		result_status.text = "🎉 挑战成功！"
		result_status.modulate = Color(0.3, 0.7, 0.3, 1)
	else:
		result_status.text = "😔 挑战失败"
		result_status.modulate = Color(0.8, 0.4, 0.3, 1)
	
	score_value.text = str(score)
	combo_value.text = str(max_combo)
	
	var minutes = int(elapsed_time) / 60
	var seconds = int(elapsed_time) % 60
	time_value.text = "%02d:%02d" % [minutes, seconds]
	
	served_value.text = "%d / %d" % [customers_served, customers_total]
	completion_value.text = "%d%%" % int(completion_rate * 100)
	projects_value.text = str(projects_completed)
	
	_populate_stuck_points(stuck_points)
	_populate_achievements(unlocked_achievements)
	
	replay_button.disabled = ReplayManager.get_replay_count() == 0

func _populate_stuck_points(stuck_points: Array) -> void:
	for child in stuck_points_vbox.get_children():
		child.queue_free()
	
	if stuck_points.size() == 0:
		var label = Label.new()
		label.text = "表现流畅，无明显卡点 ✨"
		label.theme_override_colors.font_color = Color(0.4, 0.6, 0.4, 1)
		label.theme_override_font_sizes.font_size = 12
		stuck_points_vbox.add_child(label)
		return
	
	for i in range(min(stuck_points.size(), 5)):
		var point = stuck_points[i]
		var time_val = point.get("time", 0)
		var duration = point.get("duration", 0)
		var waiting = point.get("customers_waiting", 0)
		
		var label = Label.new()
		var minutes = int(time_val) / 60
		var seconds = int(time_val) % 60
		label.text = "  • %02d:%02d 停留%.1f秒，等待顾客%d位" % [minutes, seconds, duration, waiting]
		label.theme_override_colors.font_color = Color(0.6, 0.4, 0.3, 1)
		label.theme_override_font_sizes.font_size = 11
		stuck_points_vbox.add_child(label)

func _populate_achievements(unlocked: Array) -> void:
	for child in achievements_container.get_children():
		child.queue_free()
	
	if unlocked.size() == 0:
		var label = Label.new()
		label.text = "暂无解锁"
		label.theme_override_colors.font_color = Color(0.5, 0.5, 0.5, 1)
		label.theme_override_font_sizes.font_size = 12
		achievements_container.add_child(label)
		return
	
	for achievement_id in unlocked:
		var achievement = GameState.achievements.get(achievement_id, {})
		var name = achievement.get("name", achievement_id)
		
		var label = Label.new()
		label.text = "🏆 " + name
		label.theme_override_colors.font_color = Color(0.8, 0.6, 0.2, 1)
		label.theme_override_font_sizes.font_size = 12
		achievements_container.add_child(label)

func _on_replay_pressed() -> void:
	if ReplayManager.get_replay_count() > 0:
		get_tree().change_scene_to_file("res://scenes/replay_view.tscn")

func _on_retry_pressed() -> void:
	GameState.start_game(GameState.current_difficulty)
	get_tree().change_scene_to_file("res://scenes/game_main.tscn")

func _on_menu_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
