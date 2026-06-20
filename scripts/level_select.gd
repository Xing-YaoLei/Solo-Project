extends Control

@onready var level_container: VBoxContainer = $ScrollContainer/LevelList
@onready var back_btn: Button = $TopBar/BackButton
@onready var title_label: Label = $TopBar/TitleLabel

func _ready() -> void:
	back_btn.pressed.connect(_on_back_pressed)
	_build_level_list()

func _build_level_list() -> void:
	for child in level_container.get_children():
		child.queue_free()

	for level in DataLoader.levels:
		var card: PanelContainer = _create_level_card(level)
		level_container.add_child(card)

func _create_level_card(level: Dictionary) -> PanelContainer:
	var card: PanelContainer = PanelContainer.new()
	card.custom_minimum_size = Vector2(0, 120)

	var is_unlocked: bool = GameManager.is_level_unlocked(level["id"])
	var high_score: int = GameManager.level_high_scores.get(level["id"], 0)

	var hbox: HBoxContainer = HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 20)
	card.add_child(hbox)

	var icon_path: String = DataLoader.get_level_asset(level, "icon")
	if icon_path != "":
		var tex: Texture2D = DataLoader.load_texture(icon_path)
		if tex:
			var icon_rect: TextureRect = TextureRect.new()
			icon_rect.texture = tex
			icon_rect.custom_minimum_size = Vector2(80, 80)
			icon_rect.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
			icon_rect.size_flags_vertical = Control.SIZE_SHRINK_CENTER
			hbox.add_child(icon_rect)

	var left_vbox: VBoxContainer = VBoxContainer.new()
	left_vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(left_vbox)

	var name_label: Label = Label.new()
	name_label.text = "Lv.%d  %s" % [level.get("difficulty", 1), level.get("name", "未知关卡")]
	name_label.add_theme_font_size_override("font_size", 20)
	if not is_unlocked:
		name_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
	left_vbox.add_child(name_label)

	var desc_label: Label = Label.new()
	desc_label.text = level.get("description", "")
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	if not is_unlocked:
		desc_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
	left_vbox.add_child(desc_label)

	var info_label: Label = Label.new()
	var score_text: String = "最高分: %d" % high_score if high_score > 0 else "未通关"
	info_label.text = "订单数: %d  |  限时: %ds  |  %s  |  及格分: %d" % [
		level.get("order_count", 0),
		level.get("time_limit_seconds", 0),
		score_text,
		level.get("min_score_to_pass", 60)
	]
	info_label.add_theme_color_override("font_color", Color(0.6, 0.8, 1.0, 1))
	left_vbox.add_child(info_label)

	var right_vbox: VBoxContainer = VBoxContainer.new()
	right_vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	hbox.add_child(right_vbox)

	var btn: Button = Button.new()
	btn.custom_minimum_size = Vector2(140, 50)
	if is_unlocked:
		btn.text = "▶ 开始训练"
		btn.pressed.connect(func(): GameManager.start_level(level["id"]))
	else:
		btn.text = "🔒 未解锁"
		btn.disabled = true
	right_vbox.add_child(btn)

	return card

func _on_back_pressed() -> void:
	GameManager.go_to_main_menu()
