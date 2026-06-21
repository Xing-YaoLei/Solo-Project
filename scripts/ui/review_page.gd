extends Control

@onready var _level_label: Label = $VBoxContainer/LevelLabel
@onready var _history_list: VBoxContainer = $VBoxContainer/ScrollContainer/HistoryList
@onready var _chart: Control = $VBoxContainer/ChartArea
@onready var _back_btn: Button = $VBoxContainer/BackButton

var _level_id: String = ""
var _history: Array = []

func _ready() -> void:
	_level_id = GameManager.current_level_id
	_level_label.text = "复盘: %s" % _level_id
	_history = StatsManager.get_level_history(_level_id)
	_populate_history()
	_draw_chart()
	_back_btn.grab_focus()

func _populate_history() -> void:
	for child in _history_list.get_children():
		child.queue_free()
	for i in range(_history.size()):
		var entry: Dictionary = _history[i]
		var label := Label.new()
		var ct: float = entry.get("closure_time", 0.0)
		var sc: float = entry.get("score", 0.0)
		var tc: int = entry.get("timeout_count", 0)
		var mt: String = entry.get("method", "")
		var ts: String = entry.get("timestamp", "")
		label.text = "第%d次 | 关闭: %.1fs | 评分: %.0f | 超时: %d | 方式: %s | %s" % [i + 1, ct, sc, tc, mt, ts]
		label.autowrap_mode = TextServer.AUTOWRAP_WORD
		_history_list.add_child(label)

func _draw_chart() -> void:
	if _history.is_empty():
		return
	_chart.draw.connect(_on_chart_draw)

func _on_chart_draw() -> void:
	if _history.is_empty():
		return
	var rect := _chart.get_rect()
	var min_ct := INF
	var max_ct := -INF
	for entry in _history:
		var ct: float = entry.get("closure_time", 0.0)
		min_ct = minf(min_ct, ct)
		max_ct = maxf(max_ct, ct)
	if max_ct <= min_ct:
		max_ct = min_ct + 1.0
	var margin := 40.0
	var chart_w := rect.size.x - margin * 2.0
	var chart_h := rect.size.y - margin * 2.0
	var points := PackedVector2Array()
	for i in range(_history.size()):
		var ct: float = _history[i].get("closure_time", 0.0)
		var x := margin + (float(i) / maxf(float(_history.size() - 1), 1.0)) * chart_w
		var y := margin + chart_h - ((ct - min_ct) / (max_ct - min_ct)) * chart_h
		points.append(Vector2(x, y))
	if points.size() >= 2:
		_chart.draw_polyline(points, Color(0.2, 1.0, 0.5, 1.0), 3.0)
	for p in points:
		_chart.draw_circle(p, 6.0, Color(1.0, 0.8, 0.2, 1.0))

func _on_back_button_pressed() -> void:
	SceneManager.goto_scene("res://scenes/main_menu/main_menu.tscn")
