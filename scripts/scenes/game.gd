extends Control

var _current_session_id: String = ""
var _phase_container: Control
var _current_phase_scene: Node = null

var _color_bg := Color.hex(0x1a1a2eff)
var _color_accent := Color.hex(0xe94560ff)
var _color_secondary := Color.hex(0x16213eff)
var _color_text := Color.hex(0xeeeeeeff)
var _color_success := Color.hex(0x4ecca3ff)

@onready var _top_bar_score: Label = %TopBarScore
@onready var _top_bar_phase: Label = %TopBarPhase
@onready var _top_bar_progress: Label = %TopBarProgress
@onready var _mode_selector: Control = %ModeSelector
@onready var _phase_container_ref: Control = %PhaseContainer

func _ready() -> void:
	GameManager.phase_changed.connect(_on_phase_changed)
	GameManager.score_updated.connect(_on_score_updated)
	GameManager.session_started.connect(_on_session_started)
	GameManager.session_ended.connect(_on_session_ended)
	_setup_ui()
	if GameManager.is_session_active:
		_load_phase_scene(GameManager.current_phase)
		_mode_selector.visible = false
		_phase_container_ref.visible = true

func _setup_ui() -> void:
	$Background.color = _color_bg
	_setup_mode_buttons()

func _setup_mode_buttons() -> void:
	var vbox: VBoxContainer = $ModeSelector/VBoxContainer
	vbox.add_theme_constant_override("separation", 20)

	var title: Label = $ModeSelector/VBoxContainer/Title
	title.add_theme_font_size_override("font_size", 36)
	title.add_theme_color_override("font_color", _color_accent)
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	var subtitle: Label = $ModeSelector/VBoxContainer/Subtitle
	subtitle.add_theme_font_size_override("font_size", 18)
	subtitle.add_theme_color_override("font_color", _color_text)
	subtitle.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER

	for btn: Button in [$ModeSelector/VBoxContainer/BtnPractice, $ModeSelector/VBoxContainer/BtnAssessment, $ModeSelector/VBoxContainer/BtnChallenge, $ModeSelector/VBoxContainer/BtnBack]:
		_style_button(btn)

	$ModeSelector/VBoxContainer/BtnPractice.pressed.connect(func(): _start_session(GameManager.TrainingMode.PRACTICE))
	$ModeSelector/VBoxContainer/BtnAssessment.pressed.connect(func(): _start_session(GameManager.TrainingMode.ASSESSMENT))
	$ModeSelector/VBoxContainer/BtnChallenge.pressed.connect(func(): _start_session(GameManager.TrainingMode.CHALLENGE))
	$ModeSelector/VBoxContainer/BtnBack.pressed.connect(_on_back_pressed)

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

	btn.add_theme_stylebox_override("normal", normal_style)
	btn.add_theme_stylebox_override("hover", hover_style)
	btn.add_theme_stylebox_override("pressed", pressed_style)
	btn.add_theme_font_size_override("font_size", 20)
	btn.add_theme_color_override("font_color", _color_text)
	btn.add_theme_color_override("font_hover_color", Color.WHITE)
	btn.add_theme_color_override("font_pressed_color", Color.WHITE)

func _start_session(mode: int) -> void:
	_current_session_id = TrainingRecordManager.generate_session_id()
	GameManager.start_session(mode)

func _on_session_started() -> void:
	_mode_selector.visible = false
	_phase_container_ref.visible = true
	_load_phase_scene(GameManager.current_phase)
	_update_top_bar()

func _on_session_ended() -> void:
	pass

func _on_phase_changed(new_phase: int) -> void:
	_load_phase_scene(new_phase)
	_update_top_bar()

func _load_phase_scene(phase: int) -> void:
	if _current_phase_scene:
		_current_phase_scene.queue_free()
		_current_phase_scene = null

	var scene_path: String = ""
	match phase:
		GameManager.Phase.PHOTO_VERIFICATION:
			scene_path = "res://scenes/photo_verification/photo_verification.tscn"
		GameManager.Phase.LABEL_SELECTION:
			scene_path = "res://scenes/label_selection/label_selection.tscn"
		GameManager.Phase.ADDRESS_SORTING:
			scene_path = "res://scenes/address_sorting/address_sorting.tscn"
		GameManager.Phase.TRAJECTORY_REVIEW:
			scene_path = "res://scenes/trajectory_review/trajectory_review.tscn"

	if scene_path != "":
		var scene: PackedScene = load(scene_path)
		if scene:
			_current_phase_scene = scene.instantiate()
			_phase_container_ref.add_child(_current_phase_scene)

func _update_top_bar() -> void:
	_top_bar_score.text = "总分: %d" % GameManager.total_score
	_top_bar_phase.text = "当前阶段: %s" % GameManager.get_phase_name(GameManager.current_phase)
	var phase_idx: int = GameManager.current_phase + 1
	_top_bar_progress.text = "阶段进度: %d / 4" % phase_idx

func _on_score_updated(total_score: int) -> void:
	_top_bar_score.text = "总分: %d" % total_score

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu/main_menu.tscn")
