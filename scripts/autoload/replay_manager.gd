extends Node

const MAX_REPLAYS: int = 3
const MAX_STEPS_PER_REPLAY: int = 500

var replays: Array = []
var current_replay_index: int = -1
var is_playing: bool = false
var playback_step: int = 0
var playback_speed: float = 1.0

var current_recording: Dictionary = {}
var is_recording: bool = false
var has_failure: bool = false

func _ready() -> void:
	EventBus.project_failed.connect(_on_project_failed)
	EventBus.game_started.connect(_on_game_started)
	EventBus.game_ended.connect(_on_game_ended)

func _on_game_started(difficulty: String) -> void:
	start_recording()
	has_failure = false

func _on_project_failed(project_data: Dictionary, reason: String) -> void:
	has_failure = true

func _on_game_ended(result_data: Dictionary) -> void:
	var success = result_data.get("success", false)
	if not success and is_recording:
		stop_recording()
		save_replay()

func start_recording() -> void:
	is_recording = true
	has_failure = false
	current_recording = {
		"id": "replay_" + str(Time.get_unix_time_from_system()),
		"timestamp": Time.get_datetime_string_from_system(),
		"difficulty": GameState.current_difficulty,
		"steps": [],
		"final_score": 0,
		"failed_project": null,
		"fail_reason": "",
		"customers_served": 0,
		"projects_completed": 0,
		"projects_failed": 0
	}

func stop_recording() -> void:
	if not is_recording:
		return
	is_recording = false
	current_recording["final_score"] = GameState.score
	current_recording["customers_served"] = GameState.customers_served
	current_recording["projects_completed"] = GameState.projects_completed
	current_recording["projects_failed"] = GameState.projects_failed

func record_step(step_type: String, step_data: Dictionary) -> void:
	if not is_recording:
		return
	if current_recording["steps"].size() >= MAX_STEPS_PER_REPLAY:
		current_recording["steps"].pop_front()
	var step = {
		"time": Time.get_ticks_msec() / 1000.0 - GameState.start_time,
		"type": step_type,
		"data": step_data
	}
	current_recording["steps"].append(step)

func record_customer_action(action: String, customer_data: Dictionary) -> void:
	record_step("customer", {"action": action, "customer": customer_data})

func record_project_action(action: String, project_data: Dictionary) -> void:
	record_step("project", {"action": action, "project": project_data})

func record_recharge_action(action: String, recharge_data: Dictionary, target_customer: Dictionary = {}) -> void:
	var step_data: Dictionary = {"action": action, "recharge": recharge_data}
	if not target_customer.is_empty():
		step_data["target_customer"] = target_customer
	record_step("recharge", step_data)

func record_item_usage(item_id: String) -> void:
	record_step("item", {"action": "used", "item_id": item_id})

func set_failed_project(project_data: Dictionary, reason: String) -> void:
	if current_recording and current_recording.size() > 0:
		current_recording["failed_project"] = project_data
		current_recording["fail_reason"] = reason

func save_replay() -> void:
	if current_recording.is_empty():
		return
	if current_recording["steps"].size() == 0:
		return
	
	var replay_to_save = current_recording.duplicate(true)
	replays.append(replay_to_save)
	
	if replays.size() > MAX_REPLAYS:
		replays.pop_front()
	
	EventBus.replay_recorded.emit(replay_to_save)

func get_replays() -> Array:
	return replays.duplicate()

func get_replay_count() -> int:
	return replays.size()

func get_replay(index: int) -> Dictionary:
	if index >= 0 and index < replays.size():
		return replays[index]
	return {}

func get_latest_replay() -> Dictionary:
	if replays.size() > 0:
		return replays[replays.size() - 1]
	return {}

func start_playback(replay_index: int) -> void:
	if replay_index >= 0 and replay_index < replays.size():
		current_replay_index = replay_index
		playback_step = 0
		is_playing = true

func stop_playback() -> void:
	is_playing = false
	current_replay_index = -1
	playback_step = 0

func step_playback_forward() -> Dictionary:
	if current_replay_index < 0 or current_replay_index >= replays.size():
		return {}
	var replay = replays[current_replay_index]
	var steps = replay.get("steps", [])
	if playback_step < steps.size():
		var step = steps[playback_step]
		playback_step += 1
		EventBus.playback_step.emit(playback_step - 1, step)
		return step
	return {}

func step_playback_backward() -> Dictionary:
	if current_replay_index < 0 or current_replay_index >= replays.size():
		return {}
	if playback_step > 0:
		playback_step -= 1
		var replay = replays[current_replay_index]
		var steps = replay.get("steps", [])
		var step = steps[playback_step]
		EventBus.playback_step.emit(playback_step, step)
		return step
	return {}

func get_current_playback_step() -> int:
	return playback_step

func get_total_steps() -> int:
	if current_replay_index >= 0 and current_replay_index < replays.size():
		return replays[current_replay_index].get("steps", []).size()
	return 0

func compare_replays(index1: int, index2: int) -> Dictionary:
	var replay1 = get_replay(index1)
	var replay2 = get_replay(index2)
	if replay1.is_empty() or replay2.is_empty():
		return {}
	
	var steps1: Array = replay1.get("steps", [])
	var steps2: Array = replay2.get("steps", [])
	
	var comparison = {
		"replay1_score": replay1.get("final_score", 0),
		"replay2_score": replay2.get("final_score", 0),
		"replay1_steps": steps1.size(),
		"replay2_steps": steps2.size(),
		"replay1_fail_reason": replay1.get("fail_reason", ""),
		"replay2_fail_reason": replay2.get("fail_reason", ""),
		"replay1_completed": replay1.get("projects_completed", 0),
		"replay2_completed": replay2.get("projects_completed", 0),
		"time_difference": 0,
		"key_differences": [],
		"action_summary1": _summarize_actions(steps1),
		"action_summary2": _summarize_actions(steps2)
	}
	
	var max_steps = max(steps1.size(), steps2.size())
	for i in range(max_steps):
		var s1 = steps1[i] if i < steps1.size() else null
		var s2 = steps2[i] if i < steps2.size() else null
		
		if s1 == null or s2 == null:
			comparison["key_differences"].append({
				"step": i,
				"type": "missing",
				"replay1_detail": _format_choice_safe(s1),
				"replay2_detail": _format_choice_safe(s2)
			})
			continue
		
		var key1 = _get_choice_key(s1)
		var key2 = _get_choice_key(s2)
		
		if key1 != key2:
			comparison["key_differences"].append({
				"step": i,
				"type": "choice_diff",
				"replay1_detail": _format_choice_safe(s1),
				"replay2_detail": _format_choice_safe(s2)
			})
	
	return comparison

func _get_choice_key(step) -> String:
	if step == null:
		return ""
	var step_type = step.get("type", "")
	var data = step.get("data", {})
	var action = data.get("action", "")
	
	match step_type:
		"customer":
			var c = data.get("customer", {})
			return "customer:%s:%s:%s" % [action, c.get("id", ""), c.get("name", "")]
		"project":
			var p = data.get("project", {})
			return "project:%s:%s:%s" % [action, p.get("id", ""), p.get("name", "")]
		"recharge":
			var r = data.get("recharge", {})
			var target = data.get("target_customer", {})
			return "recharge:%s:%s:%s:%s" % [action, r.get("id", ""), str(r.get("amount", 0)), target.get("id", "")]
		"item":
			return "item:%s:%s" % [action, data.get("item_id", "")]
		"anomaly":
			return "anomaly:%s:%s" % [data.get("type", ""), action]
		_:
			return "%s:%s" % [step_type, action]

func _format_choice_safe(step) -> String:
	if step == null:
		return "(无动作)"
	var step_type = step.get("type", "")
	var data = step.get("data", {})
	var action = data.get("action", "")
	var time_val = step.get("time", 0)
	var minutes = int(time_val) / 60
	var seconds = int(time_val) % 60
	var prefix = "[%02d:%02d] " % [minutes, seconds]
	
	match step_type:
		"customer":
			var c = data.get("customer", {})
			var cname = c.get("name", "未知")
			var ctype = c.get("type", "")
			var wanted = c.get("wanted_projects", [])
			var wanted_str = ""
			if wanted.size() > 0:
				wanted_str = wanted[0]
			match action:
				"spawn":
					return prefix + "顾客进店: %s (%s) 想做[%s]" % [cname, ctype, wanted_str]
				"click":
					return prefix + "点击顾客: %s (%s) 想做[%s]" % [cname, ctype, wanted_str]
				"leave":
					var reason = data.get("reason", "")
					return prefix + "顾客离开: %s 原因:%s" % [cname, reason]
				_:
					return prefix + "顾客%s: %s" % [action, cname]
		"project":
			var p = data.get("project", {})
			var pname = p.get("name", "未知")
			var ptype = p.get("type", "")
			var cid = p.get("customer_id", "")
			match action:
				"start":
					return prefix + "开始项目: %s (%s) 顾客:%s" % [pname, ptype, cid]
				"complete":
					var score = p.get("score", 0) if p is Dictionary else data.get("score", 0)
					return prefix + "完成项目: %s 得分:%s" % [pname, str(score)]
				"fail":
					var reason = data.get("reason", p.get("fail_reason", ""))
					return prefix + "项目失败: %s 原因:%s" % [pname, reason]
				_:
					return prefix + "项目%s: %s" % [action, pname]
		"recharge":
			var r = data.get("recharge", {})
			var amount = r.get("amount", 0)
			var rname = r.get("customer_name", "未知")
			var target = data.get("target_customer", {})
			var target_id = target.get("id", "")
			var target_name = target.get("name", "")
			var target_display = target_name if target_name != "" else target_id
			match action:
				"used":
					return prefix + "充值使用: ¥%.0f 卡[%s] → %s" % [amount, rname, target_display]
				_:
					return prefix + "充值%s: ¥%.0f 卡[%s]" % [action, amount, rname]
		"item":
			var item_id = data.get("item_id", "")
			var item_names = {
				"speed_boost": "加速药水",
				"supply_refill": "紧急补货",
				"charm": "魅力加成",
				"time_freeze": "时间冻结"
			}
			var iname = item_names.get(item_id, item_id)
			return prefix + "使用道具: %s" % iname
		"anomaly":
			var atype = data.get("type", "")
			var supply_names = {
				"shampoo": "洗发水",
				"conditioner": "护发素",
				"hair_color": "染发剂",
				"perm_solution": "烫发液"
			}
			var sname = supply_names.get(atype, atype)
			match action:
				"resolved_manual":
					return prefix + "解除异常: %s" % sname
				"triggered":
					return prefix + "异常触发: %s" % sname
				_:
					return prefix + "异常%s: %s" % [action, sname]
		_:
			return prefix + "%s:%s" % [step_type, action]

func _summarize_actions(steps: Array) -> Dictionary:
	var summary = {
		"customer_count": 0,
		"project_count": 0,
		"recharge_count": 0,
		"item_count": 0,
		"anomaly_count": 0
	}
	for step in steps:
		var step_type = step.get("type", "")
		match step_type:
			"customer":
				summary["customer_count"] += 1
			"project":
				summary["project_count"] += 1
			"recharge":
				summary["recharge_count"] += 1
			"item":
				summary["item_count"] += 1
			"anomaly":
				summary["anomaly_count"] += 1
	return summary

func clear_replays() -> void:
	replays.clear()
	current_replay_index = -1
	playback_step = 0
	is_playing = false

func set_playback_speed(speed: float) -> void:
	playback_speed = speed
