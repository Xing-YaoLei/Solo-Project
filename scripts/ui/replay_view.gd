extends Control

var selected_replay_index: int = -1
var current_step: int = 0
var compare1_index: int = -1
var compare2_index: int = -1

@onready var replay_list: ItemList = $ReplayListPanel/VBoxContainer/ReplayList
@onready var info_score: Label = $ReplayInfo/InfoVBox/InfoScore
@onready var info_fail_reason: Label = $ReplayInfo/InfoVBox/InfoFailReason
@onready var info_steps: Label = $ReplayInfo/InfoVBox/InfoSteps
@onready var compare1_button: OptionButton = $ComparePanel/CompareVBox/SelectRow/Compare1Button
@onready var compare2_button: OptionButton = $ComparePanel/CompareVBox/SelectRow/Compare2Button
@onready var compare_button: Button = $ComparePanel/CompareVBox/CompareButton
@onready var compare_result_vbox: VBoxContainer = $ComparePanel/CompareResult/CompareResultVBox
@onready var step_info: Label = $PlaybackPanel/PlaybackVBox/StepInfo
@onready var step_content: Label = $PlaybackPanel/StepDisplay/StepContent
@onready var prev_button: Button = $PlaybackPanel/PlaybackVBox/PlaybackControls/PrevButton
@onready var next_button: Button = $PlaybackPanel/PlaybackVBox/PlaybackControls/NextButton
@onready var back_button: Button = $BackButton

func _ready() -> void:
	_setup_signals()
	_populate_replay_list()
	_populate_compare_options()
	_update_ui_state()

func _setup_signals() -> void:
	replay_list.item_selected.connect(_on_replay_selected)
	compare_button.pressed.connect(_on_compare_pressed)
	prev_button.pressed.connect(_on_prev_pressed)
	next_button.pressed.connect(_on_next_pressed)
	back_button.pressed.connect(_on_back_pressed)

func _populate_replay_list() -> void:
	replay_list.clear()
	var replays = ReplayManager.get_replays()
	if replays.size() == 0:
		replay_list.add_item("暂无回放记录")
		replay_list.set_item_disabled(0, true)
		return
	
	for i in range(replays.size()):
		var replay = replays[i]
		var score = replay.get("final_score", 0)
		var fail_reason = replay.get("fail_reason", "未达标")
		var completed = replay.get("projects_completed", 0)
		var steps = replay.get("steps", []).size()
		var text = "#%d  得分:%d  完成:%d  步数:%d  原因:%s" % [i + 1, score, completed, steps, fail_reason]
		replay_list.add_item(text)

func _populate_compare_options() -> void:
	compare1_button.clear()
	compare2_button.clear()
	
	var replays = ReplayManager.get_replays()
	if replays.size() == 0:
		compare1_button.add_item("无可用回放")
		compare2_button.add_item("无可用回放")
		compare1_button.disabled = true
		compare2_button.disabled = true
		compare_button.disabled = true
		return
	
	for i in range(replays.size()):
		var label = "回放 %d" % (i + 1)
		compare1_button.add_item(label)
		compare2_button.add_item(label)
	
	if replays.size() > 0:
		compare1_index = 0
		compare1_button.select(0)
	if replays.size() > 1:
		compare2_index = 1
		compare2_button.select(1)
	
	compare1_button.disabled = false
	compare2_button.disabled = false
	compare_button.disabled = replays.size() < 2

func _on_replay_selected(index: int) -> void:
	selected_replay_index = index
	current_step = 0
	_load_replay_info(index)
	_update_step_display()
	_update_ui_state()

func _load_replay_info(index: int) -> void:
	var replay = ReplayManager.get_replay(index)
	if replay.is_empty():
		return
	
	info_score.text = "最终得分: %d" % replay.get("final_score", 0)
	info_fail_reason.text = "失败原因: %s" % replay.get("fail_reason", "未知")
	info_steps.text = "操作步数: %d" % replay.get("steps", []).size()

func _update_step_display() -> void:
	if selected_replay_index < 0:
		step_info.text = "步骤: 0 / 0"
		step_content.text = "选择一个回放开始浏览"
		return
	
	var replay = ReplayManager.get_replay(selected_replay_index)
	var steps = replay.get("steps", [])
	var total_steps = steps.size()
	
	step_info.text = "步骤: %d / %d" % [current_step + 1, total_steps]
	
	if current_step >= 0 and current_step < total_steps:
		var step = steps[current_step]
		var step_type = step.get("type", "unknown")
		var step_data = step.get("data", {})
		var step_time = step.get("time", 0)
		
		var desc = ""
		var minutes = int(step_time) / 60
		var seconds = int(step_time) % 60
		desc += "时间: %02d:%02d\n" % [minutes, seconds]
		desc += "类型: %s\n" % step_type
		
		match step_type:
			"customer":
				var action = step_data.get("action", "")
				var customer = step_data.get("customer", {})
				var cname = customer.get("name", "未知")
				desc += "动作: 顾客 %s - %s" % [cname, action]
			"project":
				var action = step_data.get("action", "")
				var project = step_data.get("project", {})
				var pname = project.get("name", "未知")
				desc += "动作: 项目 %s - %s" % [pname, action]
			"recharge":
				var action = step_data.get("action", "")
				var recharge = step_data.get("recharge", {})
				var amount = recharge.get("amount", 0)
				desc += "动作: 充值 ¥%.0f - %s" % [amount, action]
			"item":
				var item_id = step_data.get("item_id", "")
				desc += "动作: 使用道具 %s" % item_id
			"anomaly":
				var type = step_data.get("type", "")
				var action = step_data.get("action", "")
				desc += "动作: 耗材异常 %s - %s" % [type, action]
			_:
				desc += "数据: " + str(step_data)
		
		step_content.text = desc
	else:
		step_content.text = "无更多步骤"

func _on_prev_pressed() -> void:
	if selected_replay_index < 0:
		return
	if current_step > 0:
		current_step -= 1
		ReplayManager.step_playback_backward()
		_update_step_display()

func _on_next_pressed() -> void:
	if selected_replay_index < 0:
		return
	var replay = ReplayManager.get_replay(selected_replay_index)
	var steps = replay.get("steps", [])
	if current_step < steps.size() - 1:
		current_step += 1
		ReplayManager.step_playback_forward()
		_update_step_display()

func _on_compare_pressed() -> void:
	compare1_index = compare1_button.selected
	compare2_index = compare2_button.selected
	
	if compare1_index == compare2_index:
		_show_compare_result_message("请选择两个不同的回放进行对比")
		return
	
	var comparison = ReplayManager.compare_replays(compare1_index, compare2_index)
	_show_comparison_result(comparison)

func _show_comparison_result(comparison: Dictionary) -> void:
	for child in compare_result_vbox.get_children():
		child.queue_free()
	
	if comparison.is_empty():
		_show_compare_result_message("对比数据为空")
		return
	
	var score1 = comparison.get("replay1_score", 0)
	var score2 = comparison.get("replay2_score", 0)
	var steps1 = comparison.get("replay1_steps", 0)
	var steps2 = comparison.get("replay2_steps", 0)
	var reason1 = comparison.get("replay1_fail_reason", "")
	var reason2 = comparison.get("replay2_fail_reason", "")
	var completed1 = comparison.get("replay1_completed", 0)
	var completed2 = comparison.get("replay2_completed", 0)
	var differences = comparison.get("key_differences", [])
	var summary1 = comparison.get("action_summary1", {})
	var summary2 = comparison.get("action_summary2", {})
	
	var title = Label.new()
	title.text = "📊 对比结果"
	title.theme_override_colors.font_color = Color(0.4, 0.3, 0.25, 1)
	title.theme_override_font_sizes.font_size = 14
	compare_result_vbox.add_child(title)
	
	var score_row = Label.new()
	score_row.text = "得分: %d vs %d (差 %+d)" % [score1, score2, score1 - score2]
	score_row.theme_override_font_sizes.font_size = 12
	compare_result_vbox.add_child(score_row)
	
	var completed_row = Label.new()
	completed_row.text = "完成项目: %d vs %d" % [completed1, completed2]
	completed_row.theme_override_font_sizes.font_size = 12
	compare_result_vbox.add_child(completed_row)
	
	var steps_row = Label.new()
	steps_row.text = "操作步数: %d vs %d" % [steps1, steps2]
	steps_row.theme_override_font_sizes.font_size = 12
	compare_result_vbox.add_child(steps_row)
	
	var summary1_label = Label.new()
	summary1_label.text = "回放1动作: 顾客%d 项目%d 充值%d 道具%d" % [
		summary1.get("customer_count", 0),
		summary1.get("project_count", 0),
		summary1.get("recharge_count", 0),
		summary1.get("item_count", 0)
	]
	summary1_label.theme_override_font_sizes.font_size = 11
	compare_result_vbox.add_child(summary1_label)
	
	var summary2_label = Label.new()
	summary2_label.text = "回放2动作: 顾客%d 项目%d 充值%d 道具%d" % [
		summary2.get("customer_count", 0),
		summary2.get("project_count", 0),
		summary2.get("recharge_count", 0),
		summary2.get("item_count", 0)
	]
	summary2_label.theme_override_font_sizes.font_size = 11
	compare_result_vbox.add_child(summary2_label)
	
	var reason1_label = Label.new()
	reason1_label.text = "回放1失败: " + (reason1 if reason1 != "" else "未达标")
	reason1_label.theme_override_colors.font_color = Color(0.8, 0.4, 0.3, 1)
	reason1_label.theme_override_font_sizes.font_size = 11
	compare_result_vbox.add_child(reason1_label)
	
	var reason2_label = Label.new()
	reason2_label.text = "回放2失败: " + (reason2 if reason2 != "" else "未达标")
	reason2_label.theme_override_colors.font_color = Color(0.8, 0.4, 0.3, 1)
	reason2_label.theme_override_font_sizes.font_size = 11
	compare_result_vbox.add_child(reason2_label)
	
	if differences.size() > 0:
		var diff_title = Label.new()
		diff_title.text = "\n🔍 关键差异 (前8条):"
		diff_title.theme_override_colors.font_color = Color(0.4, 0.4, 0.6, 1)
		diff_title.theme_override_font_sizes.font_size = 12
		compare_result_vbox.add_child(diff_title)
		
		for i in range(min(differences.size(), 8)):
			var diff = differences[i]
			var step_idx = diff.get("step", 0)
			var a1 = diff.get("replay1_action", "")
			var a2 = diff.get("replay2_action", "")
			var diff_label = Label.new()
			diff_label.text = "  第%d步:\n    回放1: %s\n    回放2: %s" % [step_idx + 1, a1, a2]
			diff_label.theme_override_font_sizes.font_size = 10
			diff_label.autowrap_mode = 3
			compare_result_vbox.add_child(diff_label)

func _show_compare_result_message(msg: String) -> void:
	for child in compare_result_vbox.get_children():
		child.queue_free()
	var label = Label.new()
	label.text = msg
	label.theme_override_colors.font_color = Color(0.5, 0.5, 0.5, 1)
	compare_result_vbox.add_child(label)

func _update_ui_state() -> void:
	var has_selection = selected_replay_index >= 0
	prev_button.disabled = not has_selection or current_step <= 0
	
	var total_steps = 0
	if has_selection:
		var replay = ReplayManager.get_replay(selected_replay_index)
		total_steps = replay.get("steps", []).size()
	next_button.disabled = not has_selection or current_step >= total_steps - 1

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
