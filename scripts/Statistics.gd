extends Control

@onready var back_button: Button = $TopBar/MarginContainer/HBoxContainer/BackButton
@onready var title_label: Label = $TopBar/MarginContainer/HBoxContainer/TitleLabel
@onready var stats_container: VBoxContainer = $MarginContainer/VBoxContainer/ScrollContainer/StatsContainer
@onready var coverage_container: VBoxContainer = $MarginContainer/VBoxContainer/CoveragePanel/MarginContainer/VBoxContainer/CoverageContainer
@onready var coverage_desc: Label = $MarginContainer/VBoxContainer/CoveragePanel/MarginContainer/VBoxContainer/CoverageDesc

func _ready() -> void:
	back_button.pressed.connect(_on_back_pressed)
	_refresh_stats()

func _refresh_stats() -> void:
	for child in stats_container.get_children():
		child.queue_free()
	for child in coverage_container.get_children():
		child.queue_free()
	
	var stats = GameManager.get_level_statistics()
	var level_types = GameManager.get_level_types()
	
	for level_type in level_types.keys():
		var type_name = level_types[level_type]
		var stat = stats.get(level_type, {})
		var panel := _create_stat_panel(type_name, stat)
		stats_container.add_child(panel)
	
	_build_coverage_chart(stats, level_types)

func _create_stat_panel(type_name: String, stat: Dictionary) -> PanelContainer:
	var panel := PanelContainer.new()
	
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 20)
	margin.add_theme_constant_override("margin_top", 16)
	margin.add_theme_constant_override("margin_right", 20)
	margin.add_theme_constant_override("margin_bottom", 16)
	panel.add_child(margin)
	
	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	margin.add_child(vbox)
	
	var name_label := Label.new()
	name_label.text = type_name
	name_label.add_theme_font_size_override("font_size", 20)
	name_label.add_theme_color_override("font_color", Color(0.1, 0.25, 0.55, 1))
	vbox.add_child(name_label)
	
	var divider := ColorRect.new()
	divider.custom_minimum_size = Vector2(0, 1)
	divider.color = Color(0.82, 0.85, 0.9, 1)
	vbox.add_child(divider)
	
	var info_grid := GridContainer.new()
	info_grid.columns = 2
	info_grid.add_theme_constant_override("h_separation", 40)
	info_grid.add_theme_constant_override("v_separation", 6)
	vbox.add_child(info_grid)
	
	_add_stat_row(info_grid, "训练次数", "%d" % stat.get("total_attempts", 0))
	_add_stat_row(info_grid, "平均分", "%d" % stat.get("avg_score", 0))
	_add_stat_row(info_grid, "最高分", "%d" % stat.get("best_score", 0))
	_add_stat_row(info_grid, "通过次数", "%d" % stat.get("completion_count", 0))
	_add_stat_row(info_grid, "满分次数", "%d" % stat.get("full_star_count", 0))
	
	var coverage = stat.get("coverage_rate", 0.0)
	var coverage_text := "%.0f%%" % (coverage * 100)
	_add_stat_row(info_grid, "评教覆盖", coverage_text)
	
	return panel

func _add_stat_row(grid: GridContainer, label_text: String, value_text: String) -> void:
	var label := Label.new()
	label.text = label_text
	label.add_theme_font_size_override("font_size", 15)
	label.add_theme_color_override("font_color", Color(0.4, 0.45, 0.55, 1))
	grid.add_child(label)
	
	var value := Label.new()
	value.text = value_text
	value.add_theme_font_size_override("font_size", 16)
	value.add_theme_color_override("font_color", Color(0.1, 0.2, 0.4, 1))
	grid.add_child(value)

func _build_coverage_chart(stats: Dictionary, level_types: Dictionary) -> void:
	var best_type := ""
	var best_coverage := -1.0
	var worst_type := ""
	var worst_coverage := 2.0
	
	for level_type in level_types.keys():
		var stat = stats.get(level_type, {})
		var coverage = stat.get("coverage_rate", 0.0)
		var type_name = level_types[level_type]
		
		var bar_hbox := HBoxContainer.new()
		bar_hbox.add_theme_constant_override("separation", 12)
		coverage_container.add_child(bar_hbox)
		
		var name_label := Label.new()
		name_label.text = type_name
		name_label.add_theme_font_size_override("font_size", 15)
		name_label.custom_minimum_size = Vector2(140, 0)
		name_label.add_theme_color_override("font_color", Color(0.3, 0.35, 0.45, 1))
		bar_hbox.add_child(name_label)
		
		var bar_bg := ColorRect.new()
		bar_bg.custom_minimum_size = Vector2(300, 24)
		bar_bg.color = Color(0.88, 0.9, 0.93, 1)
		bar_bg.size_flags_horizontal = 3
		bar_hbox.add_child(bar_bg)
		
		var bar_fill := ColorRect.new()
		bar_fill.custom_minimum_size = Vector2(300 * coverage, 24)
		var fill_color = Color(0.15, 0.4, 0.9, 1)
		if coverage >= 0.8:
			fill_color = Color(0.1, 0.6, 0.2, 1)
		elif coverage >= 0.5:
			fill_color = Color(0.85, 0.6, 0.1, 1)
		elif coverage > 0:
			fill_color = Color(0.85, 0.2, 0.2, 1)
		bar_fill.color = fill_color
		bar_bg.add_child(bar_fill)
		
		var pct_label := Label.new()
		pct_label.text = "%.0f%%" % (coverage * 100)
		pct_label.add_theme_font_size_override("font_size", 15)
		pct_label.add_theme_color_override("font_color", Color(0.1, 0.2, 0.4, 1))
		pct_label.custom_minimum_size = Vector2(50, 0)
		bar_hbox.add_child(pct_label)
		
		if coverage > best_coverage:
			best_coverage = coverage
			best_type = type_name
		if coverage < worst_coverage:
			worst_coverage = coverage
			worst_type = type_name
	
	if best_type != "":
		coverage_desc.text = "评教覆盖分析: 「%s」训练效果最好(%.0f%%)，「%s」需要加强(%.0f%%)" % [
			best_type, best_coverage * 100, worst_type, worst_coverage * 100
		]
	else:
		coverage_desc.text = "暂无训练数据，完成训练后将显示评教覆盖分析"

func _on_back_pressed() -> void:
	SceneManager.go_back()
