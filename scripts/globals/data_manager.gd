extends Node

signal data_updated(data_type)

const DATA_FILE := "user://game_data.json"

var game_data: Dictionary = {}

var levels_data: Dictionary = {}
var questions_data: Dictionary = {}
var stores_data: Dictionary = {}
var rewards_data: Dictionary = {}
var config_data: Dictionary = {}
var training_records: Array = []

func _ready() -> void:
	load_default_data()
	load_saved_data()

func load_default_data() -> void:
	levels_data = {
		"level_1": {
			"id": "level_1",
			"name": "新手入门",
			"description": "基础报损复核流程训练",
			"difficulty": 1,
			"unlocked": true,
			"question_types": ["review_opinion", "store_selection"],
			"time_limit": 300,
			"pass_score": 60,
			"open_time": "09:00-18:00",
			"enabled": true
		},
		"level_2": {
			"id": "level_2",
			"name": "进阶挑战",
			"description": "金额排序与多门店复核",
			"difficulty": 2,
			"unlocked": false,
			"question_types": ["review_opinion", "store_selection", "amount_sorting"],
			"time_limit": 480,
			"pass_score": 70,
			"open_time": "09:00-18:00",
			"enabled": true
		},
		"level_3": {
			"id": "level_3",
			"name": "精英考核",
			"description": "全流程审批复核",
			"difficulty": 3,
			"open_time": "09:00-18:00",
			"unlocked": false,
			"question_types": ["review_opinion", "store_selection", "amount_sorting", "approval_record"],
			"time_limit": 600,
			"pass_score": 80,
			"enabled": true
		}
	}
	
	stores_data = {
		"store_001": {
			"id": "store_001",
			"name": "朝阳门店",
			"manager": "张经理",
			"location": "朝阳区建国路88号",
			"loss_rate_target": 3.0
		},
		"store_002": {
			"id": "store_002",
			"name": "海淀门店",
			"manager": "李店长",
			"location": "海淀区中关村大街1号",
			"loss_rate_target": 2.5
		},
		"store_003": {
			"id": "store_003",
			"name": "西城门店",
			"manager": "王主管",
			"location": "西城区金融街15号",
			"loss_rate_target": 2.8
		},
		"store_004": {
			"id": "store_004",
			"name": "东城门店",
			"manager": "刘经理",
			"location": "东城区王府井大街50号",
			"loss_rate_target": 3.2
		},
		"store_005": {
			"id": "store_005",
			"name": "丰台门店",
			"manager": "陈店长",
			"location": "丰台区丰台路100号",
			"loss_rate_target": 2.9
		}
	}
	
	rewards_data = {
		"bronze": {
			"id": "bronze",
			"name": "铜质徽章",
			"description": "完成初级训练",
			"icon": "🥉",
			"condition": "accuracy >= 60"
		},
		"silver": {
			"id": "silver",
			"name": "银质徽章",
			"description": "完成中级训练",
			"icon": "🥈",
			"condition": "accuracy >= 80"
		},
		"gold": {
			"id": "gold",
			"name": "金质徽章",
			"description": "完成高级训练",
			"icon": "🥇",
			"condition": "accuracy >= 95"
		},
		"speed": {
			"id": "speed",
			"name": "闪电手",
			"description": "5分钟内完成关卡",
			"icon": "⚡",
			"condition": "time_used <= 300"
		}
	}
	
	questions_data = {
		"review_opinion": [
			{
				"id": "ro_001",
				"type": "review_opinion",
				"difficulty": 1,
				"description": "门店报损牛奶10箱，原因是过期，请问正确的复核意见是？",
				"options": [
					{"id": "A", "text": "同意报损，计入正常损耗", "correct": true},
					{"id": "B", "text": "同意报损，计入门店管理责任"},
					{"id": "C", "text": "驳回，要求门店重新提交照片"},
					{"id": "D", "text": "驳回，不予处理"}
				],
				"correct_reason": "牛奶过期属于正常保质期内正常损耗，应同意报损。",
				"abnormal_reason": "错误选项会导致门店成本增加",
				"score": 10
			},
			{
				"id": "ro_002",
				"type": "review_opinion",
				"difficulty": 2,
				"description": "门店报损咖啡豆5袋，原因是未按规定温度不当导致变质，正确的复核意见是？",
				"options": [
					{"id": "A", "text": "同意报损，计入正常损耗"},
					{"id": "B", "text": "同意报损，计入门店管理责任", "correct": true},
					{"id": "C", "text": "驳回，要求重新说明"},
					{"id": "D", "text": "驳回，不予处理"}
				],
				"correct_reason": "储存温度不当属于门店管理问题，应由门店承担责任。",
				"abnormal_reason": "管理不当导致的损耗应计入门店责任。",
				"score": 15
			},
			{
				"id": "ro_003",
				"type": "review_opinion",
				"difficulty": 1,
				"description": "门店报损纸杯200个，原因是运输途中破损，正确的复核意见是？",
				"options": [
					{"id": "A", "text": "同意报损，计入正常损耗"},
					{"id": "B", "text": "同意报损，计入物流责任", "correct": true},
					{"id": "C", "text": "驳回，不予处理"},
					{"id": "D", "text": "驳回，要求门店赔偿"}
				],
				"correct_reason": "运输破损属于物流责任，不应由门店承担。",
				"abnormal_reason": "运输破损应追究物流供应商责任。",
				"score": 10
			},
			{
				"id": "ro_004",
				"type": "review_opinion",
				"difficulty": 2,
				"description": "门店报损糕点10份，原因是制作错误报废，正确的复核意见是？",
				"options": [
					{"id": "A", "text": "同意报损，计入正常损耗"},
					{"id": "B", "text": "同意报损，计入门店操作责任", "correct": true},
					{"id": "C", "text": "驳回，不予处理"},
					{"id": "D", "text": "驳回，要求门店赔偿"}
				],
				"correct_reason": "制作错误属于门店员工操作问题，由门店承担责任。",
				"abnormal_reason": "人为操作失误应计入门店责任。",
				"score": 15
			}
		],
		"store_selection": [
			{
				"id": "ss_001",
				"type": "store_selection",
				"difficulty": 1,
				"description": "以下哪个门店的损耗率最高？请选择责任门店。",
				"scenario": "本月损耗数据：朝阳店5.2%，海淀店2.1%，西城区2.8%，东城店3.5%，丰台店2.9%",
				"options": [
					{"id": "A", "text": "朝阳门店", "correct": true, "store_id": "store_001"},
					{"id": "B", "text": "海淀门店", "store_id": "store_002"},
					{"id": "C", "text": "西城门店", "store_id": "store_003"},
					{"id": "D", "text": "东城门店", "store_id": "store_004"}
				],
				"correct_reason": "朝阳门店5.2%的损耗率最高，需要重点关注。",
				"abnormal_reason": "损耗率超过目标值3.0%，属于异常。",
				"score": 10
			},
			{
				"id": "ss_002",
				"type": "store_selection",
				"difficulty": 2,
				"description": "哪个门店连续3个月损耗率超标？",
				"scenario": "朝阳：3月4.8%，4月5.1%，5月4.9%；海淀：3月2.0%，4月2.2%，5月2.1%；西城：3月2.5%，4月2.7%，5月2.6%",
				"options": [
					{"id": "A", "text": "朝阳门店", "correct": true, "store_id": "store_001"},
					{"id": "B", "text": "海淀门店", "store_id": "store_002"},
					{"id": "C", "text": "西城门店", "store_id": "store_003"},
					{"id": "D", "text": "丰台门店", "store_id": "store_005"}
				],
				"correct_reason": "朝阳门店连续3个月超过目标值3.0%。",
				"abnormal_reason": "连续超标需要进行整改。",
				"score": 15
			},
			{
				"id": "ss_003",
				"type": "store_selection",
				"difficulty": 1,
				"description": "哪个门店本月损耗率最低？",
				"scenario": "朝阳店4.5%，海淀店2.0%，西城店3.0%，东城店3.2%，丰台店2.8%",
				"options": [
					{"id": "A", "text": "朝阳门店", "store_id": "store_001"},
					{"id": "B", "text": "海淀门店", "correct": true, "store_id": "store_002"},
					{"id": "C", "text": "西城门店", "store_id": "store_003"},
					{"id": "D", "text": "丰台门店", "store_id": "store_005"}
				],
				"correct_reason": "海淀门店2.0%的损耗率控制最好。",
				"abnormal_reason": "低于目标值2.5%，表现优秀。",
				"score": 10
			}
		],
		"amount_sorting": [
			{
				"id": "as_001",
				"type": "amount_sorting",
				"difficulty": 1,
				"description": "请将以下报损金额按从高到低排序",
				"items": [
					{"id": "item1", "name": "进口咖啡豆", "amount": 2580.0},
					{"id": "item2", "name": "牛奶", "amount": 1250.0},
					{"id": "item3", "name": "糕点", "amount": 890.0},
					{"id": "item4", "name": "纸杯", "amount": 350.0}
				],
				"correct_order": ["item1", "item2", "item3", "item4"],
				"correct_reason": "咖啡豆 > 牛奶 > 糕点 > 纸杯",
				"abnormal_reason": "咖啡豆占比最高，需要重点管控。",
				"score": 20
			},
			{
				"id": "as_002",
				"type": "amount_sorting",
				"difficulty": 2,
				"description": "请按损耗金额从低到高排序",
				"items": [
					{"id": "item1", "name": "糖浆", "amount": 180.0},
					{"id": "item2", "name": "奶泡杯盖", "amount": 420.0},
					{"id": "item3", "name": "奶油", "amount": 760.0},
					{"id": "item4", "name": "新鲜水果", "amount": 1580.0}
				],
				"correct_order": ["item1", "item2", "item3", "item4"],
				"correct_reason": "糖浆 < 杯盖 < 奶油 < 水果",
				"abnormal_reason": "水果损耗金额最大，应加强库存管理。",
				"score": 20
			}
		],
		"approval_record": [
			{
				"id": "ar_001",
				"type": "approval_record",
				"difficulty": 2,
				"description": "处理以下审批记录：门店申请报损咖啡机一台，价值5000元，原因是设备老化故障",
				"steps": [
					{"id": "step1", "text": "审核报损原因是否真实", "required": true, "order": 1},
					{"id": "step2", "text": "核对资产原值与折旧", "required": true, "order": 2},
					{"id": "step3", "text": "确认是否在报损后回收残值", "required": true, "order": 3},
					{"id": "step4", "text": "完成审批并更新资产台账", "required": true, "order": 4}
				],
				"correct_order": ["step1", "step2", "step3", "step4"],
				"correct_reason": "设备报损审批流程：真实性 → 价值核对 → 残值回收 → 台账更新",
				"abnormal_reason": "缺少任何一步都会导致审批流程错误。",
				"score": 25
			},
			{
				"id": "ar_002",
				"type": "approval_record",
				"difficulty": 3,
				"description": "处理审批：门店申请报损牛奶50箱，价值8000元，原因是冷链运输故障导致变质",
				"steps": [
					{"id": "step1", "text": "核实物流商确认责任方", "required": true, "order": 1},
					{"id": "step2", "text": "评估损失金额", "required": true, "order": 2},
					{"id": "step3", "text": "启动保险理赔流程", "required": true, "order": 3},
					{"id": "step4", "text": "完成审批并记录", "required": true, "order": 4}
				],
				"correct_order": ["step1", "step2", "step3", "step4"],
				"correct_reason": "物流责任报损流程：责任认定 → 损失评估 → 保险理赔 → 审批记录",
				"abnormal_reason": "顺序错误会导致无法获得赔偿。",
				"score": 30
			}
		]
	}
	
	config_data = {
		"training_mode": "guided",
		"open_time_start": "09:00",
		"open_time_end": "18:00",
		"sound_enabled": true,
		"music_volume": 0.7,
		"sfx_volume": 0.8
	}

func load_saved_data() -> void:
	if FileAccess.file_exists(DATA_FILE):
		var file := FileAccess.open(DATA_FILE, FileAccess.READ)
		if file:
			var content: String = file.get_as_text()
			file.close()
			var data: Variant = JSON.parse_string(content)
			if data is Dictionary:
				if data.has("levels"):
					for key in data["levels"]:
						levels_data[key] = data["levels"][key]
				if data.has("questions"):
					questions_data.merge(data["questions"])
				if data.has("stores"):
					for key in data["stores"]:
						stores_data[key] = data["stores"][key]
				if data.has("rewards"):
					for key in data["rewards"]:
						rewards_data[key] = data["rewards"][key]
				if data.has("config"):
					config_data.merge(data["config"])
				if data.has("training_records"):
					training_records = data["training_records"]
	load_training_records()

func save_data() -> void:
	var save_dict: Dictionary = {
		"levels": levels_data,
		"questions": questions_data,
		"stores": stores_data,
		"rewards": rewards_data,
		"config": config_data,
		"training_records": training_records
	}
	var file := FileAccess.open(DATA_FILE, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(save_dict))
		file.close()
		data_updated.emit("all")

func get_levels() -> Array:
	var result: Array = []
	for key in levels_data:
		result.append(levels_data[key])
	result.sort_custom(func(a, b): return a["difficulty"] < b["difficulty"])
	return result

func get_level(level_id: String) -> Dictionary:
	return levels_data.get(level_id, {})

func update_level(level_id: String, level_data: Dictionary) -> void:
	levels_data[level_id] = level_data
	save_data()
	data_updated.emit("levels")

func get_questions_by_type(question_type: String) -> Array:
	return questions_data.get(question_type, [])

func get_random_questions(question_types: Array, count: int) -> Array:
	var all_questions: Array = []
	for qtype in question_types:
		all_questions.append_array(get_questions_by_type(qtype))
	all_questions.shuffle()
	return all_questions.slice(0, min(count, all_questions.size()))

func get_stores() -> Array:
	var result: Array = []
	for key in stores_data:
		result.append(stores_data[key])
	return result

func get_store(store_id: String) -> Dictionary:
	return stores_data.get(store_id, {})

func update_store(store_id: String, store_data: Dictionary) -> void:
	stores_data[store_id] = store_data
	save_data()
	data_updated.emit("stores")

func get_rewards() -> Array:
	var result: Array = []
	for key in rewards_data:
		result.append(rewards_data[key])
	return result

func add_question(question: Dictionary) -> void:
	var qtype: String = question.get("type", "review_opinion")
	if not questions_data.has(qtype):
		questions_data[qtype] = []
	questions_data[qtype].append(question)
	save_data()
	data_updated.emit("questions")

func delete_level(level_id: String) -> void:
	if levels_data.has(level_id):
		levels_data.erase(level_id)
		save_data()
		data_updated.emit("levels")

func delete_store(store_id: String) -> void:
	if stores_data.has(store_id):
		stores_data.erase(store_id)
		save_data()
		data_updated.emit("stores")

func delete_question(question_id: String) -> void:
	for qtype in questions_data:
		var questions: Array = questions_data[qtype]
		for i in range(questions.size()):
			if questions[i].get("id", "") == question_id:
				questions.remove_at(i)
				save_data()
				data_updated.emit("questions")
				return

func get_config() -> Dictionary:
	return config_data.duplicate()

func update_config(new_config: Dictionary) -> void:
	config_data.merge(new_config)
	save_data()
	data_updated.emit("config")

func save_training_record(record: Dictionary) -> void:
	training_records.append(record)
	save_data()
	data_updated.emit("training_records")

func get_training_records(limit: int = -1) -> Array:
	var records: Array = training_records.duplicate()
	records.sort_custom(func(a, b): return a["timestamp"] > b["timestamp"])
	if limit > 0:
		return records.slice(0, min(limit, records.size()))
	return records

func get_loss_rate_statistics() -> Dictionary:
	var stats: Dictionary = {}
	for store_id in stores_data:
		stats[store_id] = {
			"store_id": store_id,
			"store_name": stores_data[store_id]["name"],
			"target": stores_data[store_id]["loss_rate_target"],
			"records": []
		}
	for record in training_records:
		if record.has("gameplay_data"):
			for key in record["gameplay_data"]:
				var qdata = record["gameplay_data"][key]
				if qdata.has("store_id"):
					var sid = qdata["store_id"]
					if stats.has(sid):
						stats[sid]["records"].append({
							"is_correct": qdata["is_correct"],
							"score": qdata["score"]
						})
	return stats

func load_training_records() -> void:
	if FileAccess.file_exists("user://training_records.json"):
		var file := FileAccess.open("user://training_records.json", FileAccess.READ)
		if file:
			var content: String = file.get_as_text()
			file.close()
			var data: Variant = JSON.parse_string(content)
			if data is Array:
				training_records = data
				save_data()

func is_within_open_time() -> bool:
	var now_time: String = Time.get_time_string_from_system(true)
	var start: String = config_data.get("open_time_start", "00:00")
	var end: String = config_data.get("open_time_end", "23:59")
	var now_hour: int = now_time.substr(0, 2).to_int()
	var start_hour: int = start.substr(0, 2).to_int()
	var end_hour: int = end.substr(0, 2).to_int()
	return now_hour >= start_hour and now_hour < end_hour
