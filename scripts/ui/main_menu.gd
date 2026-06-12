extends Control

@onready var title_label: Label = $Background/VBoxContainer/TitleLabel
@onready var subtitle_label: Label = $Background/VBoxContainer/SubtitleLabel
@onready var mode_label: Label = $Background/VBoxContainer/ModeLabel
@onready var start_training_btn: Button = $Background/VBoxContainer/ButtonContainer/StartTrainingBtn
@onready var free_practice_btn: Button = $Background/VBoxContainer/ButtonContainer/FreePracticeBtn
@onready var level_select_btn: Button = $Background/VBoxContainer/ButtonContainer/LevelSelectBtn
@onready var config_btn: Button = $Background/VBoxContainer/ButtonContainer/ConfigBtn
@onready var records_btn: Button = $Background/VBoxContainer/ButtonContainer/RecordsBtn
@onready var exit_btn: Button = $Background/VBoxContainer/ButtonContainer/ExitBtn
@onready var time_label: Label = $Background/TopBar/TimeLabel
@onready var status_label: Label = $Background/TopBar/StatusLabel

var status_check_timer: Timer = Timer.new()
var time_update_timer: Timer = Timer.new()

func _ready() -> void:
	setup_timers()
	setup_connections()
	update_status()
	update_time_display()

func setup_timers() -> void:
	add_child(status_check_timer)
	status_check_timer.wait_time = 60.0
	status_check_timer.timeout.connect(_on_status_check)
	status_check_timer.start()
	
	add_child(time_update_timer)
	time_update_timer.wait_time = 1.0
	time_update_timer.timeout.connect(_on_time_update)
	time_update_timer.start()

func setup_connections() -> void:
	start_training_btn.pressed.connect(_on_start_training_pressed)
	free_practice_btn.pressed.connect(_on_free_practice_pressed)
	level_select_btn.pressed.connect(_on_level_select_pressed)
	config_btn.pressed.connect(_on_config_pressed)
	records_btn.pressed.connect(_on_records_pressed)
	exit_btn.pressed.connect(_on_exit_pressed)

func update_status() -> void:
	var is_open: bool = DataManager.is_within_open_time()
	if is_open:
		status_label.text = "● 训练系统开放中"
		status_label.modulate = Color(0.2, 0.7, 0.2, 1)
	else:
		status_label.text = "○ 非训练时间"
		status_label.modulate = Color(0.7, 0.2, 0.2, 1)
	
	for btn in [start_training_btn, free_practice_btn]:
		btn.disabled = not is_open

func update_time_display() -> void:
	time_label.text = Time.get_datetime_string_from_system(true, true)

func _on_start_training_pressed() -> void:
	AudioManager.play_click()
	GameManager.current_game_mode = GameManager.GameMode.TRAINING
	GameManager.change_scene("LevelSelect")

func _on_free_practice_pressed() -> void:
	AudioManager.play_click()
	GameManager.current_game_mode = GameManager.GameMode.FREE_PRACTICE
	GameManager.change_scene("LevelSelect")

func _on_level_select_pressed() -> void:
	AudioManager.play_click()
	GameManager.change_scene("LevelSelect")

func _on_config_pressed() -> void:
	AudioManager.play_click()
	GameManager.change_scene("Config")

func _on_records_pressed() -> void:
	AudioManager.play_click()
	GameManager.change_scene("Records")

func _on_exit_pressed() -> void:
	AudioManager.play_click()
	get_tree().quit()

func _on_time_update() -> void:
	update_time_display()

func _on_status_check() -> void:
	update_status()
