extends Node
class_name GameManager

signal level_started(level_data: LevelData)
signal level_completed(result: Dictionary)
signal level_failed(reason: String, result: Dictionary)
signal patient_arrived(patient: Patient)
signal patient_completed(patient: Patient, is_correct: bool)
signal insurance_rejection_warning(patient: Patient, reason: String)
signal game_paused()
signal game_resumed()

var current_level: LevelData = null
var current_patients: Array[Patient] = []
var completed_patients: Array[Patient] = []
var pending_patients: Array[Patient] = []
var failed_patients: Array[Patient] = []

var level_start_time: float = 0.0
var level_elapsed_time: float = 0.0
var is_level_active: bool = false
var is_paused: bool = false

var total_correct: int = 0
var total_wrong: int = 0
var total_insurance_rejections: int = 0

var current_time: float = 0.0
var patient_spawn_interval: float = 30.0
var last_spawn_time: float = 0.0

var _level_data_cache: Array[LevelData] = []

func _ready():
	load_all_levels()

func load_all_levels() -> Array[LevelData]:
	_level_data_cache.clear()
	var file: FileAccess = FileAccess.open("res://assets/data/levels.json", FileAccess.READ)
	if file:
		var json_data: Dictionary = JSON.parse_string(file.get_as_text())
		file.close()
		var levels_array: Array = json_data.get("levels", [])
		for level_dict in levels_array:
			var level_data: LevelData = LevelData.new(level_dict)
			_level_data_cache.append(level_data)
	return _level_data_cache

func get_all_levels() -> Array[LevelData]:
	if _level_data_cache.is_empty():
		load_all_levels()
	return _level_data_cache

func get_level_by_id(level_id: String) -> LevelData:
	for level in _level_data_cache:
		if level.id == level_id:
			return level
	return null

func start_level(level_id: String) -> bool:
	var level_data: LevelData = get_level_by_id(level_id)
	if not level_data:
		return false
	return start_level_with_data(level_data)

func start_level_with_data(level_data: LevelData) -> bool:
	current_level = level_data
	current_patients.clear()
	completed_patients.clear()
	pending_patients.clear()
	failed_patients.clear()
	total_correct = 0
	total_wrong = 0
	total_insurance_rejections = 0
	level_start_time = Time.get_ticks_msec() / 1000.0
	level_elapsed_time = 0.0
	is_level_active = true
	is_paused = false
	last_spawn_time = 0.0
	
	for patient_data in level_data.patient_data_list:
		var patient: Patient = Patient.new(patient_data)
		pending_patients.append(patient)
	
	randomize()
	pending_patients.shuffle()
	
	emit_signal("level_started", current_level)
	
	if not pending_patients.is_empty():
		spawn_next_patient()
	
	return true

func spawn_next_patient():
	if pending_patients.is_empty():
		return
	var patient: Patient = pending_patients.pop_front()
	patient.arrival_time = Time.get_ticks_msec() / 1000.0
	current_patients.append(patient)
	emit_signal("patient_arrived", patient)

func _process(delta: float):
	if not is_level_active or is_paused:
		return
	
	current_time = Time.get_ticks_msec() / 1000.0
	level_elapsed_time = current_time - level_start_time
	
	if level_elapsed_time >= current_level.time_limit:
		complete_level()
		return
	
	if not pending_patients.is_empty():
		var time_since_last_spawn: float = level_elapsed_time - last_spawn_time
		var spawn_interval: float = current_level.time_limit / (current_level.patient_count + 1)
		if time_since_last_spawn >= spawn_interval:
			spawn_next_patient()
			last_spawn_time = level_elapsed_time
	
	check_patient_timeouts()
	check_insurance_warnings()

func check_patient_timeouts():
	var timed_out_patients: Array[Patient] = []
	for patient in current_patients:
		if not patient.is_triage_completed:
			var remaining: float = patient.get_remaining_time(current_time)
			if remaining <= 0:
				timed_out_patients.append(patient)
	
	for patient in timed_out_patients:
		handle_patient_timeout(patient)

func handle_patient_timeout(patient: Patient):
	patient.complete_triage(-1)
	total_wrong += 1
	failed_patients.append(patient)
	current_patients.erase(patient)
	completed_patients.append(patient)
	emit_signal("patient_completed", patient, false)
	check_level_completion()

func check_insurance_warnings():
	for patient in current_patients:
		if not patient.is_triage_completed and patient.should_show_warning(current_time):
			var settlement: Dictionary = patient.get_document(Patient.DocumentType.SETTLEMENT_DETAIL)
			var risk_points: Array = settlement.get("risk_points", [])
			var warning_reason: String = "医保拒付风险："
			if risk_points.size() > 0:
				warning_reason += risk_points[0]
			else:
				warning_reason += "请仔细核对结算明细"
			emit_signal("insurance_rejection_warning", patient, warning_reason)

func triage_patient(patient: Patient, selected_level: int) -> bool:
	if patient.is_triage_completed:
		return false
	
	var is_correct: bool = patient.complete_triage(selected_level)
	current_patients.erase(patient)
	completed_patients.append(patient)
	
	if is_correct:
		total_correct += 1
	else:
		total_wrong += 1
		failed_patients.append(patient)
		
		var settlement: Dictionary = patient.get_document(Patient.DocumentType.SETTLEMENT_DETAIL)
		var items: Array = settlement.get("items", [])
		for item in items:
			if not item.get("insurance_covered", true):
				total_insurance_rejections += 1
				break
	
	emit_signal("patient_completed", patient, is_correct)
	check_level_completion()
	return is_correct

func check_level_completion():
	var all_spawned: bool = pending_patients.is_empty()
	var all_completed: bool = current_patients.is_empty()
	if all_spawned and all_completed:
		complete_level()

func complete_level():
	is_level_active = false
	var result: Dictionary = calculate_level_result()
	var passed: bool = result.get("passed", false)
	if passed:
		emit_signal("level_completed", result)
	else:
		emit_signal("level_failed", "未达到通过标准", result)
	ReplayManager.save_replay(current_level.id, result)
	StatisticsManager.record_session(result)

func calculate_level_result() -> Dictionary:
	var total_processed: int = completed_patients.size()
	var accuracy: float = 0.0
	if total_processed > 0:
		accuracy = float(total_correct) / float(total_processed)
	
	var score: int = int(accuracy * 100)
	var passed: bool = score >= current_level.required_score and accuracy >= current_level.target_accuracy
	
	var result: Dictionary = {
		"level_id": current_level.id,
		"level_name": current_level.name,
		"passed": passed,
		"score": score,
		"accuracy": accuracy,
		"total_patients": current_level.patient_count,
		"processed_patients": total_processed,
		"correct_count": total_correct,
		"wrong_count": total_wrong,
		"insurance_rejections": total_insurance_rejections,
		"time_used": level_elapsed_time,
		"time_limit": current_level.time_limit,
		"completed_patients": [],
		"failed_patients": [],
		"timestamp": Time.get_datetime_string_from_system()
	}
	
	for patient in completed_patients:
		result["completed_patients"].append(_patient_to_dict(patient))
	
	for patient in failed_patients:
		result["failed_patients"].append(_patient_to_dict(patient))
	
	return result

func _patient_to_dict(patient: Patient) -> Dictionary:
	return {
		"id": patient.id,
		"name": patient.name,
		"age": patient.age,
		"gender": patient.gender,
		"correct_level": patient.correct_triage_level,
		"selected_level": patient.selected_triage_level,
		"is_correct": patient.selected_triage_level == patient.correct_triage_level,
		"is_critical": patient.is_critical,
		"training_prescription": patient.training_prescription,
		"documents": patient.documents
	}

func pause_game():
	if is_level_active and not is_paused:
		is_paused = true
		emit_signal("game_paused")

func resume_game():
	if is_paused:
		is_paused = false
		emit_signal("game_resumed")

func cancel_level():
	is_level_active = false
	is_paused = false
