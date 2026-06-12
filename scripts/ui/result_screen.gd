extends Control

@onready var back_btn: Button = $Background/TopBar/BackBtn
@onready var title_label: Label = $Background/VBoxContainer/TitleLabel
@onready var result_label: Label = $Background/VBoxContainer/ResultLabel
@onready var score_label: Label = $Background/VBoxContainer/ScoreLabel
@onready var accuracy_label: Label = $Background/VBoxContainer/AccuracyLabel
@onready var details_label: Label = $Background/VBoxContainer/DetailsLabel
@onready var rewards_container: HBoxContainer = $Background/VBoxContainer/RewardsContainer
@onready var rewards_label: Label = $Background/VBoxContainer/RewardsLabel
@onready var retry_btn: Button = $Background/VBoxContainer/ButtonContainer/RetryBtn
@onready var next_level_btn: Button = $Background/VBoxContainer/ButtonContainer/NextLevelBtn
@onready var records_btn: Button = $Background/VBoxContainer/ButtonContainer/RecordsBtn
@onready var menu_btn: Button = $Background/VBoxContainer/ButtonContainer/MenuBtn

var earned_rewards: Array = []

func _ready() -> void:
	setup_connections()
	display_results()
	check_rewards()

func setup_connections() -> void:
	back_btn.pressed.connect(_on_back_pressed)
	retry_btn.pressed.connect(_on_retry_pressed)
	next_level_btn.pressed.connect(_on_next_level_pressed)
	records_btn.pressed.connect(_on_records_pressed)
	menu_btn.pressed.connect(_on_menu_pressed)

func display_results() -> void:
	var level: Dictionary = DataManager.get_level(GameManager.current_level_id)
	var level_name: String = level.get("name", "未知关卡")
	title_label.text = "🎯 训练完成 - " + level_name
	
	var score: int = GameManager.current_score
	var accuracy: float = GameManager.current_accuracy
	var total: int = GameManager.total_questions
	var correct: int = GameManager.correct_questions
	var pass_score: int = level.get("pass_score", 60)
	
	score_label.text = "🏆 得分：%d 分" % score
	accuracy_label.text = "📊 正确率：%.1f%%  (%d/%d)" % [accuracy, correct, total]
	
	if score >= pass_score:
		result_label.text = "✅ 恭喜通过！"
		result_label.modulate = Color(0.2, 0.7, 0.3, 1)
	else:
		result_label.text = "❌ 未通过，继续加油！"
		result_label.modulate = Color(0.8, 0.3, 0.2, 1)
	
	var mode_text: String = "训练模式" if GameManager.current_game_mode == GameManager.GameMode.TRAINING else "自由练习"
	details_label.text = "模式：%s  |  通过分数：%d分" % [mode_text, pass_score]
	
	var next_level: Dictionary = get_next_level()
	next_level_btn.disabled = next_level.is_empty() or score < pass_score

func get_next_level() -> Dictionary:
	var levels: Array = DataManager.get_levels()
	for i in range(levels.size()):
		if levels[i]["id"] == GameManager.current_level_id and i + 1 < levels.size():
			return levels[i + 1]
	return {}

func check_rewards() -> void:
	earned_rewards.clear()
	for child in rewards_container.get_children():
		child.queue_free()
	
	var rewards: Array = DataManager.get_rewards()
	var accuracy: float = GameManager.current_accuracy
	var level: Dictionary = DataManager.get_level(GameManager.current_level_id)
	var time_limit: int = level.get("time_limit", 300)
	
	for reward in rewards:
		var condition: String = reward.get("condition", "")
		var earned: bool = false
		
		if condition == "accuracy >= 60" and accuracy >= 60:
			earned = true
		elif condition == "accuracy >= 80" and accuracy >= 80:
			earned = true
		elif condition == "accuracy >= 95" and accuracy >= 95:
			earned = true
		
		if earned:
			earned_rewards.append(reward)
			var reward_label: Label = Label.new()
			reward_label.text = reward.get("icon", "") + " " + reward.get("name", "")
			reward_label.theme_override_font_sizes.font_size = 16
			reward_label.modulate = Color(0.9, 0.7, 0.2, 1)
			rewards_container.add_child(reward_label)
	
	if earned_rewards.is_empty():
		rewards_label.visible = false
		rewards_container.visible = false
	else:
		rewards_label.visible = true
		rewards_container.visible = true

func _on_back_pressed() -> void:
	AudioManager.play_click()
	GameManager.change_scene("LevelSelect")

func _on_retry_pressed() -> void:
	AudioManager.play_click()
	GameManager.start_game(GameManager.current_level_id, GameManager.current_game_mode)

func _on_next_level_pressed() -> void:
	AudioManager.play_click()
	var next_level: Dictionary = get_next_level()
	if not next_level.is_empty():
		GameManager.start_game(next_level["id"], GameManager.current_game_mode)

func _on_records_pressed() -> void:
	AudioManager.play_click()
	GameManager.change_scene("Records")

func _on_menu_pressed() -> void:
	AudioManager.play_click()
	GameManager.change_scene("Main")
