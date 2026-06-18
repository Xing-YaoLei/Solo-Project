extends Node

signal game_started
signal round_completed(result: Dictionary)
signal game_ended(stats: Dictionary)
signal step_recorded(step: Dictionary)

const MAX_REPLAY_HISTORY := 3

enum ChallengeType {
	AUTHORITY_SCOPE,
	TIMELINE_CHANGE,
	BASIC_PROFILE
}

enum MistakeType {
	NONE,
	WRONG_AUTHORITY,
	WRONG_TIMELINE,
	INCOMPLETE_PROFILE,
	TIMEOUT,
	MISSING_DATA_IGNORED
}

var current_round: int = 0
var total_rounds: int = 5
var current_challenge_type: int = ChallengeType.AUTHORITY_SCOPE
var score: int = 0
var mistakes: Array[Dictionary] = []
var current_step_start_time: float = 0.0
var step_durations: Array[float] = []
var replay_history: Array[Dictionary] = []
var game_stats: Dictionary = {
	"total_games": 0,
	"total_steps": 0,
	"correct_steps": 0,
	"profile_completeness": [],
	"mistake_distribution": {}
}

var _current_round_data: Dictionary = {}
var _step_counter: int = 0

func _ready() -> void:
	randomize()
	_load_stats()

func start_new_game() -> void:
	current_round = 0
	score = 0
	mistakes.clear()
	step_durations.clear()
	_step_counter = 0
	game_stats.total_games += 1
	emit_signal("game_started")
	_next_round()

func _next_round() -> void:
	current_round += 1
	if current_round > total_rounds:
		_end_game()
		return
	current_challenge_type = _select_challenge_type()
	_current_round_data = _generate_round_data(current_challenge_type)
	_step_counter = 0
	current_step_start_time = Time.get_ticks_msec() / 1000.0

func _select_challenge_type() -> int:
	var types := [
		ChallengeType.AUTHORITY_SCOPE,
		ChallengeType.TIMELINE_CHANGE,
		ChallengeType.BASIC_PROFILE
	]
	return types[randi() % types.size()]

func get_current_round_data() -> Dictionary:
	return _current_round_data

func record_step(player_choice: Dictionary, is_correct: bool, mistake_type: int = MistakeType.NONE) -> void:
	var now: float = Time.get_ticks_msec() / 1000.0
	var duration: float = now - current_step_start_time
	step_durations.append(duration)
	_step_counter += 1
	game_stats.total_steps += 1
	if is_correct:
		score += 100
		game_stats.correct_steps += 1
	else:
		var mistake_entry: Dictionary = {
			"round": current_round,
			"step": _step_counter,
			"challenge_type": current_challenge_type,
			"mistake_type": mistake_type,
			"player_choice": player_choice,
			"correct_data": _current_round_data,
			"duration": duration,
			"timestamp": Time.get_datetime_string_from_system()
		}
		mistakes.append(mistake_entry)
		if game_stats.mistake_distribution.has(str(mistake_type)):
			game_stats.mistake_distribution[str(mistake_type)] += 1
		else:
			game_stats.mistake_distribution[str(mistake_type)] = 1
	var step_record: Dictionary = {
		"round": current_round,
		"step": _step_counter,
		"challenge_type": current_challenge_type,
		"player_choice": player_choice,
		"is_correct": is_correct,
		"mistake_type": mistake_type,
		"duration": duration,
		"round_data": _current_round_data.duplicate(true)
	}
	emit_signal("step_recorded", step_record)
	current_step_start_time = Time.get_ticks_msec() / 1000.0

func complete_round(profile_completeness: float = 1.0) -> void:
	if _current_round_data.has("required_profile_fields"):
		game_stats.profile_completeness.append(profile_completeness)
	var result: Dictionary = {
		"round": current_round,
		"challenge_type": current_challenge_type,
		"score": score,
		"mistakes_in_round": mistakes.filter(func(m): return m["round"] == current_round),
		"profile_completeness": profile_completeness
	}
	emit_signal("round_completed", result)
	_next_round()

func _end_game() -> void:
	var final_stats: Dictionary = {
		"total_score": score,
		"total_rounds": total_rounds,
		"mistakes": mistakes.duplicate(true),
		"step_durations": step_durations.duplicate(true),
		"average_completeness": _calc_average_completeness(),
		"mistake_distribution": game_stats.mistake_distribution.duplicate(true),
		"slow_steps": _find_slow_steps()
	}
	_save_replay(final_stats)
	_save_stats()
	emit_signal("game_ended", final_stats)

func _calc_average_completeness() -> float:
	if game_stats.profile_completeness.is_empty():
		return 1.0
	var total: float = 0.0
	for c in game_stats.profile_completeness:
		total += c
	return total / game_stats.profile_completeness.size()

func _find_slow_steps() -> Array[Dictionary]:
	var slow: Array[Dictionary] = []
	if step_durations.size() < 2:
		return slow
	var avg: float = 0.0
	for d in step_durations:
		avg += d
	avg /= step_durations.size()
	for i in range(step_durations.size()):
		if step_durations[i] > avg * 1.8 and step_durations[i] > 3.0:
			slow.append({
				"step_index": i,
				"duration": step_durations[i],
				"round": i / 3 + 1
			})
	return slow

func _save_replay(final_stats: Dictionary) -> void:
	var replay: Dictionary = {
		"timestamp": Time.get_datetime_string_from_system(),
		"stats": final_stats,
		"mistakes": mistakes.duplicate(true)
	}
	replay_history.insert(0, replay)
	while replay_history.size() > MAX_REPLAY_HISTORY:
		replay_history.pop_back()

func get_replay_history() -> Array[Dictionary]:
	return replay_history.duplicate(true)

func _generate_round_data(challenge_type: int) -> Dictionary:
	match challenge_type:
		ChallengeType.AUTHORITY_SCOPE:
			return _generate_authority_data()
		ChallengeType.TIMELINE_CHANGE:
			return _generate_timeline_data()
		ChallengeType.BASIC_PROFILE:
			return _generate_profile_data()
		_:
			return {}

func _generate_authority_data() -> Dictionary:
	var templates := [
		{
			"client_name": "张先生",
			"property_address": "阳光花园 3栋 1802",
			"authorized_items": ["拆改墙体", "水电改造", "防水施工"],
			"unauthorized_items": ["更换入户门", "改动外立面", "结构打孔"],
			"time_limit": 20.0,
			"has_missing_data": randi() % 3 == 0
		},
		{
			"client_name": "李女士",
			"property_address": "翠湖天地 A座 501",
			"authorized_items": ["地面找平", "瓷砖铺贴", "吊顶安装"],
			"unauthorized_items": ["拆除承重墙", "改装燃气管道", "外扩阳台"],
			"time_limit": 18.0,
			"has_missing_data": randi() % 3 == 0
		},
		{
			"client_name": "王总",
			"property_address": "滨江壹号 8栋 2201",
			"authorized_items": ["全屋定制", "软装搭配", "智能系统"],
			"unauthorized_items": ["加建隔层", "更改消防设施", "移动卫生间"],
			"time_limit": 22.0,
			"has_missing_data": randi() % 3 == 0
		}
	]
	var data: Dictionary = templates[randi() % templates.size()].duplicate(true)
	data["challenge_type"] = ChallengeType.AUTHORITY_SCOPE
	if data.get("has_missing_data", false):
		data["missing_hint"] = "注意：授权书第3页签名位置模糊，请留意"
	return data

func _generate_timeline_data() -> Dictionary:
	var templates := [
		{
			"project_name": "现代简约三居",
			"original_timeline": [
				{"phase": "拆改", "start": "第1天", "end": "第5天"},
				{"phase": "水电", "start": "第6天", "end": "第15天"},
				{"phase": "泥木", "start": "第16天", "end": "第35天"},
				{"phase": "油漆", "start": "第36天", "end": "第50天"}
			],
			"valid_changes": [
				{"phase": "水电", "new_end": "第18天", "reason": "材料延迟到货"},
				{"phase": "泥木", "new_start": "第19天", "reason": "水电验收延后"}
			],
			"invalid_changes": [
				{"phase": "拆改", "new_end": "第10天", "reason": "私自延长"},
				{"phase": "油漆", "new_start": "第30天", "reason": "跳过泥木直接开始"}
			],
			"time_limit": 25.0,
			"has_missing_data": randi() % 3 == 0
		},
		{
			"project_name": "北欧风两居",
			"original_timeline": [
				{"phase": "水电", "start": "第1天", "end": "第10天"},
				{"phase": "防水", "start": "第11天", "end": "第14天"},
				{"phase": "瓷砖", "start": "第15天", "end": "第28天"},
				{"phase": "安装", "start": "第29天", "end": "第45天"}
			],
			"valid_changes": [
				{"phase": "防水", "new_end": "第16天", "reason": "闭水试验延长48小时"}
			],
			"invalid_changes": [
				{"phase": "瓷砖", "new_start": "第12天", "reason": "防水未验收就进场"}
			],
			"time_limit": 22.0,
			"has_missing_data": randi() % 3 == 0
		}
	]
	var data: Dictionary = templates[randi() % templates.size()].duplicate(true)
	data["challenge_type"] = ChallengeType.TIMELINE_CHANGE
	if data.get("has_missing_data", false):
		data["missing_hint"] = "注意：变更单缺少监理签字确认"
	return data

func _generate_profile_data() -> Dictionary:
	var templates := [
		{
			"required_fields": ["客户姓名", "联系电话", "身份证号", "房产地址", "合同编号", "紧急联系人"],
			"provided_fields": {
				"客户姓名": "陈先生",
				"联系电话": "138****5678",
				"身份证号": "",
				"房产地址": "金茂府 5栋 1203",
				"合同编号": "HT20240315",
				"紧急联系人": "陈太太 139****1234"
			},
			"time_limit": 30.0
		},
		{
			"required_fields": ["客户姓名", "联系电话", "身份证号", "房产地址", "合同编号", "紧急联系人"],
			"provided_fields": {
				"客户姓名": "刘女士",
				"联系电话": "",
				"身份证号": "310***********1234",
				"房产地址": "保利天悦 B栋 902",
				"合同编号": "HT20240420",
				"紧急联系人": ""
			},
			"time_limit": 28.0
		},
		{
			"required_fields": ["客户姓名", "联系电话", "身份证号", "房产地址", "合同编号", "紧急联系人"],
			"provided_fields": {
				"客户姓名": "赵先生",
				"联系电话": "137****9999",
				"身份证号": "320***********5678",
				"房产地址": "",
				"合同编号": "",
				"紧急联系人": "赵先生父亲 136****8888"
			},
			"time_limit": 26.0
		}
	]
	var data: Dictionary = templates[randi() % templates.size()].duplicate(true)
	data["challenge_type"] = ChallengeType.BASIC_PROFILE
	return data

func _save_stats() -> void:
	var file := FileAccess.open("user://game_stats.save", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(game_stats))
		file.close()

func _load_stats() -> void:
	if FileAccess.file_exists("user://game_stats.save"):
		var file := FileAccess.open("user://game_stats.save", FileAccess.READ)
		if file:
			var content: String = file.get_as_text()
			file.close()
			var parsed = JSON.parse_string(content)
			if typeof(parsed) == TYPE_DICTIONARY:
				game_stats = parsed
	var replay_file := FileAccess.open("user://replay_history.save", FileAccess.READ)
	if replay_file:
		var content: String = replay_file.get_as_text()
		replay_file.close()
		var parsed = JSON.parse_string(content)
		if typeof(parsed) == TYPE_ARRAY:
			replay_history = parsed

func save_persistent_data() -> void:
	var file := FileAccess.open("user://replay_history.save", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(replay_history))
		file.close()
	_save_stats()

func get_mistake_type_name(mistake_type: int) -> String:
	match mistake_type:
		MistakeType.WRONG_AUTHORITY:
			return "授权范围判断错误"
		MistakeType.WRONG_TIMELINE:
			return "时间线变更判断错误"
		MistakeType.INCOMPLETE_PROFILE:
			return "基础档案不完整"
		MistakeType.TIMEOUT:
			return "超时未操作"
		MistakeType.MISSING_DATA_IGNORED:
			return "忽略资料缺失提示"
		_:
			return "未知错误"

func get_challenge_type_name(challenge_type: int) -> String:
	match challenge_type:
		ChallengeType.AUTHORITY_SCOPE:
			return "授权范围判断"
		ChallengeType.TIMELINE_CHANGE:
			return "时间线变更"
		ChallengeType.BASIC_PROFILE:
			return "基础档案核查"
		_:
			return "未知任务"
