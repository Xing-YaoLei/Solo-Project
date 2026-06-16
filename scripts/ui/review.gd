extends Control

@onready var back_btn: Button = $VBoxContainer/HeaderHBox/BackButton
@onready var list_vbox: VBoxContainer = $VBoxContainer/ScrollContainer/VBoxContainer
@onready var empty_label: Label = $VBoxContainer/EmptyLabel

func _ready() -> void:
	back_btn.pressed.connect(_on_back_pressed)
	_build_list()

func _build_list() -> void:
	for child in list_vbox.get_children():
		child.queue_free()
	var level_ids: Array = LevelManager.get_all_level_ids()
	var has_any: bool = false
	for level_id in level_ids:
		var best: Dictionary = GameState.get_best_result(level_id)
		if not best.is_empty():
			has_any = true
			_add_level_row(level_id, best)
	if not has_any:
		empty_label.visible = true
	else:
		empty_label.visible = false

func _add_level_row(level_id: String, result: Dictionary) -> void:
	var card := PanelContainer.new()
	var card_style := StyleBoxFlat.new()
	card_style.bg_color = Color(1, 1, 1)
	card_style.corner_radius_top_left = 10
	card_style.corner_radius_top_right = 10
	card_style.corner_radius_bottom_right = 10
	card_style.corner_radius_bottom_left = 10
	card_style.content_margin_left = 16
	card_style.content_margin_top = 12
	card_style.content_margin_right = 16
	card_style.content_margin_bottom = 12
	card_style.shadow_color = Color(0, 0, 0, 0.06)
	card_style.shadow_size = 4
	card_style.shadow_offset = Vector2(0, 2)
	card.add_theme_stylebox_override("panel", card_style)
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 16)
	card.add_child(hbox)
	var left_vbox := VBoxContainer.new()
	left_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	left_vbox.add_theme_constant_override("separation", 4)
	hbox.add_child(left_vbox)
	var level_data: Dictionary = LevelManager.get_level_data(level_id)
	var name_label := Label.new()
	name_label.text = level_data.get("name", level_id)
	name_label.add_theme_color_override("font_color", Color(0.15, 0.35, 0.75))
	name_label.add_theme_font_size_override("font_size", 18)
	left_vbox.add_child(name_label)
	var desc_label := Label.new()
	desc_label.text = level_data.get("description", "")
	desc_label.add_theme_color_override("font_color", Color(0.5, 0.55, 0.65))
	desc_label.add_theme_font_size_override("font_size", 12)
	left_vbox.add_child(desc_label)
	var diff_label := Label.new()
	diff_label.text = "难度: " + "★" * int(level_data.get("difficulty", 1))
	diff_label.add_theme_color_override("font_color", Color(0.95, 0.6, 0.1))
	diff_label.add_theme_font_size_override("font_size", 12)
	left_vbox.add_child(diff_label)
	var stats_hbox := HBoxContainer.new()
	stats_hbox.add_theme_constant_override("separation", 24)
	hbox.add_child(stats_hbox)
	_add_stat(stats_hbox, "总分", "%d" % int(result.get("total_score", 0)), Color(0.95, 0.55, 0.1), 20)
	_add_stat(stats_hbox, "准确率", "%.1f%%" % float(result.get("accuracy", 0.0)), Color(0.1, 0.7, 0.55), 16)
	_add_stat(stats_hbox, "连击", "%d" % int(result.get("max_combo", 0)), Color(0.15, 0.55, 0.95), 16)
	_add_stat(stats_hbox, "用时", "%.0fs" % float(result.get("time_taken", 0.0)), Color(0.5, 0.55, 0.65), 16)
	list_vbox.add_child(card)

func _add_stat(parent: HBoxContainer, label: String, value: String, color: Color, font_size: int) -> void:
	var vbox := VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	parent.add_child(vbox)
	var val_label := Label.new()
	val_label.text = value
	val_label.add_theme_color_override("font_color", color)
	val_label.add_theme_font_size_override("font_size", font_size)
	val_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(val_label)
	var lbl_label := Label.new()
	lbl_label.text = label
	lbl_label.add_theme_color_override("font_color", Color(0.55, 0.6, 0.7))
	lbl_label.add_theme_font_size_override("font_size", 11)
	lbl_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(lbl_label)

func _on_back_pressed() -> void:
	AudioManager.play_sfx("tick")
	get_tree().change_scene_to_file("res://scenes/ui/main_menu.tscn")
