extends Control

@onready var overview_content: VBoxContainer = $OverviewPanel/OverviewContent
@onready var completeness_chart: RichTextLabel = $CompletenessPanel/CompletenessChart
@onready var mistakes_content: RichTextLabel = $MistakesPanel/MistakesContent
@onready var history_content: RichTextLabel = $HistoryPanel/HistoryContent
@onready var back_btn: Button = $BackBtn

func _ready() -> void:
	back_btn.pressed.connect(_on_back)
	_populate_overview()
	_populate_completeness()
	_populate_mistakes()
	_populate_history()

func _populate_overview() -> void:
	for child in overview_content.get_children():
		child.queue_free()
	var stats: Dictionary = GameManager.game_stats
	var total_games: int = stats.get("total_games", 0)
	var total_steps: int = stats.get("total_steps", 0)
	var correct_steps: int = stats.get("correct_steps", 0)
	var accuracy: float = 0.0
	if total_steps > 0:
		accuracy = float(correct_steps) / float(total_steps) * 100
	var avg_completeness: float = _calc_avg_from_stats() * 100
	var labels := [
		"累计训练次数: %d" % total_games,
		"累计操作步数: %d" % total_steps,
		"正确步数: %d" % correct_steps,
		"整体正确率: %.1f%%" % accuracy,
		"资料平均完整率: %.1f%%" % avg_completeness
	]
	for txt in labels:
		var lbl := Label.new()
		lbl.text = txt
		lbl.add_theme_font_size_override("font_size", 20)
		lbl.add_theme_color_override("font_color", Color(0.9, 0.93, 1, 1))
		overview_content.add_child(lbl)
	if total_games == 0:
		var hint_lbl := Label.new()
		hint_lbl.text = "\n[color=#8899aa]暂无训练数据，开始训练后此处会显示统计数据[/color]"
		hint_lbl.add_theme_font_size_override("font_size", 16)
		overview_content.add_child(hint_lbl)

func _populate_completeness() -> void:
	var completeness_list: Array = GameManager.game_stats.get("profile_completeness", [])
	if completeness_list.is_empty():
		completeness_chart.text = "[color=#8899aa]暂无档案核查数据[/color]\n完成基础档案类任务后此处会显示完整率趋势"
		return
	var text: String = ""
	var recent: Array = completeness_list
	if recent.size() > 10:
		recent = recent.slice(recent.size() - 10)
	text += "最近 %d 次档案完整率：\n\n" % recent.size()
	for i in range(recent.size()):
		var c: float = recent[i] * 100
		var bar_len: int = int(c / 5)
		var bar: String = "█" * bar_len
		var color_hex: String = "#66dd88" if c >= 80 else ("#ffbb44" if c >= 60 else "#ff6677")
		text += "#%02d  [color=%s]%s[/color]  [color=%s]%.0f%%[/color]\n" % [i + 1, color_hex, bar, color_hex, c]
	var avg: float = 0.0
	for c in completeness_list:
		avg += c
	avg = avg / completeness_list.size() * 100
	text += "\n[b]累计平均完整率: [color=#88aaff]%.1f%%[/color][/b]" % avg
	completeness_chart.text = text

func _populate_mistakes() -> void:
	var dist: Dictionary = GameManager.game_stats.get("mistake_distribution", {})
	if dist.is_empty():
		mistakes_content.text = "[color=#8899aa]暂无错误记录[/color]"
		return
	var text: String = ""
	var total: int = 0
	for key in dist.keys():
		total += dist[key]
	var sorted_keys: Array = dist.keys()
	sorted_keys.sort_custom(func(a, b): return dist[b] - dist[a])
	for key in sorted_keys:
		var count: int = dist[key]
		var mistake_type: int = int(key)
		var type_name: String = GameManager.get_mistake_type_name(mistake_type)
		var pct: float = float(count) / float(total) * 100
		var bar_len: int = int(pct / 3)
		var bar: String = "▓" * bar_len
		var color: String
		match mistake_type:
			GameManager.MistakeType.WRONG_AUTHORITY:
				color = "#ff7788"
			GameManager.MistakeType.WRONG_TIMELINE:
				color = "#ffbb55"
			GameManager.MistakeType.INCOMPLETE_PROFILE:
				color = "#ff5577"
			GameManager.MistakeType.TIMEOUT:
				color = "#ff9988"
			GameManager.MistakeType.MISSING_DATA_IGNORED:
				color = "#ffaa44"
			_:
				color = "#aaaaaa"
		text += "[color=%s]%s[/color]\n  %s  %d次 (%.1f%%)\n\n" % [color, type_name, bar, count, pct]
		if mistake_type == GameManager.MistakeType.WRONG_TIMELINE:
			text += "  [color=#aa99ff]→ 历史时间线相关错误，建议复盘时间线审批逻辑[/color]\n\n"
		elif mistake_type == GameManager.MistakeType.MISSING_DATA_IGNORED:
			text += "  [color=#aa99ff]→ 忽略资料缺失提示，建议关注顶部橙色警告条[/color]\n\n"
	text += "[b]错误总计: %d 次[/b]" % total
	mistakes_content.text = text

func _populate_history() -> void:
	var history: Array = GameManager.get_replay_history()
	if history.is_empty():
		history_content.text = "[color=#8899aa]暂无历史训练记录[/color]"
		return
	var text: String = ""
	for i in range(history.size()):
		var entry: Dictionary = history[i]
		var stats: Dictionary = entry.get("stats", {})
		var mistakes: Array = stats.get("mistakes", [])
		text += "[b]#%d[/b]  %s\n" % [i + 1, entry.get("timestamp", "?")]
		text += "  分数: %d    错误: %d次\n" % [stats.get("total_score", 0), mistakes.size()]
		var completeness: float = stats.get("average_completeness", 1.0) * 100
		text += "  完整率: %.0f%%\n\n" % completeness
	history_content.text = text

func _on_back() -> void:
	get_tree().change_scene_to_file("res://scenes/MainMenu.tscn")

func _calc_avg_from_stats() -> float:
	var list: Array = GameManager.game_stats.get("profile_completeness", [])
	if list.is_empty():
		return 1.0
	var total: float = 0.0
	for c in list:
		total += c
	return total / list.size()
