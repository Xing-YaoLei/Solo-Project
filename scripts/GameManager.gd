extends Node

signal level_completed(level_id: String, score: int, stars: int, duration: float)
signal training_record_added(record: Dictionary)

const LEVEL_TYPES := {
	"textbook_identify": "教材清单识别",
	"approval_select": "审批记录选择",
	"course_sort": "课程目录排序",
	"classroom_allocate": "教室资源处理"
}

const SAVE_PATH := "user://training_data.json"

var levels_data: Dictionary = {}
var training_records: Array = []
var game_config: Dictionary = {}
var current_level: Dictionary = {}
var current_session: Dictionary = {}

func _ready() -> void:
	_load_default_config()
	_load_default_levels()
	load_data()

func _load_default_config() -> void:
	game_config = {
		"training_modes": [
			{"id": "practice", "name": "练习模式", "description": "无时间限制，可重复尝试"},
			{"id": "exam", "name": "考核模式", "description": "限时完成，记录成绩"},
			{"id": "challenge", "name": "挑战模式", "description": "高难度题目，奖励翻倍"}
		],
		"rewards": [
			{"id": "bronze", "name": "铜牌", "min_score": 60, "stars": 1},
			{"id": "silver", "name": "银牌", "min_score": 80, "stars": 2},
			{"id": "gold", "name": "金牌", "min_score": 95, "stars": 3}
		],
		"open_time": {
			"start": "08:00",
			"end": "22:00",
			"enabled": false
		},
		"current_mode": "practice"
	}

func _load_default_levels() -> void:
	levels_data = {
		"textbook_identify": [
			{
				"id": "tb_001",
				"name": "公共基础课教材识别",
				"difficulty": 1,
				"description": "根据课程清单识别需要订购的教材",
				"time_limit": 120,
				"courses": [
					{"name": "高等数学(上)", "teacher": "张教授", "students": 120, "has_textbook": true, "textbook_name": "高等数学（第七版）", "publisher": "同济大学出版社", "price": 45.0},
					{"name": "大学英语", "teacher": "李老师", "students": 90, "has_textbook": true, "textbook_name": "新视野大学英语", "publisher": "外语教学与研究出版社", "price": 38.0},
					{"name": "大学物理", "teacher": "王教授", "students": 80, "has_textbook": false},
					{"name": "计算机基础", "teacher": "陈老师", "students": 150, "has_textbook": true, "textbook_name": "大学计算机基础", "publisher": "清华大学出版社", "price": 42.0},
					{"name": "思想道德修养", "teacher": "刘老师", "students": 200, "has_textbook": true, "textbook_name": "思想道德与法治", "publisher": "高等教育出版社", "price": 25.0},
					{"name": "体育", "teacher": "赵老师", "students": 60, "has_textbook": false}
				],
				"expected_textbooks": 4,
				"evaluation_points": ["是否正确识别需要教材的课程", "是否正确排除不需要教材的课程", "教材信息准确性"]
			},
			{
				"id": "tb_002",
				"name": "专业核心课教材识别",
				"difficulty": 2,
				"description": "识别计算机专业核心课程所需教材",
				"time_limit": 150,
				"courses": [
					{"name": "数据结构", "teacher": "林教授", "students": 85, "has_textbook": true, "textbook_name": "数据结构(C语言版)", "publisher": "清华大学出版社", "price": 39.0},
					{"name": "操作系统", "teacher": "黄教授", "students": 75, "has_textbook": true, "textbook_name": "操作系统概念", "publisher": "机械工业出版社", "price": 59.0},
					{"name": "计算机网络", "teacher": "周老师", "students": 80, "has_textbook": true, "textbook_name": "计算机网络（自顶向下）", "publisher": "人民邮电出版社", "price": 55.0},
					{"name": "专业实习", "teacher": "吴老师", "students": 60, "has_textbook": false},
					{"name": "软件工程", "teacher": "郑教授", "students": 70, "has_textbook": true, "textbook_name": "软件工程导论", "publisher": "清华大学出版社", "price": 48.0},
					{"name": "数据库原理", "teacher": "孙老师", "students": 75, "has_textbook": true, "textbook_name": "数据库系统概论", "publisher": "高等教育出版社", "price": 46.0},
					{"name": "毕业设计", "teacher": "教研室", "students": 50, "has_textbook": false}
				],
				"expected_textbooks": 5,
				"evaluation_points": ["专业课程教材识别准确度", "实践类课程排除", "教材版本正确性"]
			}
		],
		"approval_select": [
			{
				"id": "ap_001",
				"name": "教材订购审批流程",
				"difficulty": 1,
				"description": "根据审批记录选择正确的订购处理方式",
				"time_limit": 100,
				"records": [
					{"id": "r1", "course": "高等数学", "status": "approved", "approver": "系主任", "date": "2024-06-15", "quantity": 120, "textbook": "高等数学（第七版）"},
					{"id": "r2", "course": "大学英语", "status": "pending", "approver": "", "date": "2024-06-18", "quantity": 90, "textbook": "新视野大学英语"},
					{"id": "r3", "course": "大学物理", "status": "rejected", "approver": "教务处长", "date": "2024-06-10", "quantity": 80, "textbook": "大学物理教程", "reason": "教材版本过时，需重新选版"},
					{"id": "r4", "course": "计算机基础", "status": "approved", "approver": "系主任", "date": "2024-06-12", "quantity": 150, "textbook": "大学计算机基础"},
					{"id": "r5", "course": "数据结构", "status": "approved", "approver": "院长", "date": "2024-06-20", "quantity": 85, "textbook": "数据结构(C语言版)"}
				],
				"questions": [
					{"q": "哪些教材可以立即订购？", "correct": ["r1", "r4", "r5"], "explanation": "只有审批通过(status=approved)的记录才能订购"},
					{"q": "哪份记录需要退回教研室？", "correct": ["r3"], "explanation": "审批被拒的记录需要退回并说明原因"},
					{"q": "哪份记录需要催办审批？", "correct": ["r2"], "explanation": "待审批状态需要催办"}
				],
				"evaluation_points": ["审批状态识别", "处理流程正确性", "批量处理效率"]
			},
			{
				"id": "ap_002",
				"name": "紧急教材审批处理",
				"difficulty": 2,
				"description": "处理开学前紧急教材审批",
				"time_limit": 120,
				"records": [
					{"id": "e1", "course": "软件工程", "status": "approved", "approver": "系主任", "date": "2024-08-25", "quantity": 70, "textbook": "软件工程导论", "urgent": true},
					{"id": "e2", "course": "数据库原理", "status": "pending", "approver": "", "date": "2024-08-26", "quantity": 75, "textbook": "数据库系统概论", "urgent": true},
					{"id": "e3", "course": "操作系统", "status": "approved", "approver": "院长", "date": "2024-08-20", "quantity": 75, "textbook": "操作系统概念"},
					{"id": "e4", "course": "计算机网络", "status": "rejected", "approver": "教务处长", "date": "2024-08-22", "quantity": 80, "textbook": "计算机网络", "reason": "数量与学生人数不符", "urgent": true},
					{"id": "e5", "course": "编译原理", "status": "pending", "approver": "", "date": "2024-08-15", "quantity": 45, "textbook": "编译原理"}
				],
				"questions": [
					{"q": "哪些是紧急且可订购的教材？", "correct": ["e1"], "explanation": "需要同时满足urgent=true和status=approved"},
					{"q": "哪些紧急订单需要优先处理？", "correct": ["e2", "e4"], "explanation": "紧急但未完成审批的需要优先处理"},
					{"q": "哪份记录需要核实订购数量？", "correct": ["e4"], "explanation": "被拒原因是数量问题，需要核实后重新提交"}
				],
				"evaluation_points": ["紧急情况优先级判断", "审批流程理解", "问题原因分析"]
			}
		],
		"course_sort": [
			{
				"id": "cs_001",
				"name": "基础课程排课排序",
				"difficulty": 1,
				"description": "按先修课程关系正确排序课程目录",
				"time_limit": 90,
				"courses": [
					{"id": "c1", "name": "高等数学(上)", "prerequisites": [], "semester": 1},
					{"id": "c2", "name": "高等数学(下)", "prerequisites": ["c1"], "semester": 2},
					{"id": "c3", "name": "线性代数", "prerequisites": ["c1"], "semester": 2},
					{"id": "c4", "name": "概率论", "prerequisites": ["c2", "c3"], "semester": 3},
					{"id": "c5", "name": "大学物理(上)", "prerequisites": ["c1"], "semester": 2},
					{"id": "c6", "name": "大学物理(下)", "prerequisites": ["c5"], "semester": 3}
				],
				"correct_order": ["c1", "c2", "c3", "c5", "c4", "c6"],
				"evaluation_points": ["先修关系识别", "学期安排合理性", "排序完整性"]
			},
			{
				"id": "cs_002",
				"name": "计算机专业课程排序",
				"difficulty": 2,
				"description": "按依赖关系正确排序计算机专业课程",
				"time_limit": 120,
				"courses": [
					{"id": "p1", "name": "C语言程序设计", "prerequisites": [], "semester": 1},
					{"id": "p2", "name": "数据结构", "prerequisites": ["p1"], "semester": 2},
					{"id": "p3", "name": "离散数学", "prerequisites": [], "semester": 1},
					{"id": "p4", "name": "算法设计与分析", "prerequisites": ["p2", "p3"], "semester": 3},
					{"id": "p5", "name": "操作系统", "prerequisites": ["p2"], "semester": 3},
					{"id": "p6", "name": "计算机组成原理", "prerequisites": ["p1"], "semester": 2},
					{"id": "p7", "name": "计算机网络", "prerequisites": ["p5", "p6"], "semester": 4},
					{"id": "p8", "name": "软件工程", "prerequisites": ["p2", "p4"], "semester": 4}
				],
				"correct_order": ["p1", "p3", "p2", "p6", "p4", "p5", "p7", "p8"],
				"evaluation_points": ["复杂依赖关系处理", "并行课程识别", "专业课程体系理解"]
			}
		],
		"classroom_allocate": [
			{
				"id": "cr_001",
				"name": "公共教室资源分配",
				"difficulty": 1,
				"description": "根据课程人数和教室容量合理分配教室",
				"time_limit": 150,
				"classrooms": [
					{"id": "rm1", "name": "教学楼A101", "capacity": 150, "type": "large", "equipment": ["projector", "computer"]},
					{"id": "rm2", "name": "教学楼A203", "capacity": 60, "type": "medium", "equipment": ["projector", "computer"]},
					{"id": "rm3", "name": "教学楼B102", "capacity": 200, "type": "large", "equipment": ["projector", "computer", "blackboard"]},
					{"id": "rm4", "name": "教学楼B205", "capacity": 40, "type": "small", "equipment": ["projector"]}
				],
				"courses": [
					{"id": "cl1", "name": "高等数学", "students": 120, "needs_equipment": ["projector", "computer"], "time_slot": "周一1-2节"},
					{"id": "cl2", "name": "大学英语", "students": 50, "needs_equipment": ["projector", "computer"], "time_slot": "周一3-4节"},
					{"id": "cl3", "name": "思想道德修养", "students": 180, "needs_equipment": ["projector", "computer"], "time_slot": "周二1-2节"},
					{"id": "cl4", "name": "计算机基础", "students": 35, "needs_equipment": ["projector", "computer"], "time_slot": "周二3-4节"}
				],
				"optimal_allocation": {
					"cl1": "rm1",
					"cl2": "rm2",
					"cl3": "rm3",
					"cl4": "rm4"
				},
				"evaluation_points": ["容量匹配度", "设备满足度", "时间安排合理性"]
			},
			{
				"id": "cr_002",
				"name": "专业实验教室分配",
				"difficulty": 2,
				"description": "分配专业实验课程教室，考虑特殊设备需求",
				"time_limit": 180,
				"classrooms": [
					{"id": "lab1", "name": "计算机实验室1", "capacity": 50, "type": "lab", "equipment": ["computer", "projector", "dev_tools"]},
					{"id": "lab2", "name": "计算机实验室2", "capacity": 40, "type": "lab", "equipment": ["computer", "projector", "network_test"]},
					{"id": "lab3", "name": "软件工程实验室", "capacity": 30, "type": "lab", "equipment": ["computer", "projector", "dev_tools", "ci_cd"]},
					{"id": "lec1", "name": "学术报告厅", "capacity": 100, "type": "lecture", "equipment": ["projector", "microphone", "computer"]}
				],
				"courses": [
					{"id": "lb1", "name": "数据结构实验", "students": 45, "needs_equipment": ["computer", "dev_tools"], "time_slot": "周三1-2节"},
					{"id": "lb2", "name": "计算机网络实验", "students": 35, "needs_equipment": ["computer", "network_test"], "time_slot": "周三3-4节"},
					{"id": "lb3", "name": "软件工程实践", "students": 28, "needs_equipment": ["computer", "dev_tools", "ci_cd"], "time_slot": "周四1-2节"},
					{"id": "lb4", "name": "专业前沿讲座", "students": 90, "needs_equipment": ["projector", "microphone", "computer"], "time_slot": "周五下午"}
				],
				"optimal_allocation": {
					"lb1": "lab1",
					"lb2": "lab2",
					"lb3": "lab3",
					"lb4": "lec1"
				},
				"evaluation_points": ["特殊设备匹配", "实验室资源优化", "专业需求理解"]
			}
		]
	}

func load_data() -> void:
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file:
		var data = JSON.parse_string(file.get_as_text())
		file.close()
		if data is Dictionary:
			if data.has("training_records"):
				training_records = data["training_records"]
			if data.has("game_config"):
				game_config = data["game_config"]
	else:
		save_data()

func save_data() -> void:
	var data := {
		"training_records": training_records,
		"game_config": game_config
	}
	var file := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()

func start_level(level_type: String, level_index: int) -> Dictionary:
	if levels_data.has(level_type) and level_index < levels_data[level_type].size():
		current_level = levels_data[level_type][level_index]
		current_session = {
			"start_time": Time.get_unix_time_from_system(),
			"answers": [],
			"score": 0
		}
		return current_level
	return {}

func complete_level(answers: Array, score: int, duration: float) -> Dictionary:
	var stars := _calculate_stars(score)
	var record := {
		"level_id": current_level.get("id", ""),
		"level_name": current_level.get("name", ""),
		"level_type": _get_level_type_by_id(current_level.get("id", "")),
		"score": score,
		"stars": stars,
		"duration": duration,
		"answers": answers,
		"timestamp": Time.get_datetime_string_from_system(),
		"mode": game_config.get("current_mode", "practice")
	}
	training_records.append(record)
	save_data()
	level_completed.emit(current_level.get("id", ""), score, stars, duration)
	training_record_added.emit(record)
	return record

func _calculate_stars(score: int) -> int:
	for reward in game_config.get("rewards", []):
		if score >= reward["min_score"]:
			var stars_count := reward["stars"]
			for r in game_config.get("rewards", []):
				if r["min_score"] > reward["min_score"] and score >= r["min_score"]:
					stars_count = r["stars"]
			return stars_count
	return 0

func _get_level_type_by_id(level_id: String) -> String:
	for level_type in levels_data.keys():
		for level in levels_data[level_type]:
			if level["id"] == level_id:
				return level_type
	return ""

func get_level_statistics() -> Dictionary:
	var stats: Dictionary = {}
	for level_type in LEVEL_TYPES.keys():
		stats[level_type] = {
			"name": LEVEL_TYPES[level_type],
			"total_attempts": 0,
			"avg_score": 0,
			"best_score": 0,
			"completion_count": 0,
			"full_star_count": 0,
			"coverage_rate": 0.0
		}
	
	var total_scores: Dictionary = {}
	for record in training_records:
		var lt = record.get("level_type", "")
		if stats.has(lt):
			stats[lt]["total_attempts"] += 1
			if record["score"] > stats[lt]["best_score"]:
				stats[lt]["best_score"] = record["score"]
			if not total_scores.has(lt):
				total_scores[lt] = 0
			total_scores[lt] += record["score"]
			if record["stars"] >= 1:
				stats[lt]["completion_count"] += 1
			if record["stars"] == 3:
				stats[lt]["full_star_count"] += 1
	
	for lt in stats.keys():
		if stats[lt]["total_attempts"] > 0:
			stats[lt]["avg_score"] = int(total_scores.get(lt, 0) / stats[lt]["total_attempts"])
		var total_levels: int = levels_data.get(lt, []).size()
		if total_levels > 0:
			stats[lt]["coverage_rate"] = float(stats[lt]["completion_count"]) / float(total_levels)
	
	return stats

func is_within_open_time() -> bool:
	var open_time = game_config.get("open_time", {})
	if not open_time.get("enabled", false):
		return true
	var current_time = Time.get_time_string_from_system().substr(0, 5)
	return current_time >= open_time.get("start", "00:00") and current_time <= open_time.get("end", "23:59")

func get_level_types() -> Dictionary:
	return LEVEL_TYPES

func get_levels(level_type: String) -> Array:
	return levels_data.get(level_type, [])

func reset_config() -> void:
	_load_default_config()
	save_data()
