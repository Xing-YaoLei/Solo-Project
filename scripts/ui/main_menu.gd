extends Control

var selected_difficulty: String = "normal"

@onready var easy_button: Button = $DifficultyPanel/VBoxContainer/DifficultyButtons/EasyButton
@onready var normal_button: Button = $DifficultyPanel/VBoxContainer/DifficultyButtons/NormalButton
@onready var hard_button: Button = $DifficultyPanel/VBoxContainer/DifficultyButtons/HardButton
@onready var start_button: Button = $StartButton
@onready var replay_button: Button = $ReplayButton
@onready var help_button: Button = $HelpButton
@onready var help_panel: PanelContainer = $HelpPanel
@onready var high_score_label: Label = $HighScoreLabel

func _ready() -> void:
	_update_difficulty_buttons()
	_update_high_score()
	
	easy_button.pressed.connect(_on_easy_pressed)
	normal_button.pressed.connect(_on_normal_pressed)
	hard_button.pressed.connect(_on_hard_pressed)
	start_button.pressed.connect(_on_start_pressed)
	replay_button.pressed.connect(_on_replay_pressed)
	help_button.pressed.connect(_on_help_pressed)
	$HelpPanel/HelpContent/CloseHelpButton.pressed.connect(_on_close_help_pressed)

func _update_difficulty_buttons() -> void:
	easy_button.disabled = false
	normal_button.disabled = false
	hard_button.disabled = false
	
	match selected_difficulty:
		"easy":
			easy_button.disabled = true
		"normal":
			normal_button.disabled = true
		"hard":
			hard_button.disabled = true

func _update_high_score() -> void:
	var summary = Analytics.get_session_summary()
	high_score_label.text = "最高分: " + str(summary.get("high_score", 0))

func _on_easy_pressed() -> void:
	selected_difficulty = "easy"
	_update_difficulty_buttons()

func _on_normal_pressed() -> void:
	selected_difficulty = "normal"
	_update_difficulty_buttons()

func _on_hard_pressed() -> void:
	selected_difficulty = "hard"
	_update_difficulty_buttons()

func _on_start_pressed() -> void:
	GameState.start_game(selected_difficulty)
	get_tree().change_scene_to_file("res://scenes/game_main.tscn")

func _on_replay_pressed() -> void:
	if ReplayManager.get_replay_count() > 0:
		get_tree().change_scene_to_file("res://scenes/replay_view.tscn")
	else:
		help_panel.visible = true
		$HelpPanel/HelpContent/HelpTitle.text = "提示"
		$HelpPanel/HelpContent/HelpText.text = "暂无回防记录。\n\n完成一局游戏失败后会自动保存回放，\n最多保存3次失败记录。"

func _on_help_pressed() -> void:
	$HelpPanel/HelpContent/HelpTitle.text = "游戏说明"
	$HelpPanel/HelpContent/HelpText.text = "欢迎来到美业门店回访调度游戏！\n\n• 拖拽充值流水卡到顾客身上提升满意度\n• 及时处理顾客的项目卡项服务请求\n• 注意观察评价标签的变化\n• 管理耗材库存，应对突发异常\n• 在限时内完成所有项目卡项即可通关\n\n提示：连续成功服务顾客可以获得连击加分！"
	help_panel.visible = true

func _on_close_help_pressed() -> void:
	help_panel.visible = false
