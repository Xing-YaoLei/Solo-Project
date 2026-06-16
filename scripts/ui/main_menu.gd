extends Control

var scene_manager: SceneManager
var replay_manager: ReplayManager
var statistics_manager: StatisticsManager

@onready var start_button: Button = $VBoxContainer/StartButton
@onready var level_select_button: Button = $VBoxContainer/LevelSelectButton
@onready var statistics_button: Button = $VBoxContainer/StatisticsButton
@onready var review_button: Button = $VBoxContainer/ReviewButton
@onready var quit_button: Button = $VBoxContainer/QuitButton

func _ready():
	if Globals:
		scene_manager = Globals.scene_manager
		replay_manager = Globals.replay_manager
		statistics_manager = Globals.statistics_manager
	
	start_button.pressed.connect(_on_start_button_pressed)
	level_select_button.pressed.connect(_on_level_select_button_pressed)
	statistics_button.pressed.connect(_on_statistics_button_pressed)
	review_button.pressed.connect(_on_review_button_pressed)
	quit_button.pressed.connect(_on_quit_button_pressed)

func _on_start_button_pressed():
	if scene_manager:
		scene_manager.go_to_game_level("level_1")

func _on_level_select_button_pressed():
	if scene_manager:
		scene_manager.go_to_level_select()

func _on_statistics_button_pressed():
	if scene_manager:
		scene_manager.go_to_statistics()

func _on_review_button_pressed():
	if replay_manager:
		var recent_failures: Array = replay_manager.get_recent_failures(3)
		if recent_failures.size() > 0:
			if scene_manager:
				scene_manager.go_to_review(recent_failures[0])
		else:
			var recent_replays: Array = replay_manager.get_recent_replays(1)
			if recent_replays.size() > 0:
				if scene_manager:
					scene_manager.go_to_review(recent_replays[0])
			else:
				_show_message("暂无复盘记录，请先完成训练")

func _on_quit_button_pressed():
	if scene_manager:
		scene_manager.quit_game()

func _show_message(text: String):
	var dialog: AcceptDialog = AcceptDialog.new()
	dialog.dialog_text = text
	dialog.title = "提示"
	dialog.add_button("确定", true)
	add_child(dialog)
	dialog.popup_centered()
	dialog.confirmed.connect(dialog.queue_free)
	dialog.canceled.connect(dialog.queue_free)
