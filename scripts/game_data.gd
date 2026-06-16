extends Node

enum PatientStatus { SCHEDULED, ARRIVED, PROCESSING, COMPLETED, NO_SHOW }

enum TaskType { IMAGING, BILLING, RECORD }

enum ErrorCategory { IMAGING_MISMATCH, BILLING_ERROR, RECORD_MISREAD, MISSED_NO_SHOW, SCHEDULING_ERROR }

var current_round: int = 0
var patients_processed: int = 0
var patients_completed: int = 0
var patients_no_show: int = 0
var total_errors: int = 0
var round_start_time: float = 0.0
var round_elapsed_time: float = 0.0
var is_round_active: bool = false

var error_categories: Dictionary = {
	ErrorCategory.IMAGING_MISMATCH: 0,
	ErrorCategory.BILLING_ERROR: 0,
	ErrorCategory.RECORD_MISREAD: 0,
	ErrorCategory.MISSED_NO_SHOW: 0,
	ErrorCategory.SCHEDULING_ERROR: 0,
}

signal patient_status_changed(patient_id: String, new_status: PatientStatus)
signal no_show_warning(patient_id: String, urgency: float)
signal error_made(category: ErrorCategory, details: String)
signal round_completed()
signal decision_recorded(patient_id: String, task_type: TaskType, correct: bool, response_time: float)

const PATIENTS_PER_ROUND: int = 8
const NO_SHOW_WARNING_TIME: float = 3.0
const NO_SHOW_BASE_CHANCE: float = 0.2

var _patient_queue: Array = []
var _current_patient_index: int = 0
var _decision_timestamps: Dictionary = {}
var _last_decision_time: float = 0.0

func start_round() -> void:
	current_round += 1
	patients_processed = 0
	patients_completed = 0
	patients_no_show = 0
	total_errors = 0
	error_categories = {
		ErrorCategory.IMAGING_MISMATCH: 0,
		ErrorCategory.BILLING_ERROR: 0,
		ErrorCategory.RECORD_MISREAD: 0,
		ErrorCategory.MISSED_NO_SHOW: 0,
		ErrorCategory.SCHEDULING_ERROR: 0,
	}
	_patient_queue.clear()
	_current_patient_index = 0
	_decision_timestamps.clear()
	_last_decision_time = 0.0
	_generate_patient_queue()
	round_start_time = Time.get_ticks_msec() / 1000.0
	is_round_active = true

func _process(_delta: float) -> void:
	if is_round_active:
		round_elapsed_time = Time.get_ticks_msec() / 1000.0 - round_start_time
		_check_no_show_warnings()

func _generate_patient_queue() -> void:
	var rng = RandomNumberGenerator.new()
	rng.seed = Time.get_ticks_msec()
	for i in PATIENTS_PER_ROUND:
		var patient_id = "P%03d" % (i + 1)
		var is_no_show_risk = rng.randf() < NO_SHOW_BASE_CHANCE
		var no_show_threshold = rng.randf_range(8.0, 20.0) if is_no_show_risk else 999.0
		var patient = {
			"id": patient_id,
			"name": _random_name(rng),
			"status": PatientStatus.SCHEDULED,
			"no_show_risk": is_no_show_risk,
			"no_show_threshold": no_show_threshold,
			"wait_time": 0.0,
			"imaging": _generate_imaging(rng),
			"billing": _generate_billing(rng),
			"record": _generate_record(rng),
			"tasks_completed": {TaskType.IMAGING: false, TaskType.BILLING: false, TaskType.RECORD: false},
		}
		_patient_queue.append(patient)

func _random_name(rng: RandomNumberGenerator) -> String:
	var surnames = ["张", "李", "王", "刘", "陈", "杨", "赵", "黄", "周", "吴"]
	var given_names = ["伟", "芳", "秀英", "明", "丽", "强", "静", "磊", "洋", "勇"]
	return surnames[rng.randi() % surnames.size()] + given_names[rng.randi() % given_names.size()]

func _generate_imaging(rng: RandomNumberGenerator) -> Dictionary:
	var types = ["根尖片", "全景片", "CBCT", "咬翼片"]
	var regions = ["上颌", "下颌", "前牙区", "后牙区"]
	var findings = ["龋齿", "根尖周炎", "牙周炎", "阻生齿", "正常"]
	return {
		"type": types[rng.randi() % types.size()],
		"region": regions[rng.randi() % regions.size()],
		"finding": findings[rng.randi() % findings.size()],
		"has_trap": rng.randf() < 0.3,
		"trap_finding": "正常",
		"image_id": "img_%d" % rng.randi(),
	}

func _generate_billing(rng: RandomNumberGenerator) -> Dictionary:
	var items = ["根管治疗", "补牙", "洗牙", "拔牙", "种植牙", "正畸"]
	var base_prices = [800, 300, 200, 150, 5000, 8000]
	var idx = rng.randi() % items.size()
	var has_error = rng.randf() < 0.3
	var wrong_multiplier = [0.5, 1.5, 2.0][rng.randi() % 3] if has_error else 1.0
	return {
		"item": items[idx],
		"correct_price": base_prices[idx],
		"displayed_price": int(base_prices[idx] * wrong_multiplier) if has_error else base_prices[idx],
		"has_error": has_error,
		"insurance_covered": rng.randf() < 0.5,
		"discount": rng.randf() < 0.2,
	}

func _generate_record(rng: RandomNumberGenerator) -> Dictionary:
	var conditions = ["深龋", "牙髓炎", "根尖周炎", "牙周病", "阻生齿"]
	var treatments = ["根管治疗", "充填修复", "牙周刮治", "拔除", "冠修复"]
	var idx = rng.randi() % conditions.size()
	var has_mismatch = rng.randf() < 0.3
	var wrong_treatment_idx = (idx + rng.randi_range(1, treatments.size() - 1)) % treatments.size() if has_mismatch else idx
	return {
		"condition": conditions[idx],
		"correct_treatment": treatments[idx],
		"displayed_treatment": treatments[wrong_treatment_idx] if has_mismatch else treatments[idx],
		"has_mismatch": has_mismatch,
		"allergy": "青霉素" if rng.randf() < 0.15 else "",
		"last_visit": "2026-%02d-%02d" % [rng.randi_range(1, 5), rng.randi_range(1, 28)],
		"revisit_scheduled": rng.randf() < 0.6,
		"revisit_interval_days": rng.randi_range(7, 90),
	}

func _check_no_show_warnings() -> void:
	for patient in _patient_queue:
		if patient["status"] != PatientStatus.SCHEDULED:
			continue
		patient["wait_time"] = round_elapsed_time
		if patient["no_show_risk"]:
			var time_to_no_show = patient["no_show_threshold"] - patient["wait_time"]
			if time_to_no_show <= NO_SHOW_WARNING_TIME and time_to_no_show > 0:
				var urgency = 1.0 - (time_to_no_show / NO_SHOW_WARNING_TIME)
				no_show_warning.emit(patient["id"], urgency)
			elif time_to_no_show <= 0:
				patient["status"] = PatientStatus.NO_SHOW
				patients_no_show += 1
				patient_status_changed.emit(patient["id"], PatientStatus.NO_SHOW)
				error_made.emit(ErrorCategory.MISSED_NO_SHOW, "%s 爽约" % patient["id"])
				error_categories[ErrorCategory.MISSED_NO_SHOW] += 1
				total_errors += 1
				_check_round_complete()

func get_current_patient() -> Dictionary:
	if _current_patient_index < _patient_queue.size():
		return _patient_queue[_current_patient_index]
	return {}

func get_patient_by_id(pid: String) -> Dictionary:
	for p in _patient_queue:
		if p["id"] == pid:
			return p
	return {}

func advance_to_next_patient() -> void:
	_current_patient_index += 1
	if _current_patient_index >= _patient_queue.size():
		_check_round_complete()

func process_decision(patient_id: String, task_type: TaskType, choice_correct: bool) -> void:
	var now = Time.get_ticks_msec() / 1000.0
	var response_time = now - _last_decision_time if _last_decision_time > 0 else 0.0
	_last_decision_time = now
	
	if not _decision_timestamps.has(patient_id):
		_decision_timestamps[patient_id] = []
	_decision_timestamps[patient_id].append({
		"task_type": task_type,
		"response_time": response_time,
		"correct": choice_correct,
		"timestamp": now,
	})
	
	if not choice_correct:
		var cat = _task_type_to_error_category(task_type)
		error_categories[cat] += 1
		total_errors += 1
		error_made.emit(cat, "%s %s 错误" % [patient_id, TaskType.keys()[task_type]])
	
	decision_recorded.emit(patient_id, task_type, choice_correct, response_time)
	
	var patient = get_patient_by_id(patient_id)
	if patient.size() > 0:
		patient["tasks_completed"][task_type] = true
		if patient["tasks_completed"].values().all(func(v): return v):
			patient["status"] = PatientStatus.COMPLETED
			patients_completed += 1
			patient_status_changed.emit(patient_id, PatientStatus.COMPLETED)

func complete_patient_tasks(patient_id: String) -> void:
	var patient = get_patient_by_id(patient_id)
	if patient.size() > 0 and patient["status"] == PatientStatus.PROCESSING:
		var all_done = patient["tasks_completed"].values().all(func(v): return v)
		if all_done:
			patient["status"] = PatientStatus.COMPLETED
			patients_completed += 1
			patient_status_changed.emit(patient_id, PatientStatus.COMPLETED)
			patients_processed += 1
			advance_to_next_patient()
			_check_round_complete()

func get_hesitation_points(patient_id: String) -> Array:
	var points = []
	if not _decision_timestamps.has(patient_id):
		return points
	for entry in _decision_timestamps[patient_id]:
		if entry["response_time"] > 2.0 or not entry["correct"]:
			points.append(entry)
	return points

func _task_type_to_error_category(task_type: TaskType) -> ErrorCategory:
	match task_type:
		TaskType.IMAGING: return ErrorCategory.IMAGING_MISMATCH
		TaskType.BILLING: return ErrorCategory.BILLING_ERROR
		TaskType.RECORD: return ErrorCategory.RECORD_MISREAD
		_: return ErrorCategory.SCHEDULING_ERROR

func _check_round_complete() -> void:
	var active_count = 0
	for p in _patient_queue:
		if p["status"] == PatientStatus.SCHEDULED or p["status"] == PatientStatus.PROCESSING or p["status"] == PatientStatus.ARRIVED:
			active_count += 1
	if active_count == 0:
		is_round_active = false
		round_completed.emit()

func get_revisit_rate() -> float:
	if patients_processed + patients_no_show == 0:
		return 0.0
	return float(patients_completed) / float(patients_processed + patients_no_show)

func get_round_summary() -> Dictionary:
	return {
		"round": current_round,
		"patients_completed": patients_completed,
		"patients_no_show": patients_no_show,
		"total_errors": total_errors,
		"revisit_rate": get_revisit_rate(),
		"elapsed_time": round_elapsed_time,
		"error_categories": error_categories.duplicate(),
	}
