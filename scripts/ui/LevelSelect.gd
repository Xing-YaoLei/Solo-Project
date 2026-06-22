extends "res://scripts/ui/BaseUI.gd"

var mode: String = "formal"

func _ready() -> void:
	super._ready()
	mode = GameManager.current_mode
	_build_level_select()

func _build_level_select() -> void:
	var center_x = get_viewport_rect().size.x / 2
	var title_text = "📋 正式训练 - 选择关卡" if mode == "formal" else "🎯 自由练习 - 选择关卡"
	var desc_text = "有时间限制，成绩计入正式记录" if mode == "formal" else "无时间限制，可使用提示，不计入正式成绩"
	var title_color = Color(0.3, 0.6, 1.0, 1) if mode == "formal" else Color(0.3, 0.8, 0.5, 1)

	var title = create_label(title_text, Vector2(0, 50), 30, title_color)
	title.size = Vector2(get_viewport_rect().size.x, 50)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(title)

	var subtitle = create_label(desc_text, Vector2(0, 100), 16, STYLE_TEXT_SECONDARY)
	subtitle.size = Vector2(get_viewport_rect().size.x, 30)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	add_child(subtitle)

	var levels = DataManager.get_available_levels(mode)
	if levels.is_empty():
		var empty_label = create_label("暂无可选关卡，请在配置管理中启用关卡", Vector2(0, 250), 18, STYLE_WARNING)
		empty_label.size = Vector2(get_viewport_rect().size.x, 40)
		empty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		add_child(empty_label)
	else:
		var start_y = 180
		var card_width = 360
		var card_height = 180
		var spacing = 40
		var total_width = levels.size() * card_width + (levels.size() - 1) * spacing
		var start_x = center_x - total_width / 2
		for i in range(levels.size()):
			var level = levels[i]
			var card_pos = Vector2(start_x + i * (card_width + spacing), start_y)
			_build_level_card(level, card_pos, Vector2(card_width, card_height))

	var back_btn = create_button("← 返回主菜单", Vector2(60, get_viewport_rect().size.y - 80), Vector2(180, 44), Color(0.4, 0.45, 0.55, 1))
	back_btn.pressed.connect(_on_back_pressed)
	add_child(back_btn)

func _build_level_card(level: Dictionary, position: Vector2, size: Vector2) -> void:
	var panel = create_panel(position, size, STYLE_CARD_BG)
	add_child(panel)

	var vbox = VBoxContainer.new()
	vbox.anchor_right = 1.0
	vbox.anchor_bottom = 1.0
	vbox.add_theme_constant_override("separation", 10)
	panel.add_child(vbox)

	var difficulty_stars = "★" * level.get("difficulty", 1) + "☆" * (3 - level.get("difficulty", 1))
	var diff_color = STYLE_SUCCESS if level.get("difficulty", 1) == 1 else (STYLE_WARNING if level.get("difficulty", 1) == 2 else STYLE_DANGER)
	var diff_label = create_label(difficulty_stars, Vector2.ZERO, 18, diff_color)
	vbox.add_child(diff_label)

	var name_label = create_label(level.get("name", ""), Vector2.ZERO, 22, STYLE_TEXT_PRIMARY)
	vbox.add_child(name_label)

	var desc_label = create_label(level.get("description", ""), Vector2.ZERO, 14, STYLE_TEXT_SECONDARY)
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_label.custom_minimum_size = Vector2(size.x - 40, 0)
	vbox.add_child(desc_label)

	var info_text = ""
	var game_types = level.get("game_types", [])
	var type_names = []
	for gt in game_types:
		type_names.append(_get_game_type_name(gt))
	info_text += "类型：%s" % "、".join(type_names)
	if mode == "formal" and level.has("time_limit"):
		info_text += " | 限时：%s" % format_time(level["time_limit"])
	info_text += " | 题数：%d" % level.get("question_count", 0)
	var info_label = create_label(info_text, Vector2.ZERO, 13, Color(0.55, 0.6, 0.68, 1))
	vbox.add_child(info_label)

	var records = TrainingRecordManager.get_records_by_level(level.get("id", ""))
	if not records.is_empty():
		var best = records[0]
		for rec in records:
			if rec.get("accuracy", 0) > best.get("accuracy", 0):
				best = rec
		var best_text = "最佳成绩：%.0f%%" % (best.get("accuracy", 0) * 100)
		var best_label = create_label(best_text, Vector2.ZERO, 13, STYLE_ACCENT)
		vbox.add_child(best_label)

	var start_btn_color = Color(0.2, 0.55, 0.9, 1) if mode == "formal" else Color(0.2, 0.65, 0.4, 1)
	var start_btn = create_button("开始训练", Vector2.ZERO, Vector2(size.x - 40, 44), start_btn_color)
	start_btn.add_theme_font_size_override("font_size", 16)
	start_btn.pressed.connect(func(): _on_start_level(level))
	vbox.add_child(start_btn)

func _get_game_type_name(game_type: String) -> String:
	match game_type:
		"evidence_identification": return "证据识别"
		"template_selection": return "模板选择"
		"checklist_sorting": return "清单排序"
		"sampling_processing": return "抽样处理"
		_: return game_type

func _on_start_level(level: Dictionary) -> void:
	GameManager.start_game(mode, level)
	var game_types = level.get("game_types", [])
	if not game_types.is_empty():
		var first_game = game_types[0]
		GameManager.current_level["_game_types_queue"] = game_types.duplicate()
		GameManager.current_level["_current_game_index"] = 0
		GameManager.change_scene(first_game)

func _on_back_pressed() -> void:
	GameManager.change_scene("main_menu")
