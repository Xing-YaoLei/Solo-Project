extends Node

const LEVELS: Dictionary = {
	"lv_1": {
		"name": "入门·新员工",
		"description": "基础操作熟悉，处理简单回访任务",
		"time": 120.0,
		"difficulty": 1,
		"batch_valid_rate": 0.7,
		"member_complete_rate": 0.6,
		"replenish_rate": 0.5,
		"task_interval": 3.0,
		"unlocked": true,
		"tasks": 15
	},
	"lv_2": {
		"name": "初级·实习药师",
		"description": "任务量增加，效期判断更复杂",
		"time": 150.0,
		"difficulty": 2,
		"batch_valid_rate": 0.6,
		"member_complete_rate": 0.5,
		"replenish_rate": 0.6,
		"task_interval": 2.5,
		"unlocked": true,
		"tasks": 20
	},
	"lv_3": {
		"name": "中级·驻店药师",
		"description": "多类型任务混合，会员档案更复杂",
		"time": 180.0,
		"difficulty": 3,
		"batch_valid_rate": 0.55,
		"member_complete_rate": 0.45,
		"replenish_rate": 0.65,
		"task_interval": 2.0,
		"unlocked": true,
		"tasks": 28
	},
	"lv_4": {
		"name": "高级·店长",
		"description": "高强度调度，补货单数量显著增加",
		"time": 200.0,
		"difficulty": 4,
		"batch_valid_rate": 0.5,
		"member_complete_rate": 0.4,
		"replenish_rate": 0.7,
		"task_interval": 1.8,
		"unlocked": true,
		"tasks": 35
	},
	"lv_5": {
		"name": "专家·区域经理",
		"description": "极限挑战，考验综合处理能力",
		"time": 240.0,
		"difficulty": 5,
		"batch_valid_rate": 0.45,
		"member_complete_rate": 0.35,
		"replenish_rate": 0.75,
		"task_interval": 1.5,
		"unlocked": true,
		"tasks": 45
	}
}

const MEDICINE_NAMES: Array = [
	"阿莫西林胶囊", "布洛芬缓释片", "氯雷他定片", "硝苯地平控释片",
	"二甲双胍片", "奥美拉唑肠溶胶囊", "阿托伐他汀钙片", "缬沙坦胶囊",
	"左氧氟沙星片", "头孢克肟分散片", "对乙酰氨基酚片", "蒙脱石散",
	"复方甘草片", "感冒灵颗粒", "板蓝根颗粒", "维生素C片",
	"钙尔奇D片", "鱼肝油丸", "六味地黄丸", "逍遥丸"
]

const MEMBER_NAMES: Array = [
	"王建国", "李秀英", "张桂花", "刘志强", "陈美玲",
	"杨振华", "赵淑芬", "黄国强", "周丽娟", "吴明辉",
	"徐翠兰", "孙德海", "马金凤", "朱伟东", "胡玉珍",
	"郭建军", "何雅琴", "高志远", "林美华", "罗劲松"
]

const MEMBER_CONDITIONS: Array = [
	"高血压", "糖尿病", "高血脂", "慢性胃炎", "过敏性鼻炎",
	"骨质疏松", "失眠", "冠心病", "关节炎", "支气管炎"
]

func get_all_level_ids() -> Array:
	var ids: Array = []
	for key in LEVELS.keys():
		ids.append(key)
	ids.sort()
	return ids

func get_level_data(level_id: String) -> Dictionary:
	if LEVELS.has(level_id):
		return LEVELS[level_id].duplicate()
	return {}

func get_level_name(level_id: String) -> String:
	var data: Dictionary = get_level_data(level_id)
	return data.get("name", "未知关卡")

func get_level_time(level_id: String) -> float:
	var data: Dictionary = get_level_data(level_id)
	return data.get("time", 120.0)

func get_level_task_count(level_id: String) -> int:
	var data: Dictionary = get_level_data(level_id)
	return data.get("tasks", 20)

func get_level_difficulty(level_id: String) -> int:
	var data: Dictionary = get_level_data(level_id)
	return data.get("difficulty", 1)

func generate_batch_task(level_id: String) -> Dictionary:
	var data: Dictionary = get_level_data(level_id)
	var valid_rate: float = data.get("batch_valid_rate", 0.5)
	var medicine: String = MEDICINE_NAMES[randi() % MEDICINE_NAMES.size()]
	var batch_no: String = "B%06d" % [randi() % 900000 + 100000]
	var is_valid: bool = randf() < valid_rate
	var today := Date.get_date_from_system()
	var expire_year: int
	var expire_month: int
	if is_valid:
		expire_year = today.year + randi_range(1, 3)
		expire_month = randi_range(1, 12)
	else:
		expire_year = today.year - randi_range(0, 2)
		expire_month = randi_range(1, 12)
		if expire_year == today.year and expire_month > today.month:
			expire_month = max(1, today.month - randi_range(1, 6))
	return {
		"type": "batch",
		"medicine": medicine,
		"batch_no": batch_no,
		"expire_date": "%04d-%02d" % [expire_year, expire_month],
		"is_valid": is_valid
	}

func generate_member_task(level_id: String) -> Dictionary:
	var data: Dictionary = get_level_data(level_id)
	var complete_rate: float = data.get("member_complete_rate", 0.5)
	var name: String = MEMBER_NAMES[randi() % MEMBER_NAMES.size()]
	var age: int = randi_range(35, 85)
	var condition: String = MEMBER_CONDITIONS[randi() % MEMBER_CONDITIONS.size()]
	var member_id: String = "M%06d" % [randi() % 900000 + 100000]
	var is_complete: bool = randf() < complete_rate
	var last_visit: String
	var phone: String
	if is_complete:
		last_visit = "2026-%02d-%02d" % [randi_range(1, 6), randi_range(1, 28)]
		phone = "138%08d" % [randi() % 100000000]
	else:
		last_visit = "2025-%02d-%02d" % [randi_range(1, 12), randi_range(1, 28)]
		var missing_phone: bool = randf() < 0.5
		phone = "" if missing_phone else "139%08d" % [randi() % 100000000]
	return {
		"type": "member",
		"member_id": member_id,
		"name": name,
		"age": age,
		"condition": condition,
		"last_visit": last_visit,
		"phone": phone,
		"is_complete": is_complete
	}

func generate_replenish_task(level_id: String) -> Dictionary:
	var data: Dictionary = get_level_data(level_id)
	var need_rate: float = data.get("replenish_rate", 0.5)
	var medicine: String = MEDICINE_NAMES[randi() % MEDICINE_NAMES.size()]
	var stock: int
	var threshold: int = 30
	var need_replenish: bool = randf() < need_rate
	if need_replenish:
		stock = randi_range(0, threshold - 5)
	else:
		stock = randi_range(threshold + 5, 200)
	var sales_week: int = randi_range(10, 80)
	return {
		"type": "replenish",
		"medicine": medicine,
		"stock": stock,
		"threshold": threshold,
		"sales_week": sales_week,
		"need_replenish": need_replenish
	}

func generate_random_task(level_id: String) -> Dictionary:
	var task_type: int = randi() % 3
	match task_type:
		0:
			return generate_batch_task(level_id)
		1:
			return generate_member_task(level_id)
		_:
			return generate_replenish_task(level_id)
