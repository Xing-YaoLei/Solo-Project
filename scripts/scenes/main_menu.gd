extends Control

var _btn_start: Button
var _open_status_label: Label

var _color_bg := Color.hex(0x1a1a2eff)
var _color_accent := Color.hex(0xe94560ff)
var _color_secondary := Color.hex(0x16213eff)
var _color_text := Color.hex(0xeeeeeeff)

func _ready() -> void:
	_apply_theme()
	_check_open_status()
	_connect_signals()

func _apply_theme() -> void:
	$Background.color = _color_bg

	var vbox: VBoxContainer = $VBoxContainer
	vbox.add_theme_constant_override("separation", 18)

	var title: Label = $VBoxContainer/Title
	title.add_theme_font_size_override("font_size", 44)
	title.add_theme_color_override("font_color", _color_accent)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	var subtitle: Label = $VBoxContainer/Subtitle
	subtitle.add_theme_font_size_override("font_size", 20)
	subtitle.add_theme_color_override("font_color", _color_text)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	_btn_start = $VBoxContainer/BtnStart
	var btn_record: Button = $VBoxContainer/BtnRecord
	var btn_replay: Button = $VBoxContainer/BtnReplay
	var btn_config: Button = $VBoxContainer/BtnConfig

	for btn: Button in [_btn_start, btn_record, btn_replay, btn_config]:
		_style_button(btn)

	_open_status_label = $VBoxContainer/OpenStatus
	_open_status_label.add_theme_font_size_override("font_size", 16)
	_open_status_label.add_theme_color_override("font_color", _color_text)
	_open_status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	var version: Label = $VBoxContainer/Version
	version.add_theme_font_size_override("font_size", 14)
	version.add_theme_color_override("font_color", Color(_color_text.r, _color_text.g, _color_text.b, 0.5))
	version.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	var sep1: HSeparator = $VBoxContainer/HSeparator
	sep1.add_theme_stylebox_override("separator", _make_separator_style())
	var sep2: HSeparator = $VBoxContainer/HSeparator2
	sep2.add_theme_stylebox_override("separator", _make_separator_style())

func _make_separator_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color(_color_accent.r, _color_accent.g, _color_accent.b, 0.3)
	style.set_content_margin_all(4)
	return style

func _style_button(btn: Button) -> void:
	var normal_style := StyleBoxFlat.new()
	normal_style.bg_color = _color_secondary
	normal_style.border_color = _color_accent
	normal_style.set_border_width_all(2)
	normal_style.set_corner_radius_all(10)
	normal_style.set_content_margin_all(16)

	var hover_style := StyleBoxFlat.new()
	hover_style.bg_color = _color_accent
	hover_style.set_corner_radius_all(10)
	hover_style.set_content_margin_all(16)

	var pressed_style := StyleBoxFlat.new()
	pressed_style.bg_color = Color(_color_accent.r * 0.7, _color_accent.g * 0.7, _color_accent.b * 0.7, 1.0)
	pressed_style.set_corner_radius_all(10)
	pressed_style.set_content_margin_all(16)

	var disabled_style := StyleBoxFlat.new()
	disabled_style.bg_color = Color(0.2, 0.2, 0.2, 0.5)
	disabled_style.border_color = Color(0.4, 0.4, 0.4, 0.5)
	disabled_style.set_border_width_all(2)
	disabled_style.set_corner_radius_all(10)
	disabled_style.set_content_margin_all(16)

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_stylebox_override("pressed", pressed_style)
	btn.add_theme_stylebox_override("disabled", disabled_style)
	btn.add_theme_font_size_override("font_size", 22)
	btn.add_theme_color_override("font_color", _color_text)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.add_theme_color_override("font_pressed_color", Color.WHITE)
	btn.add_theme_color_override("font_disabled_color", Color(0.5, 0.5, 0.5, 0.8))

func _check_open_status() -> void:
	var is_open: bool = ConfigManager.is_within_open_time()
	if is_open:
		_open_status_label.text = "开放状态: 开放中 ✓"
		_open_status_label.add_theme_color_override("font_color", Color.GREEN)
	else:
		_open_status_label.text = "开放状态: 未开放 ✗"
		_open_status_label.add_theme_color_override("font_color", _color_accent)
	_btn_start.disabled = not is_open

func _connect_signals() -> void:
	_btn_start.pressed.connect(_on_start_pressed)
	$VBoxContainer/BtnRecord.pressed.connect(_on_record_pressed)
	$VBoxContainer/BtnReplay.pressed.connect(_on_replay_pressed)
	$VBoxContainer/BtnConfig.pressed.connect(_on_config_pressed)

func _on_start_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/game/game.tscn")

func _on_record_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/training_record/training_record.tscn")

func _on_replay_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/replay_comparison/replay_comparison.tscn")

func _on_config_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/config_menu/config_menu.tscn")
