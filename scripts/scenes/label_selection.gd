extends Control

var _label_questions: Array = []
var _current_index: int = 0
var _selected_labels: Array = []
var _button_map: Dictionary = {}
var _time_remaining: float = 0.0
var _time_limit: float = 0.0
var _is_answered: bool = false
var _is_feedback: bool = false

@onready var _timer_bar: ProgressBar = %TimerBar
@onready var _score_label: Label = %ScoreLabel
@onready var _question_label: Label = %QuestionLabel
@onready var _item_name_label: Label = %ItemNameLabel
@onready var _item_desc_label: Label = %ItemDescLabel
@onready var _labels_grid: GridContainer = %LabelsGrid
@onready var _submit_button: Button = %SubmitButton
@onready var _result_label: Label = %ResultLabel


func _ready() -> void:
	_load_label_questions()
	if _label_questions.is_empty():
		_show_no_questions()
		return
	_submit_button.pressed.connect(_on_submit)
	_setup_question()


func _load_label_questions() -> void:
	var all_questions: Array = GameManager.questions
	_label_questions = all_questions.filter(func(q): return q.get("type", "") == "label")


func _setup_question() -> void:
	_selected_labels.clear()
	_is_answered = false
	_is_feedback = false
	_result_label.text = ""
	_submit_button.disabled = false
	_submit_button.text = "提交"

	var question: Dictionary = _label_questions[_current_index]
	_item_name_label.text = question.get("item_name", "")
	_item_desc_label.text = question.get("description", "")
	_question_label.text = "第 %d / %d 题" % [_current_index + 1, _label_questions.size()]
	_score_label.text = "得分: %d" % GameManager.total_score

	_build_label_buttons(question.get("available_labels", []))

	_time_limit = float(ConfigManager.get_time_limit(1))
	_time_remaining = _time_limit
	_timer_bar.max_value = _time_limit
	_timer_bar.value = _time_limit


func _build_label_buttons(labels: Array) -> void:
	for child in _labels_grid.get_children():
		child.queue_free()
	_button_map.clear()

	for label_text in labels:
		var btn: Button = Button.new()
		btn.text = label_text
		btn.toggle_mode = true
		btn.custom_minimum_size = Vector2(0, 48)
		btn.add_theme_color_override("font_color", Color(0.933, 0.933, 0.933))
		btn.add_theme_color_override("font_hover_color", Color(1, 1, 1))
		btn.add_theme_color_override("font_pressed_color", Color(1, 1, 1))
		btn.add_theme_stylebox_override("normal", _make_stylebox(Color(0.15, 0.15, 0.25)))
		btn.add_theme_stylebox_override("hover", _make_stylebox(Color(0.22, 0.22, 0.38)))
		btn.add_theme_stylebox_override("pressed", _make_stylebox(Color(0.914, 0.271, 0.376)))
		btn.add_theme_stylebox_override("pressed_hover", _make_stylebox(Color(0.914, 0.271, 0.376)))
		btn.toggled.connect(_on_label_toggled.bind(label_text))
		_labels_grid.add_child(btn)
		_button_map[label_text] = btn


func _make_stylebox(color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	style.border_color = Color(0.3, 0.3, 0.45)
	style.border_width_top = 1
	style.border_width_bottom = 1
	style.border_width_left = 1
	style.border_width_right = 1
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	style.content_margin_left = 16
	style.content_margin_right = 16
	return style


func _on_label_toggled(pressed: bool, label_text: String) -> void:
	if pressed:
		if label_text not in _selected_labels:
			_selected_labels.append(label_text)
	else:
		_selected_labels.erase(label_text)


func _on_submit() -> void:
	if _is_feedback:
		_advance()
		return
	if _is_answered:
		return
	_submit_answer()


func _submit_answer() -> void:
	_is_answered = true
	_submit_button.disabled = true

	var question: Dictionary = _label_questions[_current_index]
	var correct_labels: Array = question.get("correct_labels", [])

	var score: int = 0
	var correct_count: int = 0
	var wrong_count: int = 0
	var missed: Array = []

	for label in _selected_labels:
		if label in correct_labels:
			score += ConfigManager.get_score_per_correct()
			correct_count += 1
		else:
			score -= ConfigManager.get_score_penalty()
			wrong_count += 1

	for label in correct_labels:
		if label not in _selected_labels:
			missed.append(label)

	GameManager.add_score(GameManager.Phase.LABEL_SELECTION, score)
	_score_label.text = "得分: %d" % GameManager.total_score

	_show_feedback(correct_labels, missed, score)


func _show_feedback(correct_labels: Array, missed: Array, score: int) -> void:
	_is_feedback = true

	for label_text in _button_map:
		var btn: Button = _button_map[label_text]
		btn.disabled = true
		btn.toggle_mode = false
		var is_correct: bool = label_text in correct_labels
		var was_selected: bool = label_text in _selected_labels
		var was_missed: bool = label_text in missed

		if was_selected and is_correct:
			btn.add_theme_stylebox_override("disabled", _make_stylebox(Color(0.306, 0.8, 0.639)))
			btn.add_theme_color_override("font_disabled_color", Color(0, 0, 0))
		elif was_selected and not is_correct:
			btn.add_theme_stylebox_override("disabled", _make_stylebox(Color(0.914, 0.271, 0.376)))
			btn.add_theme_color_override("font_disabled_color", Color(1, 1, 1))
		elif was_missed:
			btn.add_theme_stylebox_override("disabled", _make_stylebox(Color(0.9, 0.85, 0.2)))
			btn.add_theme_color_override("font_disabled_color", Color(0, 0, 0))
			btn.button_pressed = true

	var feedback_text: String = "本题得分: %+d" % score
	if not missed.is_empty():
		feedback_text += "\n正确标签: %s" % ", ".join(PackedStringArray(correct_labels))
		feedback_text += "\n遗漏标签: %s" % ", ".join(PackedStringArray(missed))
	_result_label.text = feedback_text

	_submit_button.disabled = false
	if _current_index < _label_questions.size() - 1:
		_submit_button.text = "下一题"
	else:
		_submit_button.text = "下一阶段"


func _advance() -> void:
	_current_index += 1
	if _current_index < _label_questions.size():
		_setup_question()
	else:
		GameManager.advance_phase()


func _process(delta: float) -> void:
	if _is_answered or _label_questions.is_empty():
		return
	_time_remaining -= delta
	_timer_bar.value = max(0.0, _time_remaining)
	if _time_remaining <= 0.0:
		_on_timeout()


func _on_timeout() -> void:
	if _is_answered:
		return
	_submit_answer()
	_result_label.text = "时间到！\n" + _result_label.text


func _show_no_questions() -> void:
	_item_name_label.text = "无标签题目"
	_item_desc_label.text = ""
	_result_label.text = "当前没有标签选择题目，将跳过此阶段"
	_submit_button.text = "跳过"
	_submit_button.pressed.connect(func(): GameManager.advance_phase())
