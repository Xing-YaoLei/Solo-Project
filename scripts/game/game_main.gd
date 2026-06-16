extends Control

var game_active: bool = false

@onready var timer_bar: ProgressBar = $VBoxContainer/TopHBox/TimerBox/VBox/TimerBar
@onready var timer_label: Label = $VBoxContainer/TopHBox/TimerBox/VBox/TimerHBox/TimerLabel
@onready var score_label: Label = $VBoxContainer/TopHBox/StatsBox/VBox/StatsHBox/ScoreLabel
@onready var progress_label: Label = $VBoxContainer/TopHBox/StatsBox/VBox/StatsHBox/ProgressLabel
@onready var combo_label: Label = $VBoxContainer/TopHBox/StatsBox/VBox/StatsHBox/ComboLabel
@onready var errors_label: Label = $VBoxContainer/TopHBox/StatsBox/VBox/StatsHBox/ErrorsLabel
@onready var level_name_label: Label = $VBoxContainer/TopHBox/StatsBox/VBox/LevelLabel
@onready var task_container: Control = $VBoxContainer/CenterContainer/TaskContainer
@onready var pause_btn: Button = $VBoxContainer/TopHBox/TimerBox/VBox/TimerHBox/PauseButton
@onready var restart_btn: Button = $VBoxContainer/TopHBox/TimerBox/VBox/TimerHBox/RestartButton
@onready var back_btn: Button = $VBoxContainer/TopHBox/TimerBox/VBox/TimerHBox/BackButton

var current_task_card: Control

func _ready() -> void:
	randomize()
	_setup_level()
	pause_btn.pressed.connect(_on_pause_pressed)
	restart_btn.pressed.connect(_on_restart_pressed)
	back_btn.pressed.connect(_on_back_pressed)

func _setup_level() -> void:
	game_active = true
	level_name_label.text = LevelManager.get_level_name(GameState.current_level_id)
	pause_btn.text = "⏸ 暂停"
	_refresh_stats()
	_spawn_next_task()

func _process(delta: float) -> void:
	if not game_active:
		return
	var time_up: bool = GameState.update_timer(delta)
	_refresh_stats()
	if time_up:
		_finish_game()
		return
	if GameState.is_level_complete():
		_finish_game()

func _refresh_stats() -> void:
	var time_pct: float = 0.0
	if GameState.total_time > 0.0:
		time_pct = GameState.time_remaining / GameState.total_time * 100.0
	timer_bar.value = time_pct
	var minutes: int = int(GameState.time_remaining / 60)
	var seconds: int = int(GameState.time_remaining % 60)
	timer_label.text = "%02d:%02d" % [minutes, seconds]
	if time_pct < 20.0:
		timer_label.add_theme_color_override("font_color", Color(0.85, 0.35, 0.35))
	elif time_pct < 40.0:
		timer_label.add_theme_color_override("font_color", Color(0.95, 0.55, 0.1))
	else:
		timer_label.add_theme_color_override("font_color", Color(0.15, 0.35, 0.75))
	score_label.text = "得分: %d" % GameState.score
	progress_label.text = "进度: %d/%d" % [GameState.tasks_completed, GameState.tasks_total]
	if GameState.combo >= 2:
		combo_label.text = "连击 x%d" % GameState.combo
		combo_label.modulate = Color(0.95, 0.55, 0.1)
	else:
		combo_label.text = "连击: --"
		combo_label.modulate = Color(0.5, 0.55, 0.65)
	errors_label.text = "错误: %d" % GameState.errors

func _spawn_next_task() -> void:
	for child in task_container.get_children():
		child.queue_free()
	var task_scene: PackedScene = load("res://scenes/game/task_card.tscn")
	current_task_card = task_scene.instantiate()
	task_container.add_child(current_task_card)
	var task_data: Dictionary = LevelManager.generate_random_task(GameState.current_level_id)
	current_task_card.setup(task_data)
	current_task_card.answered.connect(_on_task_answered)

func _on_task_answered() -> void:
	if not game_active:
		return
	if GameState.is_level_complete():
		_finish_game()
	else:
		_spawn_next_task()

func _finish_game() -> void:
	game_active = false
	AudioManager.play_sfx("complete")
	GameState.finalize_level()
	await get_tree().create_timer(0.3).timeout
	get_tree().change_scene_to_file("res://scenes/ui/result.tscn")

func _on_pause_pressed() -> void:
	AudioManager.play_sfx("tick")
	game_active = not game_active
	if game_active:
		pause_btn.text = "⏸ 暂停"
	else:
		pause_btn.text = "▶ 继续"

func _on_restart_pressed() -> void:
	AudioManager.play_sfx("tick")
	GameState.start_level(GameState.current_level_id, GameState.current_mode)
	_setup_level()

func _on_back_pressed() -> void:
	AudioManager.play_sfx("tick")
	game_active = false
	get_tree().change_scene_to_file("res://scenes/ui/level_select.tscn")
