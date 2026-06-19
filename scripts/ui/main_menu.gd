extends Control

@onready var free_play_button: Button = $MainContainer/ButtonContainer/FreePlayButton
@onready var training_button: Button = $MainContainer/ButtonContainer/TrainingButton
@onready var leaderboard_button: Button = $MainContainer/ButtonContainer/LeaderboardButton
@onready var settings_button: Button = $MainContainer/ButtonContainer/SettingsButton
@onready var quit_button: Button = $MainContainer/ButtonContainer/QuitButton
@onready var title_label: Label = $MainContainer/TitleLabel
@onready var subtitle_label: Label = $MainContainer/SubtitleLabel
@onready var player_info_label: Label = $MainContainer/PlayerInfoLabel

func _ready():
	_setup_connections()
	_update_player_info()

	if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.MEDIUM):
		_play_intro_animation()

func _setup_connections() -> void:
	free_play_button.pressed.connect(_on_free_play_pressed)
	training_button.pressed.connect(_on_training_pressed)
	leaderboard_button.pressed.connect(_on_leaderboard_pressed)
	settings_button.pressed.connect(_on_settings_pressed)
	quit_button.pressed.connect(_on_quit_pressed)

	free_play_button.mouse_entered.connect(func(): _on_button_hover(free_play_button))
	training_button.mouse_entered.connect(func(): _on_button_hover(training_button))
	leaderboard_button.mouse_entered.connect(func(): _on_button_hover(leaderboard_button))
	settings_button.mouse_entered.connect(func(): _on_button_hover(settings_button))
	quit_button.mouse_entered.connect(func(): _on_button_hover(quit_button))

func _update_player_info() -> void:
	if GameManager.player_data:
		var data = GameManager.player_data
		player_info_label.text = "等级 %d | 总分 %d | 胜率 %.1f%%" % [
			data.level,
			data.total_score,
			data.get_success_rate() * 100
		]

func _play_intro_animation() -> void:
	title_label.modulate.a = 0.0
	subtitle_label.modulate.a = 0.0
	player_info_label.modulate.a = 0.0

	var buttons = [free_play_button, training_button, leaderboard_button, settings_button, quit_button]
	for btn in buttons:
		btn.modulate.a = 0.0
		btn.position.x = -50

	var tween = create_tween()
	tween.set_parallel(true)
	tween.tween_property(title_label, "modulate:a", 1.0, 0.5)
	tween.tween_property(subtitle_label, "modulate:a", 1.0, 0.5)
	tween.tween_property(player_info_label, "modulate:a", 1.0, 0.5)

	await tween.finished

	for i in range(buttons.size()):
		var btn_tween = create_tween()
		btn_tween.set_parallel(true)
		btn_tween.tween_property(buttons[i], "modulate:a", 1.0, 0.3)
		btn_tween.tween_property(buttons[i], "position:x", 0.0, 0.3)
		await get_tree().create_timer(0.1).timeout

func _on_button_hover(p_button: Button) -> void:
	AudioManager.play_sfx(AudioManager.SFXType.BUTTON_HOVER)
	if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.LOW):
		var tween = create_tween()
		tween.tween_property(p_button, "scale", Vector2(1.05, 1.05), 0.1)
		tween.tween_property(p_button, "scale", Vector2(1.0, 1.0), 0.1)

func _on_free_play_pressed() -> void:
	AudioManager.play_click()
	GameManager.start_game(GameManager.GameMode.FREE_PLAY)
	GameManager.go_to_game()

func _on_training_pressed() -> void:
	AudioManager.play_click()
	GameManager.go_to_level_select()

func _on_leaderboard_pressed() -> void:
	AudioManager.play_click()
	GameManager.go_to_leaderboard()

func _on_settings_pressed() -> void:
	AudioManager.play_click()
	GameManager.go_to_settings()

func _on_quit_pressed() -> void:
	AudioManager.play_click()
	get_tree().quit()
