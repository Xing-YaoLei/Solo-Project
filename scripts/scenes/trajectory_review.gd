extends Control

var _trajectory_questions: Array = []
var _current_index: int = 0
var _time_remaining: float = 0.0
var _time_limit: float = 0.0
var _is_answered: bool = false

var _color_bg := Color.hex(0x1a1a2eff)
var _color_accent := Color.hex(0xe94560ff)
var _color_secondary := Color.hex(0x16213eff)
var _color_text := Color.hex(0xeeeeeeff)
var _color_success := Color.hex(0x4ecca3ff)
var _color_warning := Color.hex(0xffc857ff)

@onready var _timer_bar: ProgressBar = %TimerBar
@onready var _score_label: Label = %ScoreLabel
@onready var _question_label: Label = %QuestionLabel
@onready var _rider_name_label: Label = %RiderNameLabel
@onready var _order_id_label: Label = %OrderIdLabel
@onready var _duration_label: Label = %DurationLabel
@onready var _trajectory_canvas: Control = %TrajectoryCanvas
@onready var _normal_btn: Button = %NormalBtn
@onready var _abnormal_btn: Button = %AbnormalBtn
@onready var _result_label: Label = %ResultLabel
@onready var _anomaly_reason_label: Label = %AnomalyReasonLabel

func _ready() -> void:
	_load_trajectory_questions()
	if _trajectory_questions.is_empty():
		_show_no_questions()
		return
	_normal_btn.pressed.connect(func(): _handle_answer("normal"))
	_abnormal_btn.pressed.connect(func(): _handle_answer("abnormal"))
	_setup_question()

func _load_trajectory_questions() -> void:
	var all_questions: Array = GameManager.questions
	_trajectory_questions = all_questions.filter(func(q): return q.get("type", "") == "trajectory")

func _setup_question() -> void:
	_is_answered = false
	_result_label.text = ""
	_anomaly_reason_label.text = ""
	_normal_btn.disabled = false
	_abnormal_btn.disabled = false

	var question: Dictionary = _trajectory_questions[_current_index]
	_rider_name_label.text = question.get("rider_name", "未知骑手")
	_order_id_label.text = "订单号: %s" % question.get("order_id", "")
	var planned: int = question.get("planned_duration", 0)
	var actual: int = question.get("actual_duration", 0)
	_duration_label.text = "计划时长: %d分钟 | 实际时长: %d分钟 | 开始时间: %s" % [planned, actual, question.get("start_time", "")]
	_question_label.text = "第 %d / %d 题" % [_current_index + 1, _trajectory_questions.size()]
	_score_label.text = "得分: %d" % GameManager.total_score

	_draw_trajectory(question.get("trajectory_points", []))

	_time_limit = float(ConfigManager.get_time_limit(3))
	_time_remaining = _time_limit
	_timer_bar.max_value = _time_limit
	_timer_bar.value = _time_limit

func _draw_trajectory(points: Array) -> void:
	_trajectory_canvas.queue_redraw()
	_trajectory_canvas.connect("draw", func(): _on_canvas_draw(points))

func _on_canvas_draw(points: Array) -> void:
	if points.is_empty():
		return
	var canvas: Control = _trajectory_canvas
	var w: float = canvas.size.x
	var h: float = canvas.size.y

	var bg_style := StyleBoxFlat.new()
	bg_style.bg_color = Color(0.08, 0.08, 0.15)
	bg_style.set_corner_radius_all(8)
	canvas.draw_style_box(bg_style, Rect2(Vector2.ZERO, canvas.size))

	var padding: float = 40.0
	var max_x: float = 0.0
	var max_y: float = 0.0
	var min_x: float = 9999.0
	var min_y: float = 9999.0
	for p in points:
		max_x = max(max_x, float(p.x))
		max_y = max(max_y, float(p.y))
		min_x = min(min_x, float(p.x))
		min_y = min(min_y, float(p.y))

	var range_x: float = max(max_x - min_x, 1.0)
	var range_y: float = max(max_y - min_y, 1.0)
	var scale_x: float = (w - padding * 2) / range_x
	var scale_y: float = (h - padding * 2) / range_y
	var scale: float = min(scale_x, scale_y)

	var offset_x: float = padding + (w - padding * 2 - range_x * scale) / 2.0 - min_x * scale
	var offset_y: float = padding + (h - padding * 2 - range_y * scale) / 2.0 - min_y * scale

	var mapped_points: PackedVector2Array = PackedVector2Array()
	for p in points:
		mapped_points.append(Vector2(float(p.x) * scale + offset_x, float(p.y) * scale + offset_y))

	if mapped_points.size() >= 2:
		canvas.draw_polyline(mapped_points, _color_accent, 3.0, true)

	for i in range(points.size()):
		var p: Dictionary = points[i]
		var mp: Vector2 = mapped_points[i]
		var point_color: Color = _color_accent
		var is_anomaly: bool = p.get("label", "") != "" and p.get("label", "") != "取餐点" and p.get("label", "") != "送达点"
		if is_anomaly:
			point_color = _color_warning

		if p.get("label", "") == "取餐点":
			point_color = _color_success
		elif p.get("label", "") == "送达点":
			point_color = _color_success

		canvas.draw_circle(mp, 8.0, point_color)
		canvas.draw_arc(mp, 10.0, 0, TAU, 16, Color.WHITE, 2.0)

		var label_text: String = p.get("label", "")
		if label_text != "":
			var label_bg := StyleBoxFlat.new()
			label_bg.bg_color = Color(0, 0, 0, 0.7)
			label_bg.set_corner_radius_all(4)
			label_bg.content_margin_left = 8
			label_bg.content_margin_right = 8
			label_bg.content_margin_top = 4
			label_bg.content_margin_bottom = 4

			var label_size: Vector2 = Vector2(100, 24)
			var label_pos: Vector2 = mp + Vector2(12, -12)
			if label_pos.x + label_size.x > w:
				label_pos.x = mp.x - label_size.x - 12
			if label_pos.y < 0:
				label_pos.y = mp.y + 12

			canvas.draw_style_box(label_bg, Rect2(label_pos, label_size))

			var font: Font = ThemeDB.fallback_font
			canvas.draw_string(font, label_pos + Vector2(4, 18), label_text, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, _color_text)

func _handle_answer(answer: String) -> void:
	if _is_answered:
		return
	_is_answered = true
	_normal_btn.disabled = true
	_abnormal_btn.disabled = true

	var question: Dictionary = _trajectory_questions[_current_index]
	var correct_answer: String = question.get("correct_judgment", "")
	var is_correct: bool = (answer == correct_answer)

	if is_correct:
		GameManager.add_score(GameManager.Phase.TRAJECTORY_REVIEW, ConfigManager.get_score_per_correct() * 2)
		_result_label.text = "✅ 判断正确!"
		_result_label.add_theme_color_override("font_color", _color_success)
	else:
		var penalty: int = ConfigManager.get_score_penalty()
		GameManager.add_score(GameManager.Phase.TRAJECTORY_REVIEW, -penalty)
		_result_label.text = "❌ 判断错误!"
		_result_label.add_theme_color_override("font_color", _color_accent)

	if question.get("has_anomaly", false):
		var reason: String = question.get("anomaly_reason", "")
		if reason != "":
			_anomaly_reason_label.text = "异常说明: %s" % reason
			_anomaly_reason_label.add_theme_color_override("font_color", _color_warning)
	else:
		_anomaly_reason_label.text = "本次配送无异常情况。"
		_anomaly_reason_label.add_theme_color_override("font_color", _color_success)

	_score_label.text = "得分: %d" % GameManager.total_score
	_schedule_advance()

func _schedule_advance() -> void:
	get_tree().create_timer(2.5).timeout.connect(_do_advance)

func _do_advance() -> void:
	_current_index += 1
	if _current_index < _trajectory_questions.size():
		_setup_question()
	else:
		GameManager.advance_phase()

func _process(delta: float) -> void:
	if _is_answered or _trajectory_questions.is_empty():
		return
	_time_remaining -= delta
	_timer_bar.value = max(0.0, _time_remaining)
	if _time_remaining <= 0.0:
		_on_timeout()

func _on_timeout() -> void:
	if _is_answered:
		return
	_is_answered = true
	_normal_btn.disabled = true
	_abnormal_btn.disabled = true
	var penalty: int = ConfigManager.get_score_penalty()
	GameManager.add_score(GameManager.Phase.TRAJECTORY_REVIEW, -penalty)
	_result_label.text = "⏱ 超时!"
	_result_label.add_theme_color_override("font_color", _color_accent)
	_schedule_advance()

func _show_no_questions() -> void:
	_rider_name_label.text = "无轨迹处理题目"
	_result_label.text = "当前没有轨迹处理题目，将跳过此阶段"
	_normal_btn.visible = false
	_abnormal_btn.visible = false
	var skip_btn: Button = Button.new()
	skip_btn.text = "跳过"
	skip_btn.custom_minimum_size = Vector2(200, 48)
	var button_hbox: HBoxContainer = get_node_or_null("MarginContainer/MainVBox/ButtonHBox")
	if button_hbox:
		button_hbox.add_child(skip_btn)
	skip_btn.pressed.connect(func(): GameManager.advance_phase())
