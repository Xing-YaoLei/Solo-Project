extends Control

@onready var level_name: Label = $CenterContainer/ReviewVBox/LevelName
@onready var score_value: Label = $CenterContainer/ReviewVBox/ScorePanel/ScoreVBox/ScoreValue
@onready var sat_value: Label = $CenterContainer/ReviewVBox/ScorePanel/ScoreVBox/SatisfactionBar/SatValue

@onready var current_score: Label = $CenterContainer/ReviewVBox/ComparePanel/CompareVBox/CompareGrid/CurrentScore
@onready var best_score: Label = $CenterContainer/ReviewVBox/ComparePanel/CompareVBox/CompareGrid/BestScore
@onready var current_sat: Label = $CenterContainer/ReviewVBox/ComparePanel/CompareVBox/CompareGrid/CurrentSat
@onready var best_sat: Label = $CenterContainer/ReviewVBox/ComparePanel/CompareVBox/CompareGrid/BestSat
@onready var current_combo: Label = $CenterContainer/ReviewVBox/ComparePanel/CompareVBox/CompareGrid/CurrentCombo
@onready var best_combo: Label = $CenterContainer/ReviewVBox/ComparePanel/CompareVBox/CompareGrid/BestCombo

@onready var correct_value: Label = $CenterContainer/ReviewVBox/StatsPanel/StatsGrid/CorrectValue
@onready var wrong_value: Label = $CenterContainer/ReviewVBox/StatsPanel/StatsGrid/WrongValue
@onready var accuracy_value: Label = $CenterContainer/ReviewVBox/StatsPanel/StatsGrid/AccuracyValue
@onready var time_value: Label = $CenterContainer/ReviewVBox/StatsPanel/StatsGrid/TimeValue

func _ready() -> void:
	var level = GameManager.current_level
	if not level.is_empty():
		level_name.text = level.name
	
	var stats = StatsManager.get_level_stats(level.id)
	
	score_value.text = str(GameManager.score)
	sat_value.text = "%d%%" % _get_current_satisfaction()
	
	current_score.text = str(GameManager.score)
	current_sat.text = "%d%%" % _get_current_satisfaction()
	current_combo.text = str(GameManager.max_combo)
	
	if not stats.is_empty():
		best_score.text = str(stats.best_score)
		best_sat.text = "%d%%" % stats.best_satisfaction
		best_combo.text = str(stats.best_combo)
	else:
		best_score.text = "-"
		best_sat.text = "-"
		best_combo.text = "-"
	
	correct_value.text = str(GameManager.correct_count)
	wrong_value.text = str(GameManager.wrong_count)
	var accuracy = 0.0
	var total = GameManager.correct_count + GameManager.wrong_count
	if total > 0:
		accuracy = float(GameManager.correct_count) / float(total)
	accuracy_value.text = "%d%%" % int(accuracy * 100)
	
	var time_used = level.time_limit - GameManager.time_remaining
	time_value.text = "%d秒" % int(time_used)

func _get_current_satisfaction() -> int:
	var level = GameManager.current_level
	if level.is_empty():
		return 0
	
	var total = GameManager.correct_count + GameManager.wrong_count
	var accuracy = 0.0
	if total > 0:
		accuracy = float(GameManager.correct_count) / float(total)
	
	var completed = GameManager.current_task_index >= GameManager.tasks.size()
	var satisfaction = 0
	if not completed:
		satisfaction = int(accuracy * 40)
		return satisfaction
	
	satisfaction = 30
	satisfaction += int(accuracy * 30)
	satisfaction += min(20, int(GameManager.score / 500))
	satisfaction += min(20, GameManager.max_combo * 2)
	
	return min(100, satisfaction)

func _on_back_pressed() -> void:
	AudioManager.play_click_sfx()
	get_tree().change_scene_to_file("res://scenes/game.tscn")

func _on_retry_pressed() -> void:
	AudioManager.play_click_sfx()
	GameManager.restart_level()
	get_tree().change_scene_to_file("res://scenes/game.tscn")

func _on_menu_pressed() -> void:
	AudioManager.play_click_sfx()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
