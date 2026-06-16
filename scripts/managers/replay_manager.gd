extends Node
class_name ReplayManager

const MAX_RECENT_REPLAYS: int = 10
const MAX_ASSESSMENT_REPLAYS: int = 3
const SAVE_PATH: String = "user://replays.json"

var replays: Array[Dictionary] = []
var assessment_replays: Array[Dictionary] = []

func _ready():
	load_replays()

func load_replays():
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var data: Dictionary = JSON.parse_string(file.get_as_text())
		file.close()
		replays = data.get("replays", [])
		assessment_replays = data.get("assessment_replays", [])
	_trim_replays()

func save_replays():
	var data: Dictionary = {
		"replays": replays,
		"assessment_replays": assessment_replays
	}
	var file: FileAccess = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()

func _trim_replays():
	while replays.size() > MAX_RECENT_REPLAYS:
		replays.remove_at(0)
	while assessment_replays.size() > MAX_ASSESSMENT_REPLAYS:
		assessment_replays.remove_at(0)

static func save_replay(level_id: String, result: Dictionary):
	var replay_data: Dictionary = result.duplicate(true)
	replay_data["level_id"] = level_id
	replay_data["timestamp"] = Time.get_datetime_string_from_system()
	
	var instance: ReplayManager = _get_instance()
	instance.replays.append(replay_data)
	instance._check_and_save_assessment_replay(replay_data)
	instance._trim_replays()
	instance.save_replays()

func _check_and_save_assessment_replay(replay_data: Dictionary):
	var failed_patients: Array = replay_data.get("failed_patients", [])
	for patient_data in failed_patients:
		var assessment: Dictionary = patient_data.get("documents", {}).get(
			Patient.DocumentType.ASSESSMENT_SCALE, {})
		if assessment:
			var assessment_replay: Dictionary = {
				"timestamp": replay_data.get("timestamp", ""),
				"level_name": replay_data.get("level_name", ""),
				"patient": {
					"name": patient_data.get("name", ""),
					"age": patient_data.get("age", 0),
					"correct_level": patient_data.get("correct_level", -1),
					"selected_level": patient_data.get("selected_level", -1)
				},
				"assessment": assessment,
				"training_prescription": patient_data.get("training_prescription", {})
			}
			assessment_replays.append(assessment_replay)

func get_recent_replays(count: int = 5) -> Array[Dictionary]:
	var recent: Array[Dictionary] = []
	var start: int = max(0, replays.size() - count)
	for i in range(start, replays.size()):
		recent.append(replays[i])
	recent.reverse()
	return recent

func get_recent_failures(count: int = 3) -> Array[Dictionary]:
	var failures: Array[Dictionary] = []
	for i in range(replays.size() - 1, -1, -1):
		if not replays[i].get("passed", false):
			failures.append(replays[i])
			if failures.size() >= count:
				break
	return failures

func get_assessment_replays() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for i in range(assessment_replays.size() - 1, -1, -1):
		result.append(assessment_replays[i])
	return result

func get_replay_by_index(index: int) -> Dictionary:
	if index >= 0 and index < replays.size():
		return replays[index]
	return {}

func clear_all_replays():
	replays.clear()
	assessment_replays.clear()
	save_replays()

func get_wrong_steps_from_replay(replay_data: Dictionary) -> Array[Dictionary]:
	var wrong_steps: Array[Dictionary] = []
	var failed_patients: Array = replay_data.get("failed_patients", [])
	for patient_data in failed_patients:
		var step: Dictionary = {
			"patient_name": patient_data.get("name", ""),
			"patient_age": patient_data.get("age", 0),
			"selected_level": patient_data.get("selected_level", -1),
			"correct_level": patient_data.get("correct_level", -1),
			"is_critical": patient_data.get("is_critical", false),
			"training_prescription": patient_data.get("training_prescription", {}),
			"error_cause": _analyze_error_cause(patient_data)
		}
		wrong_steps.append(step)
	return wrong_steps

func _analyze_error_cause(patient_data: Dictionary) -> Dictionary:
	var cause: Dictionary = {
		"type": "",
		"description": "",
		"documents_checked": [],
		"key_indicators_missed": []
	}
	
	var correct_level: int = patient_data.get("correct_level", -1)
	var selected_level: int = patient_data.get("selected_level", -1)
	
	if selected_level == -1:
		cause["type"] = "超时未处理"
		cause["description"] = "未能在规定时间内完成患者分级"
	else:
		var level_diff: int = abs(correct_level - selected_level)
		if level_diff == 1:
			cause["type"] = "分级偏差"
			cause["description"] = "分级判断有轻度偏差"
		elif level_diff >= 2:
			cause["type"] = "严重分级错误"
			cause["description"] = "分级判断存在严重偏差，可能导致医疗风险"
	
	var documents: Dictionary = patient_data.get("documents", {})
	if documents.has(Patient.DocumentType.NURSING_LOG):
		var nursing_log: Dictionary = documents[Patient.DocumentType.NURSING_LOG]
		cause["key_indicators_missed"].append_array(
			nursing_log.get("key_indicators", []))
	
	var settlement: Dictionary = documents.get(Patient.DocumentType.SETTLEMENT_DETAIL, {})
	var risk_points: Array = settlement.get("risk_points", [])
	if risk_points.size() > 0:
		cause["insurance_risk"] = risk_points
	
	return cause

func get_training_prescription_errors(replay_data: Dictionary) -> Array[Dictionary]:
	var errors: Array[Dictionary] = []
	var failed_patients: Array = replay_data.get("failed_patients", [])
	for patient_data in failed_patients:
		var prescription: Dictionary = patient_data.get("training_prescription", {})
		var settlement: Dictionary = patient_data.get("documents", {}).get(
			Patient.DocumentType.SETTLEMENT_DETAIL, {})
		
		if prescription and settlement:
			var error_info: Dictionary = {
				"patient_name": patient_data.get("name", ""),
				"prescription_code": prescription.get("project_code", ""),
				"prescribed_items": prescription.get("items", []),
				"common_errors": prescription.get("common_errors", []),
				"settlement_items": [],
				"mismatch_analysis": []
			}
			
			var items: Array = settlement.get("items", [])
			for item in items:
				error_info["settlement_items"].append({
					"name": item.get("name", ""),
					"amount": item.get("amount", 0),
					"insurance_covered": item.get("insurance_covered", true)
				})
				if not item.get("insurance_covered", true):
					error_info["mismatch_analysis"].append(
						"项目 '%s' 不在医保报销范围内" % item.get("name", "")
					)
			
			errors.append(error_info)
	return errors

static func _get_instance() -> ReplayManager:
	if Globals and Globals.replay_manager:
		return Globals.replay_manager
	return null
