extends Control

@onready var start_button: Button = $VBoxContainer/StartButton
@onready var continue_button: Button = $VBoxContainer/ContinueButton
@onready var leaderboard_button: Button = $VBoxContainer/LeaderboardButton
@onready var settings_button: Button = $VBoxContainer/SettingsButton
@onready var quit_button: Button = $VBoxContainer/QuitButton
@onready var title_label: Label = $VBoxContainer/TitleLabel
@onready var subtitle_label: Label = $VBoxContainer/SubtitleLabel

signal start_game
signal continue_game
signal show_leaderboard

func _ready():
	start_button.pressed.connect(_on_start_pressed)
	continue_button.pressed.connect(_on_continue_pressed)
	leaderboard_button.pressed.connect(_on_leaderboard_pressed)
	quit_button.pressed.connect(_on_quit_pressed)
	title_label.text = "文书归档调度解谜"
	subtitle_label.text = "法律服务文书归档训练系统"
	var has_save := false
	var slots := SaveManager.list_save_slots()
	if slots.size() > 0:
		has_save = true
	continue_button.disabled = not has_save
	if OS.has_feature("web"):
		quit_button.visible = false

func _on_start_pressed():
	start_game.emit()
	get_tree().change_scene_to_file("res://scenes/level_select.tscn")

func _on_continue_pressed():
	continue_game.emit()
	get_tree().change_scene_to_file("res://scenes/level_select.tscn")

func _on_leaderboard_pressed():
	show_leaderboard.emit()
	get_tree().change_scene_to_file("res://scenes/leaderboard.tscn")

func _on_quit_pressed():
	get_tree().quit()
