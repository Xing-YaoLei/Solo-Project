extends Control

var training_levels: Array[TrainingLevel] = []
var selected_level: TrainingLevel = null

@onready var back_button: Button = $TopBar/BackButton
@onready var reset_tutorial_button: Button = $TopBar/ResetTutorialButton
@onready var levels_grid: GridContainer = $ScrollContainer/LevelsGrid
@onready var details_panel: Control = $DetailsPanel
@onready var level_name_label: Label = $DetailsPanel/Content/LevelNameLabel
@onready var level_desc_label: Label = $DetailsPanel/Content/LevelDescLabel
@onready var difficulty_label: Label = $DetailsPanel/Content/DifficultyLabel
@onready var objective_label: Label = $DetailsPanel/Content/ObjectiveLabel
@onready var target_time_label: Label = $DetailsPanel/Content/TargetTimeLabel
@onready var target_repair_label: Label = $DetailsPanel/Content/TargetRepairLabel
@onready var min_score_label: Label = $DetailsPanel/Content/MinScoreLabel
@onready var order_count_label: Label = $DetailsPanel/Content/OrderCountLabel
@onready var start_button: Button = $DetailsPanel/Content/StartButton
@onready var locked_overlay: Control = $DetailsPanel/LockedOverlay

func _ready():
	_initialize_levels()
	_setup_connections()
	_refresh_levels_grid()
	details_panel.visible = false

func _initialize_levels() -> void:
	training_levels.clear()

	var tutorial_level = TrainingLevel.new(
		0,
		"新手教程",
		"学习基本的工单处理流程",
		TrainingLevel.Difficulty.BEGINNER,
		"完成3个工单，学习选择、报价、批准流程",
		300.0,
		0.2,
		300,
		3,
		true
	)
	tutorial_level.add_tutorial_step("work_order_card", "点击左侧任意一张工单卡片开始处理", "选择一个待处理的工单", "LeftPanel/OrdersContainer")
	tutorial_level.add_tutorial_step("quote_builder", "查看右侧自动生成的报价单，确认配件和工时费用", "报价单包含配件费用和工时费", "RightPanel/QuotePanel")
	tutorial_level.add_tutorial_step("confirm_button", "点击'发送报价'按钮发送给客户", "发送报价后需要等待客户批准", "RightPanel/QuotePanel/SendButton")
	tutorial_level.add_tutorial_step("schedule_button", "客户批准后点击'批准'完成工单", "批准后工单完成，获得积分", "RightPanel/QuotePanel/ApproveButton")
	training_levels.append(tutorial_level)

	var level1 = TrainingLevel.new(
		1,
		"入门训练",
		"处理简单的保养工单",
		TrainingLevel.Difficulty.BEGINNER,
		"在5分钟内完成5个工单，保持返修率低于20%",
		300.0,
		0.2,
		500,
		5
	)
	training_levels.append(level1)

	var level2 = TrainingLevel.new(
		2,
		"时间管理",
		"学习优先处理紧急工单",
		TrainingLevel.Difficulty.INTERMEDIATE,
		"在6分钟内完成8个工单，优先处理高优先级工单",
		360.0,
		0.15,
		800,
		8
	)
	level2.set_required_levels([1])
	training_levels.append(level2)

	var level3 = TrainingLevel.new(
		3,
		"库存管理",
		"学习管理配件库存",
		TrainingLevel.Difficulty.INTERMEDIATE,
		"在8分钟内完成10个工单，及时补货避免缺货",
		480.0,
		0.15,
		1000,
		10
	)
	level3.set_required_levels([2])
	training_levels.append(level3)

	var level4 = TrainingLevel.new(
		4,
		"返修控制",
		"专注于提高服务质量",
		TrainingLevel.Difficulty.ADVANCED,
		"在10分钟内完成12个工单，返修率低于10%",
		600.0,
		0.1,
		1500,
		12
	)
	level4.set_required_levels([3])
	training_levels.append(level4)

	var level5 = TrainingLevel.new(
		5,
		"综合挑战",
		"高难度综合训练",
		TrainingLevel.Difficulty.ADVANCED,
		"在12分钟内完成15个工单，返修率低于8%",
		720.0,
		0.08,
		2000,
		15
	)
	level5.set_required_levels([4])
	training_levels.append(level5)

	var level6 = TrainingLevel.new(
		6,
		"专家模式",
		"车间主管认证挑战",
		TrainingLevel.Difficulty.EXPERT,
		"在15分钟内完成20个工单，返修率低于5%",
		900.0,
		0.05,
		3000,
		20
	)
	level6.set_required_levels([5])
	training_levels.append(level6)

func _setup_connections() -> void:
	back_button.pressed.connect(_on_back_pressed)
	start_button.pressed.connect(_on_start_pressed)
	reset_tutorial_button.pressed.connect(_on_reset_tutorial_pressed)

func _refresh_levels_grid() -> void:
	for child in levels_grid.get_children():
		child.queue_free()

	var completed_levels = GameManager.player_data.unlocked_levels if GameManager.player_data else [1]

	for level in training_levels:
		var is_unlocked = level.is_unlocked(completed_levels) or level.id == 0
		var card = _create_level_card(level, is_unlocked)
		levels_grid.add_child(card)

func _create_level_card(p_level: TrainingLevel, p_unlocked: bool) -> Control:
	var card = PanelContainer.new()
	card.custom_minimum_size = Vector2(200, 180)
	card.size_flags_horizontal = SIZE_SHRINK_CENTER
	card.size_flags_vertical = SIZE_SHRINK_CENTER

	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.25, 0.3, 0.35, 0.9) if p_unlocked else Color(0.15, 0.15, 0.2, 0.7)
	style.corner_radius_top_left = 10
	style.corner_radius_top_right = 10
	style.corner_radius_bottom_right = 10
	style.corner_radius_bottom_left = 10
	style.content_margin_left = 15
	style.content_margin_right = 15
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	card.add_theme_stylebox_override("panel", style)

	var vbox = VBoxContainer.new()
	vbox.size_flags_horizontal = SIZE_EXPAND_FILL
	vbox.theme_override_constants.spacing = 8
	card.add_child(vbox)

	var header_hbox = HBoxContainer.new()
	header_hbox.theme_override_constants.spacing = 10
	vbox.add_child(header_hbox)

	var id_label = Label.new()
	id_label.text = "#%d" % (p_level.id + 1) if not p_level.is_tutorial else "T"
	id_label.custom_minimum_size = Vector2(30, 0)
	id_label.add_theme_font_size_override("font_size", 18)
	id_label.add_theme_color_override("font_color", p_level.get_difficulty_color())
	id_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	header_hbox.add_child(id_label)

	var diff_label = Label.new()
	diff_label.text = p_level.get_difficulty_text()
	diff_label.size_flags_horizontal = SIZE_EXPAND_FILL
	diff_label.add_theme_font_size_override("font_size", 12)
	diff_label.add_theme_color_override("font_color", p_level.get_difficulty_color())
	diff_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	header_hbox.add_child(diff_label)

	var name_label = Label.new()
	name_label.text = p_level.name
	name_label.add_theme_font_size_override("font_size", 16)
	name_label.add_theme_color_override("font_color", Color.WHITE if p_unlocked else Color(0.5, 0.5, 0.5))
	name_label.autowrap_mode = 2
	vbox.add_child(name_label)

	var desc_label = Label.new()
	desc_label.text = p_level.description
	desc_label.add_theme_font_size_override("font_size", 11)
	desc_label.add_theme_color_override("font_color", Color(0.7, 0.75, 0.8) if p_unlocked else Color(0.4, 0.4, 0.4))
	desc_label.autowrap_mode = 2
	desc_label.size_flags_vertical = 3
	vbox.add_child(desc_label)

	var stats_hbox = HBoxContainer.new()
	stats_hbox.theme_override_constants.spacing = 10
	vbox.add_child(stats_hbox)

	var time_icon = Label.new()
	time_icon.text = "⏱"
	time_icon.add_theme_font_size_override("font_size", 14)
	stats_hbox.add_child(time_icon)

	var time_label = Label.new()
	time_label.text = "%d分钟" % int(p_level.target_completion_time / 60)
	time_label.add_theme_font_size_override("font_size", 11)
	time_label.add_theme_color_override("font_color", Color(0.7, 0.8, 0.9) if p_unlocked else Color(0.4, 0.4, 0.4))
	stats_hbox.add_child(time_label)

	var orders_icon = Label.new()
	orders_icon.text = "📋"
	orders_icon.add_theme_font_size_override("font_size", 14)
	stats_hbox.add_child(orders_icon)

	var orders_label = Label.new()
	orders_label.text = "%d工单" % p_level.order_count
	orders_label.add_theme_font_size_override("font_size", 11)
	orders_label.add_theme_color_override("font_color", Color(0.7, 0.8, 0.9) if p_unlocked else Color(0.4, 0.4, 0.4))
	stats_hbox.add_child(orders_label)

	if not p_unlocked:
		var lock_overlay = ColorRect.new()
		lock_overlay.color = Color(0, 0, 0, 0.3)
		lock_overlay.mouse_filter = Control.MOUSE_FILTER_IGNORE
		vbox.add_child(lock_overlay)

		var lock_label = Label.new()
		lock_label.text = "🔒 未解锁"
		lock_label.add_theme_font_size_override("font_size", 14)
		lock_label.add_theme_color_override("font_color", Color(1, 0.8, 0.5, 1))
		lock_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		vbox.add_child(lock_label)

	if p_unlocked:
		card.gui_input.connect(func(event):
			if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
				_on_level_selected(p_level)
				AudioManager.play_click()
		)

		card.mouse_entered.connect(func():
			if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.LOW):
				var tween = create_tween()
				tween.tween_property(card, "scale", Vector2(1.05, 1.05), 0.1)
			AudioManager.play_sfx(AudioManager.SFXType.BUTTON_HOVER)
		)

		card.mouse_exited.connect(func():
			if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.LOW):
				var tween = create_tween()
				tween.tween_property(card, "scale", Vector2(1.0, 1.0), 0.1)
		)

	return card

func _on_level_selected(p_level: TrainingLevel) -> void:
	selected_level = p_level
	details_panel.visible = true
	locked_overlay.visible = false

	level_name_label.text = p_level.name
	level_desc_label.text = p_level.description
	difficulty_label.text = p_level.get_difficulty_text()
	difficulty_label.add_theme_color_override("font_color", p_level.get_difficulty_color())
	objective_label.text = p_level.objective
	target_time_label.text = "目标时间: %d分%d秒" % [int(p_level.target_completion_time / 60), int(p_level.target_completion_time % 60)]
	target_repair_label.text = "目标返修率: ≤%.1f%%" % [p_level.target_repair_rate * 100]
	min_score_label.text = "目标分数: ≥%d" % p_level.min_score
	order_count_label.text = "工单数: %d" % p_level.order_count

	start_button.disabled = false
	start_button.text = "开始训练" if not p_level.is_tutorial else "开始教程"

func _on_start_pressed() -> void:
	if selected_level:
		AudioManager.play_click()
		GameManager.start_game(GameManager.GameMode.TRAINING, selected_level)
		GameManager.go_to_game()

func _on_back_pressed() -> void:
	AudioManager.play_click()
	GameManager.go_to_main_menu()

func _on_reset_tutorial_pressed() -> void:
	AudioManager.play_click()
	TutorialManager.reset_tutorial_state()
	_refresh_levels_grid()
	AudioManager.play_sfx(AudioManager.SFXType.SUCCESS)
