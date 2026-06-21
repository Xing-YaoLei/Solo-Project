extends Control

@onready var _comparison_list: VBoxContainer = $VBoxContainer/ScrollContainer/ComparisonList
@onready var _chart: Control = $VBoxContainer/ChartArea
@onready var _back_btn: Button = $VBoxContainer/BackButton
@onready var _clear_btn: Button = $VBoxContainer/ClearButton

var _comparison_data: Dictionary = {}

func _ready() -> void:
	_comparison_data = StatsManager.get_level_comparison()
	_populate_list()
	_draw_comparison_chart()
	var btns: Array[BaseButton] = [_back_btn, _clear_btn]
	InputManager.setup_focus_group(btns)
	_back_btn.grab_focus()

func _populate_list() -> void:
	for child in _comparison_list.get_children():
		child.queue_free()
	if _comparison_data.is_empty():
		var label := Label.new()
		label.text = "暂无统计数据，完成关卡后即可查看"
		_comparison_list.add_child(label)
		return
	var level_ids := _comparison_data.keys()
	level_ids.sort()
	for lid in level_ids:
		var info: Dictionary = _comparison_data[lid]
		var label := Label.new()
		var best: float = info.get("best", -1.0)
		var avg: float = info.get("average", -1.0)
		var attempts: int = info.get("attempts", 0)
		var level_info := LevelData.get_level(lid)
		var title: String = level_info.get("title", lid)
		label.text = "%s | 最佳: %.1fs | 平均: %.1fs | 尝试: %d次" % [title, best, avg, attempts]
		label.autowrap_mode = TextServer.AUTOWRAP_WORD
		_comparison_list.add_child(label)

func _draw_comparison_chart() -> void:
	if _comparison_data.is_empty():
		return
	_chart.draw.connect(_on_chart_draw)

func _on_chart_draw() -> void:
	if _comparison_data.is_empty():
		return
	var rect := _chart.get_rect()
	var margin := 60.0
	var chart_w := rect.size.x - margin * 2.0
	var chart_h := rect.size.y - margin * 2.0
	var level_ids := _comparison_data.keys()
	level_ids.sort()
	var max_avg := 0.0
	for lid in level_ids:
		var avg: float = _comparison_data[lid].get("average", 0.0)
		max_avg = maxf(max_avg, avg)
	if max_avg <= 0.0:
		max_avg = 1.0
	var best_points := PackedVector2Array()
	var avg_points := PackedVector2Array()
	for i in range(level_ids.size()):
		var lid: String = level_ids[i]
		var x := margin + (float(i) / maxf(float(level_ids.size() - 1), 1.0)) * chart_w
		var best: float = _comparison_data[lid].get("best", 0.0)
		var avg: float = _comparison_data[lid].get("average", 0.0)
		best_points.append(Vector2(x, margin + chart_h - (best / max_avg) * chart_h))
		avg_points.append(Vector2(x, margin + chart_h - (avg / max_avg) * chart_h))
	if avg_points.size() >= 2:
		_chart.draw_polyline(avg_points, Color(1.0, 0.6, 0.2, 0.7), 2.0)
	if best_points.size() >= 2:
		_chart.draw_polyline(best_points, Color(0.2, 1.0, 0.5, 1.0), 3.0)
	for p in best_points:
		_chart.draw_circle(p, 5.0, Color(0.2, 1.0, 0.5, 1.0))
	for p in avg_points:
		_chart.draw_circle(p, 4.0, Color(1.0, 0.6, 0.2, 0.7))
	var legend_x := rect.size.x - 160.0
	_chart.draw_string(Label.new().get_theme_font("font"), Vector2(legend_x, margin), "● 最佳关闭时长", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(0.2, 1.0, 0.5, 1.0))
	_chart.draw_string(Label.new().get_theme_font("font"), Vector2(legend_x, margin + 22), "● 平均关闭时长", HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(1.0, 0.6, 0.2, 0.7))

func _on_back_button_pressed() -> void:
	SceneManager.goto_scene("res://scenes/main_menu/main_menu.tscn")

func _on_clear_button_pressed() -> void:
	StatsManager.clear_all()
	_comparison_data = StatsManager.get_level_comparison()
	_populate_list()
	_chart.queue_redraw()
