extends RefCounted
class_name LevelData

enum LevelDifficulty { BEGINNER, INTERMEDIATE, ADVANCED }

var id: String
var name: String
var description: String
var difficulty: LevelDifficulty
var patient_count: int
var time_limit: float
var target_accuracy: float
var patient_data_list: Array = []
var required_score: int

func _init(data: Dictionary):
	id = data.get("id", "")
	name = data.get("name", "")
	description = data.get("description", "")
	difficulty = _parse_difficulty(data.get("difficulty", "BEGINNER"))
	patient_count = data.get("patient_count", 3)
	time_limit = data.get("time_limit", 300.0)
	target_accuracy = data.get("target_accuracy", 0.7)
	patient_data_list = data.get("patients", [])
	required_score = data.get("required_score", 60)

func _parse_difficulty(diff_str: String) -> int:
	var normalized: String = diff_str.to_upper()
	match normalized:
		"BEGINNER", "入门级", "EASY":
			return LevelDifficulty.BEGINNER
		"INTERMEDIATE", "进阶级", "MEDIUM":
			return LevelDifficulty.INTERMEDIATE
		"ADVANCED", "专家级", "HARD":
			return LevelDifficulty.ADVANCED
		_:
			return LevelDifficulty.BEGINNER

func get_difficulty_name() -> String:
	match difficulty:
		LevelDifficulty.BEGINNER:
			return "入门级"
		LevelDifficulty.INTERMEDIATE:
			return "进阶级"
		LevelDifficulty.ADVANCED:
			return "专家级"
		_:
			return "未知"

func get_difficulty_color() -> Color:
	match difficulty:
		LevelDifficulty.BEGINNER:
			return Color(0.2, 0.8, 0.3, 1)
		LevelDifficulty.INTERMEDIATE:
			return Color(0.9, 0.7, 0.1, 1)
		LevelDifficulty.ADVANCED:
			return Color(0.9, 0.2, 0.2, 1)
		_:
			return Color(0.5, 0.5, 0.5, 1)
