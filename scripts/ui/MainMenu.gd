extends "res://scripts/ui/BaseUI.gd"

func _ready() -> void:
	_setup_background()
	_build_menu()

func _build_menu() -> void:
	var center_x = get_viewport_rect().size.x / 2
	var center_y = get_viewport_rect().size.y / 2

	var title = create_label("合规审计证据归档训练系统", Vector2(0, 80), 38, STYLE_TEXT_PRIMARY)
	title.size = Vector2(get_viewport_rect().size.x, 60)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(title)

	var subtitle = create_label("Compliance Audit Evidence Archiving Training", Vector2(0, 140), 18, STYLE_TEXT_SECONDARY)
	subtitle.size = Vector2(get_viewport_rect().size.x, 30)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(subtitle)

	var role_label = create_label("当前角色：" + PermissionManager.get_role_name(), Vector2(center_x - 200, 200), 15, STYLE_TEXT_SECONDARY)
	role_label.size = Vector2(400, 25)
	role_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(role_label)

	var formal_btn = create_button("📋 正式训练", Vector2(center_x - 110, center_y - 100), Vector2(220, 56), Color(0.2, 0.5, 0.85, 1))
	formal_btn.add_theme_font_size_override("font_size", 20)
	formal_btn.pressed.connect(_on_formal_training_pressed)
	add_child(formal_btn)

	var formal_desc = create_label("有时间限制，成绩计入正式训练记录", Vector2(center_x - 200, center_y - 35), 14, STYLE_TEXT_SECONDARY)
	formal_desc.size = Vector2(400, 25)
	formal_desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(formal_desc)

	var practice_btn = create_button("🎯 自由练习", Vector2(center_x - 110, center_y + 10), Vector2(220, 56), Color(0.2, 0.65, 0.4, 1))
	practice_btn.add_theme_font_size_override("font_size", 20)
	practice_btn.pressed.connect(_on_free_practice_pressed)
	add_child(practice_btn)

	var practice_desc = create_label("无时间限制，可使用提示，不计入正式成绩", Vector2(center_x - 200, center_y + 75), 14, STYLE_TEXT_SECONDARY)
	practice_desc.size = Vector2(400, 25)
	practice_desc.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(practice_desc)

	var review_btn = create_button("📊 训练记录与复盘", Vector2(center_x - 200, center_y + 130), Vector2(190, 48), Color(0.45, 0.35, 0.75, 1))
	review_btn.add_theme_font_size_override("font_size", 16)
	review_btn.pressed.connect(_on_review_pressed)
	add_child(review_btn)

	var config_btn = create_button("⚙️ 配置管理", Vector2(center_x + 10, center_y + 130), Vector2(190, 48), Color(0.75, 0.55, 0.2, 1))
	config_btn.add_theme_font_size_override("font_size", 16)
	config_btn.pressed.connect(_on_config_pressed)
	add_child(config_btn)

	var stats = TrainingRecordManager.get_statistics_summary()
	var stats_text = "已完成训练：%d 次 | 正式训练：%d 次 | 平均正确率：%.1f%%" % [
		stats["total_training_count"],
		stats["formal_training_count"],
		stats["average_accuracy"] * 100
	]
	var stats_label = create_label(stats_text, Vector2(0, get_viewport_rect().size.y - 60), 14, STYLE_TEXT_SECONDARY)
	stats_label.size = Vector2(get_viewport_rect().size.x, 30)
	stats_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(stats_label)

	var version_label = create_label("v1.0.0 | Godot 4 | Web Export Ready", Vector2(0, get_viewport_rect().size.y - 35), 12, Color(0.45, 0.5, 0.58, 1))
	version_label.size = Vector2(get_viewport_rect().size.x, 25)
	version_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(version_label)

func _on_formal_training_pressed() -> void:
	GameManager.current_mode = "formal"
	GameManager.change_scene("formal_training")

func _on_free_practice_pressed() -> void:
	GameManager.current_mode = "practice"
	GameManager.change_scene("free_practice")

func _on_review_pressed() -> void:
	var perm_check = PermissionManager.check_permission("record_review")
	if not perm_check["granted"]:
		show_permission_error(perm_check["reason"])
		return
	GameManager.change_scene("result_review")

func _on_config_pressed() -> void:
	var perm_check = PermissionManager.check_permission("config_management")
	if not perm_check["granted"]:
		show_permission_error(perm_check["reason"])
		return
	GameManager.change_scene("config_management")
