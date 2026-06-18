extends Control

@onready var score_label: Label = $ScoreLabel
@onready var stats_panel: VBoxContainer = $StatsPanel
@onready var completeness_label: Label = $StatsPanel/CompletenessLabel
@onready var total_steps_label: Label = $StatsPanel/TotalStepsLabel
@onready var mistake_count_label: Label = $StatsPanel/MistakeCountLabel
@onready var slow_steps_label: Label = $StatsPanel/SlowStepsLabel
@onready var mistake_breakdown: RichTextLabel = $StatsPanel/MistakeBreakdown
@onready var mistakes_list: RichTextLabel = $MistakesList
@onready var retry_btn: Button = $ButtonsPanel/RetryBtn
@onready var replay_btn: Button = $ButtonsPanel/ReplayBtn
@onready var menu_btn: Button = $ButtonsPanel/MenuBtn

var last_stats: Dictionary = {}

func _ready() -> void:
	retry_btn.pressed.connect(_on_retry)
	replay_btn.pressed.connect(_on_replay)
	menu_btn.pressed.connect(_on_menu)
	GameManager.game_ended.connect(_on_game_ended)
	if GameManager.game_stats.total_games > 0:
		_build_from_game_manager()
	else:
		_build_from_last_replay()

func _on_game_ended(stats: Dictionary) -> void:
	last_stats = stats
	_populate(stats)

func _build_from_game_manager() -> void:
	var history: Array = GameManager.get_replay_history()
	if history.size() > 0:
		last_stats = history[0].get("stats", {})
		_populate(last_stats)

func _build_from_last_replay() -> void:
	var history: Array = ReplayManager.get_profile_failure_replays()
	if history.size() > 0:
		last_stats = {}
		_populate(last_stats)

func _populate(stats: Dictionary) -> void:
	score_label.text = "总分: %d" % stats.get("total_score", 0)
	var avg_completeness: float = stats.get("average_completeness", 1.0)
	completeness_label.text = "资料平均完整率: %.1f%%" % (avg_completeness * 100)
	total_steps_label.text = "总操作步数: %d" % stats.get("step_durations", []).size()
	var mistakes: Array = stats.get("mistakes", [])
	mistake_count_label.text = "错误次数: %d" % mistakes.size()
	var slow_steps: Array = stats.get("slow_steps", [])
	slow_steps_label.text = "卡顿步骤数: %d（超过平均用时1.8倍）" % slow_steps.size()
	_populate_mistake_breakdown(stats)
	_populate_mistake_list(mistakes)

func _populate_mistake_breakdown(stats: Dictionary) -> void:
	var dist: Dictionary = stats.get("mistake_distribution", {})
	if dist.is_empty():
		dist = GameManager.game_stats.get("mistake_distribution", {})
	var text: String = ""
	var history_related_count: int = 0
	var total_mistakes: int = 0
	for key in dist.keys():
		var count: int = dist[key]
		total_mistakes += count
		var mistake_type: int = int(key)
		var type_name: String = GameManager.get_mistake_type_name(mistake_type)
		var is_history: bool = mistake_type == GameManager.MistakeType.WRONG_TIMELINE
		if is_history:
			history_related_count += count
		if is_history:
			text += "• [color=#ffbb55]%s[/color]: %d 次  [color=#8899bb](历史时间线相关)[/color]\n" % [type_name, count]
		elif mistake_type == GameManager.MistakeType.INCOMPLETE_PROFILE:
			text += "• [color=#ff7788]%s[/color]: %d 次\n" % [type_name, count]
		elif mistake_type == GameManager.MistakeType.MISSING_DATA_IGNORED:
			text += "• [color=#ff9944]%s[/color]: %d 次\n" % [type_name, count]
		else:
			text += "• %s: %d 次\n" % [type_name, count]
	if total_mistakes == 0:
		text = "[color=#66dd88]本次训练未出现错误，表现优秀！[/color]"
	else:
		if history_related_count > 0:
			text += "\n[color=#aa99ff]历史记录相关错误占比: %.1f%%[/color]" % (float(history_related_count) / float(total_mistakes) * 100)
	mistake_breakdown.text = text

func _populate_mistake_list(mistakes: Array) -> void:
	if mistakes.is_empty():
		mistakes_list.text = "[color=#66dd88]本次训练无错误记录[/color]"
		return
	var text: String = ""
	for i in range(mistakes.size()):
		var m: Dictionary = mistakes[i]
		var type_name: String = GameManager.get_mistake_type_name(m.get("mistake_type", 0))
		var challenge_name: String = GameManager.get_challenge_type_name(m.get("challenge_type", 0))
		var duration: float = m.get("duration", 0.0)
		text += "[%d] 第%d轮 · %s\n" % [i + 1, m.get("round", 0), challenge_name]
		text += "   错误类型: [color=#ff7788]%s[/color]   用时: %.1fs\n" % [type_name, duration]
		if m.has("player_choice"):
			var pc: Dictionary = m["player_choice"]
			if pc.has("item"):
				text += "   选项: \"%s\" → 玩家判断:%s  实际:%s\n\n" % [
					pc["item"],
					"已授权" if pc.get("player_says_authorized", false) else "未授权",
					"已授权" if pc.get("actually_authorized", false) else "未授权"
				]
			elif pc.has("phase"):
				text += "   %s变更 → 玩家:%s  实际:%s (原因: %s)\n\n" % [
					pc["phase"],
					"批准" if pc.get("player_approves", false) else "驳回",
					"批准" if pc.get("actually_valid", false) else "驳回",
					pc.get("reason", "")
				]
			elif pc.has("field"):
				text += "   字段: %s → 玩家判断:%s  实际:%s\n\n" % [
					pc["field"],
					"缺失" if pc.get("player_says_missing", false) else "完整",
					"缺失" if pc.get("actually_missing", false) else "完整"
				]
			elif pc.get("timeout", false):
				text += "   （超时未操作）\n\n"
			elif pc.get("ignored_missing_hint", false):
				text += "   （未确认资料缺失提示）\n\n"
			else:
				text += "\n"
	mistakes_list.text = text

func _on_retry() -> void:
	GameManager.start_new_game()
	get_tree().change_scene_to_file("res://scenes/Gameplay.tscn")

func _on_replay() -> void:
	var history: Array = GameManager.get_replay_history()
	if history.size() > 0:
		ReplayManager.load_replay(history[0])
	get_tree().change_scene_to_file("res://scenes/Replay.tscn")

func _on_menu() -> void:
	GameManager.save_persistent_data()
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")
