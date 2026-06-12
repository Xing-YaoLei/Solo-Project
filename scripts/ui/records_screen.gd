extends Control

@onready var back_btn: Button = $Background/TopBar/BackBtn
@onready var tab_container: TabContainer = $Background/TabContainer
@onready var records_tree: Tree = $Background/TabContainer/RecordsTab/VBoxContainer/RecordsTree
@onready var stats_tree: Tree = $Background/TabContainer/StatsTab/VBoxContainer/StatsTree
@onready var overview_panel: PanelContainer = $Background/TabContainer/StatsTab/VBoxContainer/OverviewPanel
@onready var total_games_label: Label = $Background/TabContainer/StatsTab/VBoxContainer/OverviewPanel/MarginContainer/VBoxContainer/TotalGamesLabel
@onready var avg_accuracy_label: Label = $Background/TabContainer/StatsTab/VBoxContainer/OverviewPanel/MarginContainer/VBoxContainer/AvgAccuracyLabel
@onready var avg_score_label: Label = $Background/TabContainer/StatsTab/VBoxContainer/OverviewPanel/MarginContainer/VBoxContainer/AvgScoreLabel
@onready var best_score_label: Label = $Background/TabContainer/StatsTab/VBoxContainer/OverviewPanel/MarginContainer/VBoxContainer/BestScoreLabel
@onready var loss_rate_tree: Tree = $Background/TabContainer/LossRateTab/VBoxContainer/LossRateTree
@onready var loss_rate_chart: Control = $Background/TabContainer/LossRateTab/VBoxContainer/LossRateChart

var _draw_connected: bool = false

func _ready() -> void:
	setup_connections()
	load_all_data()
	draw_loss_rate_chart()

func setup_connections() -> void:
	back_btn.pressed.connect(_on_back_pressed)
	tab_container.tab_changed.connect(_on_tab_changed)

func load_all_data() -> void:
	load_records()
	load_statistics()
	load_loss_rate_stats()

func load_records() -> void:
	records_tree.clear()
	records_tree.set_column_title(0, "时间")
	records_tree.set_column_title(1, "关卡")
	records_tree.set_column_title(2, "模式")
	records_tree.set_column_title(3, "得分")
	records_tree.set_column_title(4, "正确率")
	records_tree.set_column_title(5, "题数")
	
	var records: Array = DataManager.get_training_records(50)
	var mode_names: Dictionary = {0: "训练", 1: "自由练习"}
	var levels: Dictionary = {}
	for l in DataManager.get_levels():
		levels[l["id"]] = l["name"]
	
	for record in records:
		var item: TreeItem = records_tree.create_item()
		var timestamp: float = record.get("timestamp", 0)
		var time_str: String = Time.get_datetime_string_from_unix_time(timestamp, true)
		item.set_text(0, time_str)
		
		var level_id: String = record.get("level_id", "")
		item.set_text(1, levels.get(level_id, level_id))
		
		var mode: int = record.get("mode", 0)
		item.set_text(2, mode_names.get(mode, str(mode)))
		
		var score: int = record.get("score", 0)
		item.set_text(3, str(score))
		
		var accuracy: float = record.get("accuracy", 0)
		item.set_text(4, "%.1f%%" % accuracy)
		
		var total: int = record.get("total_questions", 0)
		var correct: int = record.get("correct_questions", 0)
		item.set_text(5, "%d/%d" % [correct, total])
		
		if accuracy >= 80:
			item.set_color(0, Color(0.2, 0.6, 0.2, 1))
		elif accuracy >= 60:
			item.set_color(0, Color(0.8, 0.6, 0.2, 1))
		else:
			item.set_color(0, Color(0.8, 0.3, 0.3, 1))

func load_statistics() -> void:
	stats_tree.clear()
	stats_tree.set_column_title(0, "关卡")
	stats_tree.set_column_title(1, "训练次数")
	stats_tree.set_column_title(2, "平均得分")
	stats_tree.set_column_title(3, "平均正确率")
	stats_tree.set_column_title(4, "最高分")
	stats_tree.set_column_title(5, "状态")
	
	var records: Array = DataManager.get_training_records()
	var level_stats: Dictionary = {}
	var levels: Array = DataManager.get_levels()
	
	for level in levels:
		level_stats[level["id"]] = {
			"name": level["name"],
			"count": 0,
			"total_score": 0,
			"total_accuracy": 0,
			"best_score": 0,
			"passed": false
		}
	
	for record in records:
		var level_id: String = record.get("level_id", "")
		if level_stats.has(level_id):
			level_stats[level_id]["count"] += 1
			level_stats[level_id]["total_score"] += record.get("score", 0)
			level_stats[level_id]["total_accuracy"] += record.get("accuracy", 0)
			level_stats[level_id]["best_score"] = max(level_stats[level_id]["best_score"], record.get("score", 0))
			var level: Dictionary = DataManager.get_level(level_id)
			if record.get("score", 0) >= level.get("pass_score", 60):
				level_stats[level_id]["passed"] = true
	
	var total_games: int = 0
	var total_score: int = 0
	var total_accuracy: float = 0
	var best_score: int = 0
	
	for level_id in level_stats:
		var stat: Dictionary = level_stats[level_id]
		var item: TreeItem = stats_tree.create_item()
		item.set_text(0, stat["name"])
		item.set_text(1, str(stat["count"]))
		
		var avg_score: float = 0
		var avg_accuracy: float = 0
		if stat["count"] > 0:
			avg_score = float(stat["total_score"]) / float(stat["count"])
			avg_accuracy = float(stat["total_accuracy"]) / float(stat["count"])
		
		item.set_text(2, "%.1f" % avg_score)
		item.set_text(3, "%.1f%%" % avg_accuracy)
		item.set_text(4, str(stat["best_score"]))
		item.set_text(5, "✅ 通过" if stat["passed"] else "❌ 未通过")
		
		total_games += stat["count"]
		total_score += stat["total_score"]
		total_accuracy += stat["total_accuracy"]
		best_score = max(best_score, stat["best_score"])
	
	total_games_label.text = "🎮 总训练次数：%d 次" % total_games
	
	var avg_acc: float = 0
	var avg_scr: float = 0
	if total_games > 0:
		avg_acc = total_accuracy / float(total_games)
		avg_scr = float(total_score) / float(total_games)
	
	avg_accuracy_label.text = "📊 平均正确率：%.1f%%" % avg_acc
	avg_score_label.text = "🏆 平均得分：%.1f 分" % avg_scr
	best_score_label.text = "⭐ 最高得分：%d 分" % best_score

func load_loss_rate_stats() -> void:
	loss_rate_tree.clear()
	loss_rate_tree.set_column_title(0, "门店")
	loss_rate_tree.set_column_title(1, "经理")
	loss_rate_tree.set_column_title(2, "目标损耗率")
	loss_rate_tree.set_column_title(3, "训练次数")
	loss_rate_tree.set_column_title(4, "正确判断")
	loss_rate_tree.set_column_title(5, "正确率")
	
	var stats: Dictionary = DataManager.get_loss_rate_statistics()
	var sorted_stores: Array = []
	for store_id in stats:
		sorted_stores.append(stats[store_id])
	sorted_stores.sort_custom(func(a, b): return a["target"] > b["target"])
	
	for stat in sorted_stores:
		var item: TreeItem = loss_rate_tree.create_item()
		item.set_text(0, stat["store_name"])
		var store: Dictionary = DataManager.get_store(stat["store_id"])
		item.set_text(1, store.get("manager", "-"))
		item.set_text(2, "%.1f%%" % stat["target"])
		
		var records: Array = stat["records"]
		item.set_text(3, str(records.size()))
		
		var correct: int = 0
		for r in records:
			if r.get("is_correct", false):
				correct += 1
		item.set_text(4, str(correct))
		
		var acc: float = 0
		if records.size() > 0:
			acc = float(correct) / float(records.size()) * 100.0
		item.set_text(5, "%.1f%%" % acc)
		
		if acc >= 80:
			item.set_color(0, Color(0.2, 0.6, 0.2, 1))
		elif acc >= 60:
			item.set_color(0, Color(0.8, 0.6, 0.2, 1))
		else:
			item.set_color(0, Color(0.8, 0.3, 0.3, 1))

func draw_loss_rate_chart() -> void:
	if not _draw_connected:
		var draw_script: GDScript = GDScript.new()
		draw_script.source_code = """
extends Control
var parent_ref = null
func _draw():
	if parent_ref:
		parent_ref.render_loss_rate_chart(self)
"""
		loss_rate_chart.set_script(draw_script)
		loss_rate_chart.parent_ref = self
		_draw_connected = true
	loss_rate_chart.queue_redraw()

func render_loss_rate_chart(draw_node: Control) -> void:
	var stats: Dictionary = DataManager.get_loss_rate_statistics()
	var stores: Array = []
	for store_id in stats:
		var store: Dictionary = DataManager.get_store(store_id)
		stores.append({
			"name": store.get("name", store_id),
			"target": stats[store_id]["target"],
			"records": stats[store_id]["records"]
		})
	
	stores.sort_custom(func(a, b): return a["target"] > b["target"])
	
	if stores.is_empty():
		return
	
	var size: Vector2 = draw_node.size
	var padding: float = 50
	var chart_width: float = size.x - padding * 2
	var chart_height: float = size.y - padding * 2
	var bar_width: float = chart_width / float(stores.size()) * 0.6
	var bar_gap: float = chart_width / float(stores.size()) * 0.4
	var max_value: float = 10
	
	for i in range(stores.size()):
		var bar_x: float = padding + i * (bar_width + bar_gap) + bar_gap / 2
		var target_height: float = (stores[i]["target"] / max_value) * chart_height
		
		draw_node.draw_rect(
			Rect2(bar_x, padding + chart_height - target_height, bar_width, target_height),
			Color(0.7, 0.5, 0.3, 1)
		)
		
		var records: Array = stores[i]["records"]
		var correct: int = 0
		for r in records:
			if r.get("is_correct", false):
				correct += 1
		var acc: float = 0
		if records.size() > 0:
			acc = float(correct) / float(records.size()) * 100.0
		var acc_height: float = (acc / 100.0) * chart_height * 0.3
		
		draw_node.draw_rect(
			Rect2(bar_x + 5, padding + chart_height - target_height - acc_height - 5, bar_width - 10, acc_height),
			Color(0.3, 0.6, 0.3, 1)
		)
		
		var font: Font = draw_node.get_theme_default_font()
		if font:
			draw_node.draw_string(
				font,
				Vector2(bar_x + bar_width / 2 - 30, size.y - padding + 20),
				stores[i]["name"],
				HORIZONTAL_ALIGNMENT_LEFT,
				-1,
				12,
				Color(0.2, 0.1, 0.05, 1)
			)
			
			draw_node.draw_string(
				font,
				Vector2(bar_x + bar_width / 2 - 25, padding + chart_height - target_height - 10),
				"%.1f%%" % stores[i]["target"],
				HORIZONTAL_ALIGNMENT_LEFT,
				-1,
				11,
				Color(0.5, 0.3, 0.1, 1)
			)
	
	draw_node.draw_line(
		Vector2(padding, padding),
		Vector2(padding, padding + chart_height),
		Color(0.5, 0.4, 0.3, 1),
		2
	)
	draw_node.draw_line(
		Vector2(padding, padding + chart_height),
		Vector2(size.x - padding, padding + chart_height),
		Color(0.5, 0.4, 0.3, 1),
		2
	)
	
	var font: Font = draw_node.get_theme_default_font()
	if font:
		draw_node.draw_string(
			font,
			Vector2(10, padding + 10),
			"目标损耗率",
			HORIZONTAL_ALIGNMENT_LEFT,
			-1,
			12,
			Color(0.7, 0.5, 0.3, 1)
		)
		draw_node.draw_string(
			font,
			Vector2(10, padding + 30),
			"判断正确率",
			HORIZONTAL_ALIGNMENT_LEFT,
			-1,
			12,
			Color(0.3, 0.6, 0.3, 1)
		)

func _on_back_pressed() -> void:
	AudioManager.play_click()
	GameManager.change_scene("Main")

func _on_tab_changed(tab_index: int) -> void:
	AudioManager.play_click()
	if tab_index == 2:
		draw_loss_rate_chart()
