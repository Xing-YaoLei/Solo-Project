extends Control

var _patient_decision_log: Array = []
var _current_patient_id: String = ""
var _last_decision_time: float = 0.0
var _warning_tween: Tween = null
var _transitioning: bool = false

@onready var timer_label: Label = %TimerLabel
@onready var patient_progress: Label = %PatientProgress
@onready var round_label: Label = %RoundLabel
@onready var imaging_panel: PanelContainer = %ImagingPanel
@onready var billing_panel: PanelContainer = %BillingPanel
@onready var record_panel: PanelContainer = %RecordPanel
@onready var finding_type: Label = %FindingType
@onready var finding_region: Label = %FindingRegion
@onready var finding_result: Label = %FindingResult
@onready var imaging_accept: Button = %ImagingAccept
@onready var imaging_reject: Button = %ImagingReject
@onready var billing_item: Label = %BillingItem
@onready var billing_price: Label = %BillingPrice
@onready var billing_insurance: Label = %BillingInsurance
@onready var billing_accept: Button = %BillingAccept
@onready var billing_reject: Button = %BillingReject
@onready var record_condition: Label = %RecordCondition
@onready var record_treatment: Label = %RecordTreatment
@onready var record_allergy: Label = %RecordAllergy
@onready var record_accept: Button = %RecordAccept
@onready var record_reject: Button = %RecordReject
@onready var patient_name_label: Label = %PatientName
@onready var patient_id_label: Label = %PatientID
@onready var no_show_warning: ColorRect = %NoShowWarning
@onready var warning_label: Label = %WarningLabel

func _ready() -> void:
	_setup_panel_styles()
	_connect_signals()
	_connect_buttons()
	no_show_warning.visible = false
	if not GameData.is_round_active:
		GameData.start_round()
	_show_patient()

func _process(_delta: float) -> void:
	if GameData.is_round_active and not _transitioning:
		_update_timer()

func _setup_panel_styles() -> void:
	for panel in [imaging_panel, billing_panel, record_panel]:
		var style = StyleBoxFlat.new()
		style.bg_color = Color.WHITE
		style.corner_radius_top_left = 8
		style.corner_radius_top_right = 8
		style.corner_radius_bottom_left = 8
		style.corner_radius_bottom_right = 8
		style.set_content_margin_all(16)
		panel.add_theme_stylebox_override("panel", style)
	_set_panel_label_colors(imaging_panel, Color(0.1, 0.1, 0.1))
	_set_panel_label_colors(billing_panel, Color(0.1, 0.1, 0.1))
	_set_panel_label_colors(record_panel, Color(0.1, 0.1, 0.1))

func _set_panel_label_colors(panel: PanelContainer, color: Color) -> void:
	var vbox = panel.get_child(0)
	for child in vbox.get_children():
		if child is Label:
			child.add_theme_color_override("font_color", color)
		elif child is HBoxContainer:
			for btn in child.get_children():
				if btn is Button:
					pass

func _connect_signals() -> void:
	GameData.patient_status_changed.connect(_on_patient_status_changed)
	GameData.no_show_warning.connect(_on_no_show_warning)
	GameData.error_made.connect(_on_error_made)
	GameData.round_completed.connect(_on_round_completed)
	GameData.decision_recorded.connect(_on_decision_recorded)

func _connect_buttons() -> void:
	imaging_accept.pressed.connect(_process_imaging.bind(true))
	imaging_reject.pressed.connect(_process_imaging.bind(false))
	billing_accept.pressed.connect(_process_billing.bind(true))
	billing_reject.pressed.connect(_process_billing.bind(false))
	record_accept.pressed.connect(_process_record.bind(true))
	record_reject.pressed.connect(_process_record.bind(false))

func _show_patient() -> void:
	if _transitioning:
		return
	var patient = GameData.get_current_patient()
	if patient.is_empty():
		_set_buttons_disabled(true)
		return
	_current_patient_id = patient["id"]
	_patient_decision_log.clear()
	_last_decision_time = Time.get_ticks_msec() / 1000.0
	patient["status"] = GameData.PatientStatus.PROCESSING
	patient_name_label.text = "姓名: " + patient["name"]
	patient_id_label.text = "编号: " + patient["id"]
	patient_progress.text = "患者 %d / %d" % [GameData._current_patient_index + 1, GameData.PATIENTS_PER_ROUND]
	round_label.text = "第 %d 轮" % GameData.current_round
	_display_imaging(patient["imaging"])
	_display_billing(patient["billing"])
	_display_record(patient["record"])
	_set_buttons_disabled(false)

func _display_imaging(data: Dictionary) -> void:
	finding_type.text = "类型: " + data["type"]
	finding_region.text = "部位: " + data["region"]
	finding_result.text = "结果: " + data["finding"]

func _display_billing(data: Dictionary) -> void:
	billing_item.text = "项目: " + data["item"]
	billing_price.text = "费用: ¥%d" % data["displayed_price"]
	billing_insurance.text = "医保: " + ("是" if data["insurance_covered"] else "否")

func _display_record(data: Dictionary) -> void:
	record_condition.text = "诊断: " + data["condition"]
	record_treatment.text = "治疗: " + data["displayed_treatment"]
	record_allergy.text = "过敏: " + (data["allergy"] if data["allergy"] != "" else "无")

func _process_imaging(accepted: bool) -> void:
	var patient = GameData.get_current_patient()
	if patient.is_empty():
		return
	var data = patient["imaging"]
	var correct = not accepted if data["has_trap"] else accepted
	_handle_decision(GameData.TaskType.IMAGING, correct, accepted)
	imaging_accept.disabled = true
	imaging_reject.disabled = true

func _process_billing(accepted: bool) -> void:
	var patient = GameData.get_current_patient()
	if patient.is_empty():
		return
	var data = patient["billing"]
	var correct = not accepted if data["has_error"] else accepted
	_handle_decision(GameData.TaskType.BILLING, correct, accepted)
	billing_accept.disabled = true
	billing_reject.disabled = true

func _process_record(accepted: bool) -> void:
	var patient = GameData.get_current_patient()
	if patient.is_empty():
		return
	var data = patient["record"]
	var correct = not accepted if data["has_mismatch"] else accepted
	_handle_decision(GameData.TaskType.RECORD, correct, accepted)
	record_accept.disabled = true
	record_reject.disabled = true

func _handle_decision(task_type: GameData.TaskType, correct: bool, accepted: bool) -> void:
	var now: float = Time.get_ticks_msec() / 1000.0
	var response_time: float = now - _last_decision_time if _last_decision_time > 0 else 0.0
	_last_decision_time = now
	GameData.process_decision(_current_patient_id, task_type, correct)
	_patient_decision_log.append({
		"task_type": task_type,
		"accepted": accepted,
		"correct": correct,
		"timestamp": now,
		"response_time": response_time,
		"patient_id": _current_patient_id,
	})
	if not correct and not _patient_decision_log.is_empty():
		var error_cat: int = _task_type_to_replay_category(task_type)
		var error_details: String = "%s %s 判定错误" % [_current_patient_id, GameData.TaskType.keys()[task_type]]
		ReplayManager.add_replay(_current_patient_id, _patient_decision_log.duplicate(true), error_cat, error_details)
	var patient = GameData.get_current_patient()
	if not patient.is_empty() and patient["tasks_completed"].values().all(func(v): return v):
		GameData.complete_patient_tasks(_current_patient_id)
		_advance_patient()

func _advance_patient() -> void:
	if _transitioning:
		return
	while true:
		var next_patient = GameData.get_current_patient()
		if next_patient.is_empty():
			_set_buttons_disabled(true)
			return
		if next_patient["status"] != GameData.PatientStatus.NO_SHOW:
			break
		GameData.advance_to_next_patient()
	_show_patient()

func _set_buttons_disabled(disabled: bool) -> void:
	imaging_accept.disabled = disabled
	imaging_reject.disabled = disabled
	billing_accept.disabled = disabled
	billing_reject.disabled = disabled
	record_accept.disabled = disabled
	record_reject.disabled = disabled

func _update_timer() -> void:
	var elapsed = GameData.round_elapsed_time
	var minutes = int(elapsed) / 60
	var seconds = int(elapsed) % 60
	timer_label.text = "时间: %d:%02d" % [minutes, seconds]

func _on_patient_status_changed(patient_id: String, new_status: int) -> void:
	if patient_id == _current_patient_id and new_status == GameData.PatientStatus.COMPLETED:
		patient_progress.text = "患者 %d / %d" % [GameData._current_patient_index + 1, GameData.PATIENTS_PER_ROUND]
	elif patient_id == _current_patient_id and new_status == GameData.PatientStatus.NO_SHOW:
		_advance_patient()

func _on_no_show_warning(patient_id: String, urgency: float) -> void:
	no_show_warning.visible = true
	warning_label.text = "⚠ 爽约预警: %s" % patient_id
	var alpha = 0.3 + urgency * 0.4
	no_show_warning.color = Color(1.0, 0.0, 0.0, alpha)
	if _warning_tween:
		_warning_tween.kill()
	_warning_tween = create_tween()
	_warning_tween.set_loops(3)
	_warning_tween.tween_property(no_show_warning, "color:a", 0.1, 0.3)
	_warning_tween.tween_property(no_show_warning, "color:a", alpha, 0.3)
	_warning_tween.tween_callback(func(): no_show_warning.visible = false)

func _on_error_made(_category: int, _details: String) -> void:
	pass

func _on_round_completed() -> void:
	if _transitioning:
		return
	_transitioning = true
	_set_buttons_disabled(true)
	var summary = GameData.get_round_summary()
	StatsManager.record_round(summary)
	get_tree().change_scene_to_file("res://scenes/settlement.tscn")

func _on_decision_recorded(_patient_id: String, _task_type: int, _correct: bool, _response_time: float) -> void:
	pass

func _task_type_to_replay_category(task_type: int) -> int:
	match task_type:
		GameData.TaskType.IMAGING: return GameData.ErrorCategory.IMAGING_MISMATCH
		GameData.TaskType.BILLING: return GameData.ErrorCategory.BILLING_ERROR
		GameData.TaskType.RECORD: return GameData.ErrorCategory.RECORD_MISREAD
		_: return GameData.ErrorCategory.SCHEDULING_ERROR
