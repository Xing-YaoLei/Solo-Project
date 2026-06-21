extends Control

enum PhaseUI { OBSERVE, EVIDENCE, DISPATCH, SCORE, TIMEOUT }

@onready var _observe_panel: PanelContainer = $PhaseContainer/ObservPhase
@onready var _evidence_panel: Control = $PhaseContainer/EvidencePhase
@onready var _dispatch_panel: Control = $PhaseContainer/DispatchPhase
@onready var _score_panel: PanelContainer = $PhaseContainer/ScorePhase
@onready var _timeout_panel: PanelContainer = $PhaseContainer/TimeoutPhase

@onready var _observe_desc: Label = $PhaseContainer/ObservPhase/VBox/DescLabel
@onready var _observe_next: Button = $PhaseContainer/ObservPhase/VBox/NextButton

@onready var _ev_next: Button = $PhaseContainer/EvidencePhase/NextButton

@onready var _timer_label: Label = $PhaseContainer/DispatchPhase/TimerLabel
@onready var _timer_bar: ProgressBar = $PhaseContainer/DispatchPhase/TimerBar

@onready var _score_label: Label = $PhaseContainer/ScorePhase/VBox/ScoreLabel
@onready var _closure_label: Label = $PhaseContainer/ScorePhase/VBox/ClosureLabel
@onready var _method_label: Label = $PhaseContainer/ScorePhase/VBox/MethodLabel
@onready var _review_btn: Button = $PhaseContainer/ScorePhase/VBox/ReviewButton
@onready var _home_btn: Button = $PhaseContainer/ScorePhase/VBox/HomeButton

@onready var _timeout_info: Label = $PhaseContainer/TimeoutPhase/VBox/TimeoutInfo
@onready var _retry_confirm: Button = $PhaseContainer/TimeoutPhase/VBox/RetryConfirm

@onready var _phase_container: Control = $PhaseContainer
@onready var _level_title: Label = $TopBar/LevelTitle

var _current_ui: PhaseUI = PhaseUI.OBSERVE
var _level_data: Dictionary = {}
var _all_evidence_viewed := false
var _tag_panel_instance: Node = null
var _evidence_panel_instance: Node = null
var _method_panel_instance: Node = null
var _retry_method_panel_instance: Node = null

func _ready() -> void:
	_level_data = GameManager.get_complaint_data()
	_level_title.text = _level_data.get("title", "关卡")
	GameManager.phase_changed.connect(_on_phase_changed)
	GameManager.timer_tick.connect(_on_timer_tick)
	GameManager.timeout_triggered.connect(_on_timeout)
	GameManager.score_calculated.connect(_on_score_calculated)
	_show_phase(PhaseUI.OBSERVE)

func _show_phase(phase: PhaseUI) -> void:
	_current_ui = phase
	for child in _phase_container.get_children():
		child.visible = false
	match phase:
		PhaseUI.OBSERVE:
			_observe_panel.visible = true
			_observe_desc.text = _level_data.get("description", "")
			if _tag_panel_instance == null:
				_tag_panel_instance = load("res://scenes/game_level/tag_panel.tscn").instantiate()
				$PhaseContainer/ObservPhase/VBox/TagContainer.add_child(_tag_panel_instance)
			_tag_panel_instance.setup(PackedStringArray(_level_data.get("tags", [])))
			_observe_next.grab_focus()
		PhaseUI.EVIDENCE:
			_evidence_panel.visible = true
			if _evidence_panel_instance == null:
				_evidence_panel_instance = load("res://scenes/game_level/evidence_panel.tscn").instantiate()
				$PhaseContainer/EvidencePhase/EvidenceSlot.add_child(_evidence_panel_instance)
			_evidence_panel_instance.setup(GameManager.get_evidence_attachments())
			if not _evidence_panel_instance.all_evidence_viewed.is_connected(_on_all_evidence_viewed):
				_evidence_panel_instance.all_evidence_viewed.connect(_on_all_evidence_viewed)
			_ev_next.grab_focus()
		PhaseUI.DISPATCH:
			_dispatch_panel.visible = true
			if _method_panel_instance == null:
				_method_panel_instance = load("res://scenes/game_level/method_panel.tscn").instantiate()
				$PhaseContainer/DispatchPhase/MethodSlot.add_child(_method_panel_instance)
			_method_panel_instance.setup(PackedStringArray(_level_data.get("methods", [])))
			if not _method_panel_instance.confirmed.is_connected(_on_method_confirmed):
				_method_panel_instance.confirmed.connect(_on_method_confirmed)
			GameManager.set_phase(GameManager.Phase.PROCESS_EVIDENCE)
		PhaseUI.SCORE:
			_score_panel.visible = true
			_review_btn.grab_focus()
		PhaseUI.TIMEOUT:
			_timeout_panel.visible = true
			if _retry_method_panel_instance == null:
				_retry_method_panel_instance = load("res://scenes/game_level/method_panel.tscn").instantiate()
				$PhaseContainer/TimeoutPhase/VBox/RetryMethodSlot.add_child(_retry_method_panel_instance)
			_retry_method_panel_instance.setup(PackedStringArray(_level_data.get("methods", [])))
			if not _retry_method_panel_instance.confirmed.is_connected(_on_retry_confirmed):
				_retry_method_panel_instance.confirmed.connect(_on_retry_confirmed)
			_retry_confirm.disabled = false
			_timeout_info.text = "处理超时！（已超时 %d 次）请换一种处理方式" % GameManager.get_timeout_count()

func _on_all_evidence_viewed() -> void:
	_all_evidence_viewed = true

func _on_phase_changed(phase_name: StringName) -> void:
	if phase_name == &"score":
		_show_phase(PhaseUI.SCORE)

func _on_timer_tick(remaining: float) -> void:
	_timer_label.text = "剩余: %.1f秒" % remaining
	var limit := _level_data.get("time_limit", 60.0)
	_timer_bar.value = (remaining / limit) * 100.0

func _on_timeout() -> void:
	_show_phase(PhaseUI.TIMEOUT)

func _on_score_calculated(score: float) -> void:
	_score_label.text = "评分: %.1f" % score
	_closure_label.text = "关闭时长: %.1f秒" % GameManager.get_closure_time()
	_method_label.text = "处理方式: %s" % GameManager.get_selected_method()
	StatsManager.record_level(
		GameManager.current_level_id,
		GameManager.get_closure_time(),
		score,
		GameManager.get_timeout_count(),
		GameManager.get_selected_method()
	)

func _on_observe_next_pressed() -> void:
	_show_phase(PhaseUI.EVIDENCE)

func _on_evidence_next_pressed() -> void:
	_show_phase(PhaseUI.DISPATCH)

func _on_method_confirmed() -> void:
	GameManager.select_method(_method_panel_instance.get_selected_method())
	GameManager.complete_processing()

func _on_retry_confirmed() -> void:
	var method := _retry_method_panel_instance.get_selected_method()
	GameManager.retry_with_new_method(method)
	_show_phase(PhaseUI.DISPATCH)

func _on_review_button_pressed() -> void:
	SceneManager.goto_scene("res://scenes/review/review_page.tscn")

func _on_home_button_pressed() -> void:
	SceneManager.goto_scene("res://scenes/main_menu/main_menu.tscn")

func _input(event: InputEvent) -> void:
	if event.is_action_pressed("ui_cancel"):
		match _current_ui:
			PhaseUI.EVIDENCE:
				_show_phase(PhaseUI.OBSERVE)
			PhaseUI.DISPATCH:
				_show_phase(PhaseUI.EVIDENCE)
