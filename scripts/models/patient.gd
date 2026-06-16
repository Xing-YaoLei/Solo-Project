extends RefCounted
class_name Patient

enum TriageLevel { LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4 }
enum DocumentType { NURSING_LOG, SETTLEMENT_DETAIL, ASSESSMENT_SCALE }

var id: String
var name: String
var age: int
var gender: String
var correct_triage_level: TriageLevel
var is_triage_completed: bool = false
var selected_triage_level: TriageLevel = -1
var documents: Dictionary = {}
var arrival_time: float
var time_limit: float = 60.0
var has_warning_shown: bool = false
var is_critical: bool = false
var training_prescription: Dictionary = {}

func _init(patient_data: Dictionary):
	id = patient_data.get("id", "")
	name = patient_data.get("name", "")
	age = patient_data.get("age", 0)
	gender = patient_data.get("gender", "未知")
	correct_triage_level = patient_data.get("correct_triage_level", TriageLevel.LEVEL_4)
	time_limit = patient_data.get("time_limit", 60.0)
	is_critical = patient_data.get("is_critical", false)
	training_prescription = patient_data.get("training_prescription", {})
	
	var doc_data = patient_data.get("documents", {})
	for doc_type_str in doc_data:
		var doc_type: int = _parse_document_type(doc_type_str)
		documents[doc_type] = doc_data[doc_type_str]

func _parse_document_type(type_str: String) -> int:
	var normalized: String = type_str.to_upper()
	match normalized:
		"NURSING_LOG", "护理日志":
			return DocumentType.NURSING_LOG
		"SETTLEMENT_DETAIL", "结算明细":
			return DocumentType.SETTLEMENT_DETAIL
		"ASSESSMENT_SCALE", "评估量表":
			return DocumentType.ASSESSMENT_SCALE
		_:
			return DocumentType.NURSING_LOG

static func get_triage_level_name(level: int) -> String:
	match level:
		TriageLevel.LEVEL_1:
			return "I级 - 急危重症"
		TriageLevel.LEVEL_2:
			return "II级 - 急重症"
		TriageLevel.LEVEL_3:
			return "III级 - 急症"
		TriageLevel.LEVEL_4:
			return "IV级 - 非急症"
		_:
			return "未分级"

static func get_triage_level_color(level: int) -> Color:
	match level:
		TriageLevel.LEVEL_1:
			return Color(0.9, 0.1, 0.1, 1)
		TriageLevel.LEVEL_2:
			return Color(0.9, 0.5, 0.1, 1)
		TriageLevel.LEVEL_3:
			return Color(0.9, 0.8, 0.1, 1)
		TriageLevel.LEVEL_4:
			return Color(0.2, 0.8, 0.3, 1)
		_:
			return Color(0.5, 0.5, 0.5, 1)

func get_document(doc_type: int) -> Dictionary:
	return documents.get(doc_type, {})

func open_document(doc_type: int) -> Dictionary:
	return get_document(doc_type)

func complete_triage(selected_level: int) -> bool:
	is_triage_completed = true
	selected_triage_level = selected_level
	var is_correct: bool = selected_level == correct_triage_level
	return is_correct

func get_remaining_time(current_time: float) -> float:
	return max(0.0, time_limit - (current_time - arrival_time))

func should_show_warning(current_time: float) -> bool:
	if has_warning_shown:
		return false
	var remaining: float = get_remaining_time(current_time)
	if remaining <= 15.0 and remaining > 0:
		has_warning_shown = true
		return true
	return false

static func get_document_type_name(doc_type: int) -> String:
	match doc_type:
		DocumentType.NURSING_LOG:
			return "护理日志"
		DocumentType.SETTLEMENT_DETAIL:
			return "结算明细"
		DocumentType.ASSESSMENT_SCALE:
			return "评估量表"
		_:
			return "未知文档"
