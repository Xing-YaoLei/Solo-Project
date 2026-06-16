extends Control

var scene_manager: SceneManager
var statistics_manager: StatisticsManager
var game_manager: GameManager

@onready var back_button: Button = $MainVBox/Header/BackButton
@onready var reset_button: Button = $MainVBox/Header/ResetButton

@onready var completion_rate_value: Label = $MainVBox/OverallStatsPanel/OverallStatsGrid/CompletionRateValue
@onready var total_sessions_value: Label = $MainVBox/OverallStatsPanel/OverallStatsGrid/TotalSessionsValue
@onready var total_patients_value: Label = $MainVBox/OverallStatsPanel/OverallStatsGrid/TotalPatientsValue
@onready var overall_accuracy_value: Label = $MainVBox/OverallStatsPanel/OverallStatsGrid/OverallAccuracyValue
@onready var insurance_rejections_value: Label = $MainVBox/OverallStatsPanel/OverallStatsGrid/InsuranceRejectionsValue
@onready var total_time_value: Label = $MainVBox/OverallStatsPanel/OverallStatsGrid/TotalTimeValue

@onready var level_stats_content: VBoxContainer = $MainVBox/LevelStatsPanel/LevelStatsVBox/LevelStatsScroll/LevelStatsContent
@onready var recent_sessions_content: VBoxContainer = $MainVBox/RecentSessionsPanel/RecentSessionsVBox/RecentSessionsScroll/RecentSessionsContent

func _ready():
	if Globals:
		scene_manager = Globals.scene_manager
		statistics_manager = Globals.statistics_manager
		game_manager = Globals.game_manager
	
	back_button.pressed.connect(_on_back_button_pressed)
	reset_button.pressed.connect(_on_reset_button_pressed)
	
	_render_all_statistics()

func _render_all_statistics():
	_render_overall_statistics()
	_render_level_statistics()
	_render_recent_sessions()

func _render_overall_statistics():
	if not statistics_manager:
		return
	
	var stats: Dictionary = statistics_manager.get_overall_statistics()
	
	completion_rate_value.text = "%d%%" % int(stats.get("completion_rate", 0) * 100)
	total_sessions_value.text = str(stats.get("total_sessions", 0))
	total_patients_value.text = str(stats.get("total_patients_processed", 0))
	overall_accuracy_value.text = "%d%%" % int(stats.get("overall_accuracy", 0) * 100)
	insurance_rejections_value.text = str(stats.get("total_insurance_rejections", 0))
	total_time_value.text = statistics_manager.format_time(stats.get("total_training_time", 0))
	
	var completion_rate: float = stats.get("completion_rate", 0)
	if completion_rate >= 0.8:
		completion_rate_value.add_theme_color_override("font_color", Color(0.3, 0.85, 0.4, 1))
	elif completion_rate >= 0.6:
		completion_rate_value.add_theme_color_override("font_color", Color(0.95, 0.75, 0.3, 1))
	else:
		completion_rate_value.add_theme_color_override("font_color", Color(0.95, 0.3, 0.3, 1))

func _render_level_statistics():
	_clear_container(level_stats_content)
	
	if not statistics_manager or not game_manager:
		return
	
	var levels: Array[LevelData] = game_manager.get_all_levels()
	var overall_stats: Dictionary = statistics_manager.get_overall_statistics()
	var level_stats: Dictionary = overall_stats.get("level_statistics", {})
	
	for level in levels:
		var stat: Dictionary = level_stats.get(level.id, {})
		var card: Panel = _create_level_stat_card(level, stat)
		level_stats_content.add_child(card)

func _create_level_stat_card(level: LevelData, stat: Dictionary) -> Panel:
	var card: Panel = Panel.new()
	card.custom_minimum_size = Vector2(0, 90)
	
	var hbox: HBoxContainer = HBoxContainer.new()
	hbox.layout_mode = 1
	hbox.anchors_preset = 15
	hbox.anchor_right = 1
	hbox.anchor_bottom = 1
	hbox.offset_left = 15
	hbox.offset_top = 10
	hbox.offset_right = -15
	hbox.offset_bottom = -10
	hbox.theme_override_constants.separation = 20
	card.add_child(hbox)
	
	var level_info: VBoxContainer = VBoxContainer.new()
	level_info.size_flags_horizontal = 3
	level_info.theme_override_constants.separation = 5
	hbox.add_child(level_info)
	
	var name_hbox: HBoxContainer = HBoxContainer.new()
	name_hbox.theme_override_constants.separation = 10
	level_info.add_child(name_hbox)
	
	var name_label: Label = Label.new()
	name_label.text = level.name
	name_label.theme_override_colors.font_color = Color(0.95, 0.95, 0.95, 1)
	name_label.theme_override_font_sizes.font_size = 16
	name_hbox.add_child(name_label)
	
	var diff_label: Label = Label.new()
	diff_label.text = level.get_difficulty_name()
	diff_label.theme_override_colors.font_color = level.get_difficulty_color()
	diff_label.theme_override_font_sizes.font_size = 12
	name_hbox.add_child(diff_label)
	
	var desc_label: Label = Label.new()
	desc_label.text = level.description
	desc_label.theme_override_colors.font_color = Color(0.6, 0.65, 0.7, 1)
	desc_label.theme_override_font_sizes.font_size = 12
	level_info.add_child(desc_label)
	
	var stats_grid: GridContainer = GridContainer.new()
	stats_grid.columns = 4
	stats_grid.custom_minimum_size = Vector2(400, 0)
	stats_grid.theme_override_constants.h_separation = 20
	stats_grid.theme_override_constants.v_separation = 5
	hbox.add_child(stats_grid)
	
	var attempts: int = stat.get("attempts", 0)
	var completions: int = stat.get("completions", 0)
	var best_score: int = stat.get("best_score", 0)
	var best_time: float = stat.get("best_time", 0)
	
	_add_stat_item(stats_grid, "尝试次数", str(attempts), Color(0.6, 0.8, 0.9, 1))
	_add_stat_item(stats_grid, "完成次数", str(completions), Color(0.3, 0.85, 0.4, 1))
	_add_stat_item(stats_grid, "最佳得分", "%d分" % best_score, Color(1, 0.85, 0.3, 1))
	_add_stat_item(stats_grid, "最佳用时", 
		statistics_manager.format_time(best_time) if best_time > 0 else "-", 
		Color(0.7, 0.8, 0.85, 1))
	
	if attempts > 0:
		var level_completion_rate: float = float(completions) / float(attempts)
		var rate_label: Label = Label.new()
		rate_label.text = "完成率: %d%%" % int(level_completion_rate * 100)
		rate_label.horizontal_alignment = 2
		if level_completion_rate >= 0.8:
			rate_label.theme_override_colors.font_color = Color(0.3, 0.85, 0.4, 1)
		elif level_completion_rate >= 0.6:
			rate_label.theme_override_colors.font_color = Color(0.95, 0.75, 0.3, 1)
		else:
			rate_label.theme_override_colors.font_color = Color(0.95, 0.3, 0.3, 1)
		rate_label.theme_override_font_sizes.font_size = 12
		level_info.add_child(rate_label)
	
	return card

func _add_stat_item(container: GridContainer, title: String, value: String, color: Color):
	var title_label: Label = Label.new()
	title_label.text = title
	title_label.theme_override_colors.font_color = Color(0.6, 0.65, 0.7, 1)
	title_label.theme_override_font_sizes.font_size = 11
	container.add_child(title_label)
	
	var value_label: Label = Label.new()
	value_label.text = value
	value_label.horizontal_alignment = 2
	value_label.theme_override_colors.font_color = color
	value_label.theme_override_font_sizes.font_size = 14
	container.add_child(value_label)

func _render_recent_sessions():
	_clear_container(recent_sessions_content)
	
	if not statistics_manager:
		return
	
	var sessions: Array = statistics_manager.get_recent_sessions(10)
	
	if sessions.size() == 0:
		var label: Label = Label.new()
		label.text = "暂无训练记录\n完成一次训练后这里会显示你的历史记录"
		label.horizontal_alignment = 1
		label.theme_override_colors.font_color = Color(0.5, 0.55, 0.6, 1)
		label.theme_override_font_sizes.font_size = 14
		recent_sessions_content.add_child(label)
		return
	
	for session in sessions:
		var row: HBoxContainer = _create_session_row(session)
		recent_sessions_content.add_child(row)

func _create_session_row(session: Dictionary) -> HBoxContainer:
	var row: HBoxContainer = HBoxContainer.new()
	row.custom_minimum_size = Vector2(0, 35)
	row.theme_override_constants.separation = 15
	
	var passed: bool = session.get("passed", false)
	var status_icon: Label = Label.new()
	status_icon.text = "✅" if passed else "❌"
	status_icon.custom_minimum_size = Vector2(30, 0)
	row.add_child(status_icon)
	
	var level_label: Label = Label.new()
	level_label.text = session.get("level_name", "未知")
	level_label.size_flags_horizontal = 3
	level_label.theme_override_colors.font_color = Color(0.85, 0.85, 0.9, 1)
	level_label.theme_override_font_sizes.font_size = 13
	row.add_child(level_label)
	
	var score_label: Label = Label.new()
	score_label.text = "%d分" % session.get("score", 0)
	score_label.custom_minimum_size = Vector2(70, 0)
	score_label.theme_override_colors.font_color = Color(1, 0.85, 0.3, 1)
	score_label.theme_override_font_sizes.font_size = 13
	row.add_child(score_label)
	
	var accuracy_label: Label = Label.new()
	accuracy_label.text = "%d%%" % int(session.get("accuracy", 0) * 100)
	accuracy_label.custom_minimum_size = Vector2(60, 0)
	accuracy_label.horizontal_alignment = 2
	accuracy_label.theme_override_colors.font_color = Color(0.3, 0.85, 0.4, 1)
	accuracy_label.theme_override_font_sizes.font_size = 13
	row.add_child(accuracy_label)
	
	var time_label: Label = Label.new()
	time_label.text = "%ds" % int(session.get("time_used", 0))
	time_label.custom_minimum_size = Vector2(60, 0)
	time_label.horizontal_alignment = 2
	time_label.theme_override_colors.font_color = Color(0.6, 0.8, 0.9, 1)
	time_label.theme_override_font_sizes.font_size = 13
	row.add_child(time_label)
	
	var date_label: Label = Label.new()
	date_label.text = session.get("timestamp", "")
	date_label.custom_minimum_size = Vector2(170, 0)
	date_label.horizontal_alignment = 2
	date_label.theme_override_colors.font_color = Color(0.5, 0.55, 0.6, 1)
	date_label.theme_override_font_sizes.font_size = 11
	row.add_child(date_label)
	
	return row

func _clear_container(container: VBoxContainer):
	for child in container.get_children():
		child.queue_free()

func _on_back_button_pressed():
	if scene_manager:
		scene_manager.go_to_main_menu()

func _on_reset_button_pressed():
	if not statistics_manager:
		return
	
	var dialog: ConfirmationDialog = ConfirmationDialog.new()
	dialog.title = "确认重置"
	dialog.dialog_text = "确定要重置所有统计数据吗？\n此操作不可撤销！"
	dialog.add_button("取消", false, "cancel")
	dialog.add_button("确定重置", true, "reset")
	add_child(dialog)
	dialog.popup_centered()
	
	dialog.custom_action.connect(func(action: String):
		dialog.hide()
		dialog.queue_free()
		if action == "reset":
			statistics_manager.reset_statistics()
			_render_all_statistics()
	)
	dialog.canceled.connect(func():
		dialog.queue_free()
	)
