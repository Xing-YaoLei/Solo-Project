extends Control

var _records: Array = []
var _filtered_records: Array = []
var _current_filter: String = "all"

var _color_bg := Color.hex(0x1a1a2eff)
var _color_accent := Color.hex(0xe94560ff)
var _color_secondary := Color.hex(0x16213eff)
var _color_text := Color.hex(0xeeeeeeff)
var _color_success := Color.hex(0x4ecca3ff)

@onready var _stats_total: Label = %StatsTotal
@onready var _stats_avg: Label = %StatsAvg
@onready var _stats_best: Label = %StatsBest
@onready var _stats_sessions: Label = %StatsSessions
@onready var _records_scroll: ScrollContainer = %RecordsScroll
@onready var _records_container: VBoxContainer = %RecordsContainer
@onready var _filter_all: Button = %FilterAll
@onready var _filter_practice: Button = %FilterPractice
@onready var _filter_assessment: Button = %FilterAssessment
@onready var _filter_challenge: Button = %FilterChallenge
@onready var _back_btn: Button = %BackBtn
@onready var _no_records_label: Label = %NoRecordsLabel

func _ready() -> void:
	_setup_ui()
	_connect_signals()
	_refresh_data()

func _setup_ui() -> void:
	$Background.color = _color_bg

	$Title.add_theme_font_size_override("font_size", 32)
	$Title.add_theme_color_override("font_color", _color_accent)

	var stats: Array = [$StatsBox/Stats1, $StatsBox/Stats2, $StatsBox/Stats3, $StatsBox/Stats4]
	for s in stats:
		s.add_theme_stylebox_override("panel", _make_panel_style())

	$StatsBox.add_theme_constant_override("separation", 16)

	var filter_btns: Array = [_filter_all, _filter_practice, _filter_assessment, _filter_challenge]
	for btn in filter_btns:
		_style_filter_button(btn)

	_style_back_button(_back_btn)

	_records_scroll.add_theme_stylebox_override("panel", _make_panel_style())

func _make_panel_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = _color_secondary
	style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.5)
	style.set_border_width_all(1)
	style.set_corner_radius_all(8)
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	return style

func _style_filter_button(btn: Button) -> void:
	var normal_style := StyleBoxFlat.new()
	normal_style.bg_color = _color_secondary
	normal_style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.5)
	normal_style.set_border_width_all(1)
	normal_style.set_corner_radius_all(8)
	normal_style.content_margin_left = 12
	normal_style.content_margin_right = 12
	normal_style.content_margin_top = 8
	normal_style.content_margin_bottom = 8

	var hover_style := StyleBoxFlat.new()
	hover_style.bg_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.3)
	hover_style.border_color = _color_accent
	hover_style.set_border_width_all(1)
	hover_style.set_corner_radius_all(8)
	hover_style.content_margin_left = 12
	hover_style.content_margin_right = 12
	hover_style.content_margin_top = 8
	hover_style.content_margin_bottom = 8

	var pressed_style := StyleBoxFlat.new()
	pressed_style.bg_color = _color_accent
	pressed_style.set_corner_radius_all(8)
	pressed_style.content_margin_left = 12
	pressed_style.content_margin_right = 12
	pressed_style.content_margin_top = 8
	pressed_style.content_margin_bottom = 8

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_stylebox_override("pressed", pressed_style)
	btn.add_theme_font_size_override("font_size", 14)
	btn.add_theme_color_override("font_color", _color_text)
	btn.add_theme_color_override("font_pressed_color", Color.WHITE)

func _style_back_button(btn: Button) -> void:
	var normal_style := StyleBoxFlat.new()
	normal_style.bg_color = _color_secondary
	normal_style.border_color = _color_accent
	normal_style.set_border_width_all(2)
	normal_style.set_corner_radius_all(10)
	normal_style.content_margin_left = 24
	normal_style.content_margin_right = 24
	normal_style.content_margin_top = 10
	normal_style.content_margin_bottom = 10

	var hover_style := StyleBoxFlat.new()
	hover_style.bg_color = _color_accent
	hover_style.set_corner_radius_all(10)
	hover_style.content_margin_left = 24
	hover_style.content_margin_right = 24
	hover_style.content_margin_top = 10
	hover_style.content_margin_bottom = 10

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_font_size_override("font_size", 18)
	btn.add_theme_color_override("font_color", _color_text)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)

func _connect_signals() -> void:
	_filter_all.pressed.connect(func(): _set_filter("all"))
	_filter_practice.pressed.connect(func(): _set_filter("PRACTICE"))
	_filter_assessment.pressed.connect(func(): _set_filter("ASSESSMENT"))
	_filter_challenge.pressed.connect(func(): _set_filter("CHALLENGE"))
	_back_btn.pressed.connect(_on_back_pressed)

func _refresh_data() -> void:
	_records = TrainingRecordManager.get_records()
	_records.reverse()
	_set_filter(_current_filter)
	_update_stats()

func _set_filter(filter_val: String) -> void:
	_current_filter = filter_val
	_filter_all.button_pressed = (filter_val == "all")
	_filter_practice.button_pressed = (filter_val == "PRACTICE")
	_filter_assessment.button_pressed = (filter_val == "ASSESSMENT")
	_filter_challenge.button_pressed = (filter_val == "CHALLENGE")

	if filter_val == "all":
		_filtered_records = _records.duplicate()
	else:
		_filtered_records = _records.filter(func(r): return r.get("mode", "") == filter_val)

	_render_records()

func _update_stats() -> void:
	var total: int = 0
	var best: int = 0
	var count: int = _records.size()
	for r in _records:
		var s: int = r.get("total_score", 0)
		total += s
		best = max(best, s)

	var avg: float = 0.0
	if count > 0:
		avg = float(total) / float(count)

	_stats_sessions.text = "%d" % count
	_stats_total.text = "%d" % total
	_stats_avg.text = "%.1f" % avg
	_stats_best.text = "%d" % best

func _render_records() -> void:
	for child in _records_container.get_children():
		child.queue_free()

	if _filtered_records.is_empty():
		_no_records_label.visible = true
		return
	_no_records_label.visible = false

	for i in range(_filtered_records.size()):
		var record: Dictionary = _filtered_records[i]
		var panel: PanelContainer = _create_record_card(record, i + 1)
		_records_container.add_child(panel)

func _create_record_card(record: Dictionary, idx: int) -> PanelContainer:
	var panel := PanelContainer.new()
	var style := StyleBoxFlat.new()
	style.bg_color = Color(_color_secondary.r, _color_secondary.g, _color_secondary.b, 1.0)
	style.border_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.3)
	style.set_border_width_all(1)
	style.set_corner_radius_all(8)
	style.content_margin_left = 16
	style.content_margin_right = 16
	style.content_margin_top = 12
	style.content_margin_bottom = 12
	panel.add_theme_stylebox_override("panel", style)

	var vbox := VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 6)

	var header_hbox := HBoxContainer.new()
	header_hbox.add_theme_constant_override("separation", 16)

	var idx_label := Label.new()
	idx_label.text = "#%d" % idx
	idx_label.add_theme_font_size_override("font_size", 16)
	idx_label.add_theme_color_override("font_color", _color_accent)
	idx_label.custom_minimum_size = Vector2(40, 0)
	header_hbox.add_child(idx_label)

	var mode_label := Label.new()
	var mode_str: String = record.get("mode", "")
	var mode_display: String = ""
	match mode_str:
		"PRACTICE": mode_display = "练习模式"
		"ASSESSMENT": mode_display = "考核模式"
		"CHALLENGE": mode_display = "挑战模式"
		_: mode_display = mode_str
	mode_label.text = mode_display
	mode_label.add_theme_font_size_override("font_size", 16)
	mode_label.add_theme_color_override("font_color", _color_warning())
	header_hbox.add_child(mode_label)

	var spacer := Control.new()
	spacer.size_flags_horizontal = 3
	header_hbox.add_child(spacer)

	var score_label := Label.new()
	var total_score: int = record.get("total_score", 0)
	var passed: bool = total_score >= ConfigManager.get_pass_threshold()
	score_label.text = "得分: %d" % total_score
	score_label.add_theme_font_size_override("font_size", 20)
	score_label.add_theme_color_override("font_color", _color_success if passed else _color_accent)
	header_hbox.add_child(score_label)

	vbox.add_child(header_hbox)

	var time_label := Label.new()
	var duration_sec: int = record.get("duration_msec", 0) / 1000
	var min: int = duration_sec / 60
	var sec: int = duration_sec % 60
	time_label.text = "时间: %s | 用时: %d分%d秒 | 题目数: %d" % [
		record.get("timestamp", ""), min, sec, record.get("question_count", 0)
	]
	time_label.add_theme_font_size_override("font_size", 13)
	time_label.add_theme_color_override("font_color", Color(_color_text.r, _color_text.g, _color_text.b, 0.7))
	vbox.add_child(time_label)

	var phase_scores: Dictionary = record.get("phase_scores", {})
	if not phase_scores.is_empty():
		var phase_hbox := HBoxContainer.new()
		phase_hbox.add_theme_constant_override("separation", 20)
		var phase_names: Dictionary = {
			0: "照片核验", 1: "评价标签", 2: "地址排序", 3: "轨迹处理"
		}
		for phase_idx_str in phase_scores.keys():
			var phase_idx: int = int(phase_idx_str)
			var phase_score: int = phase_scores[phase_idx_str]
			var phase_lbl := Label.new()
			phase_lbl.text = "%s: %+d" % [phase_names.get(phase_idx, str(phase_idx)), phase_score]
			phase_lbl.add_theme_font_size_override("font_size", 13)
			phase_lbl.add_theme_color_override("font_color", _color_success if phase_score >= 0 else _color_accent)
			phase_hbox.add_child(phase_lbl)
		vbox.add_child(phase_hbox)

	panel.add_child(vbox)
	return panel

func _color_warning() -> Color:
	return Color.hex(0xffc857ff)

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu/main_menu.tscn")
