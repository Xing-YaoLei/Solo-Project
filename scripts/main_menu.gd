extends Control

func _on_btn_start_pressed() -> void:
	AudioManager.play_click_sfx()
	var levels = GameManager.get_levels()
	if levels.size() > 0:
		GameManager.start_game(levels[0].id)
		get_tree().change_scene_to_file("res://scenes/game.tscn")

func _on_btn_levels_pressed() -> void:
	AudioManager.play_click_sfx()
	get_tree().change_scene_to_file("res://scenes/level_select.tscn")

func _on_btn_stats_pressed() -> void:
	AudioManager.play_click_sfx()
	get_tree().change_scene_to_file("res://scenes/stats.tscn")

func _on_btn_settings_pressed() -> void:
	AudioManager.play_click_sfx()
	get_tree().change_scene_to_file("res://scenes/settings.tscn")
