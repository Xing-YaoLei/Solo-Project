extends Control

var _photo_questions: Array = []
var _current_index: int = 0
var _time_limit: float = 0.0
var _time_remaining: float = 0.0
var _is_answered: bool = false
var _timer_active: bool = false

@onready var _timer_bar: ProgressBar = %TimerBar
@onready var _score_label: Label = %ScoreLabel
@onready var _question_label: Label = %QuestionLabel
@onready var _photo_rect: TextureRect = %PhotoRect
@onready var _fallback_rect: ColorRect = %FallbackRect
@onready var _fallback_desc: Label = %FallbackDesc
@onready var _intact_btn: Button = %IntactBtn
@onready var _damaged_btn: Button = %DamagedBtn
@onready var _damage_popup: Panel = %DamagePopup
@onready var _damage_reason_label: Label = %DamageReasonLabel
@onready var _popup_ok_btn: Button = %PopupOkBtn
@onready var _feedback_label: Label = %FeedbackLabel

func _ready() -> void:
	_intact_btn.pressed.connect(_on_intact_pressed)
	_damaged_btn.pressed.connect(_on_damaged_pressed)
	_popup_ok_btn.pressed.connect(_on_popup_ok_pressed)
	GameManager.score_updated.connect(_on_score_updated)
	_load_photo_questions()
	if _photo_questions.is_empty():
		_show_no_questions()
		return
	_load_question()

func _load_photo_questions() -> void:
	var all_questions: Array = GameManager.questions
	_photo_questions = all_questions.filter(func(q): return q.get("type", "") == "photo")

func _show_no_questions() -> void:
	_question_label.text = "无照片核验题目"
	_fallback_desc.text = "当前没有照片核验题目，将跳过此阶段"
	_intact_btn.disabled = true
	_damaged_btn.disabled = true
	_timer_active = false
	get_tree().create_timer(2.0).timeout.connect(func(): GameManager.advance_phase())

func _process(delta: float) -> void:
	if not _timer_active:
		return
	_time_remaining -= delta
	_timer_bar.value = (_time_remaining / _time_limit) * 100.0
	if _time_remaining <= 0.0:
		_time_remaining = 0.0
		_timer_active = false
		_on_time_out()

func _load_question() -> void:
	_is_answered = false
	_feedback_label.text = ""
	_feedback_label.visible = false
	_damage_popup.visible = false

	var question: Dictionary = _photo_questions[_current_index]
	if question.is_empty():
		GameManager.advance_phase()
		return

	_time_limit = float(ConfigManager.get_time_limit(0))
	_time_remaining = _time_limit
	_timer_active = true
	_timer_bar.value = 100.0

	_update_top_bar()
	_display_photo(question)
	_intact_btn.disabled = false
	_damaged_btn.disabled = false

func _update_top_bar() -> void:
	_score_label.text = "得分: %d" % GameManager.total_score
	var q_index: int = _current_index + 1
	var q_total: int = _photo_questions.size()
	_question_label.text = "题目: %d / %d" % [q_index, q_total]

func _display_photo(question: Dictionary) -> void:
	var image_path: String = question.get("image_path", "")
	var loaded: bool = false

	if image_path != "":
		var tex: CompressedTexture2D = load(image_path)
		if tex:
			_photo_rect.texture = tex
			_photo_rect.visible = true
			_fallback_rect.visible = false
			loaded = true

	if not loaded:
		_photo_rect.visible = true
		_photo_rect.texture = null
		_fallback_rect.visible = true
		_fallback_desc.text = question.get("description", "物品照片")

func _on_intact_pressed() -> void:
	if _is_answered:
		return
	_handle_answer("intact")

func _on_damaged_pressed() -> void:
	if _is_answered:
		return
	_handle_answer("damaged")

func _handle_answer(answer: String) -> void:
	_is_answered = true
	_timer_active = false
	_intact_btn.disabled = true
	_damaged_btn.disabled = true

	var question: Dictionary = _photo_questions[_current_index]
	var correct_answer: String = question.get("correct_answer", "")
	var is_correct: bool = (answer == correct_answer)

	if is_correct:
		GameManager.add_score(GameManager.Phase.PHOTO_VERIFICATION, ConfigManager.get_score_per_correct())
		_show_feedback("正确!", Color(_hex_to_color("4ecca3")))
	else:
		var penalty: int = ConfigManager.get_score_penalty()
		GameManager.add_score(GameManager.Phase.PHOTO_VERIFICATION, -penalty)
		_show_feedback("错误!", Color(_hex_to_color("e94560")))

	if answer == "damaged":
		_show_damage_popup(question.get("damage_reason", ""))
	else:
		_schedule_advance()

func _on_time_out() -> void:
	if _is_answered:
		return
	_is_answered = true
	_intact_btn.disabled = true
	_damaged_btn.disabled = true
	var penalty: int = ConfigManager.get_score_penalty()
	GameManager.add_score(GameManager.Phase.PHOTO_VERIFICATION, -penalty)
	_show_feedback("超时!", Color(_hex_to_color("e94560")))
	_schedule_advance()

func _show_feedback(text: String, color: Color) -> void:
	_feedback_label.text = text
	_feedback_label.add_theme_color_override("font_color", color)
	_feedback_label.visible = true

func _show_damage_popup(reason: String) -> void:
	_damage_reason_label.text = reason if reason != "" else "无损坏原因说明"
	_damage_popup.visible = true

func _on_popup_ok_pressed() -> void:
	_damage_popup.visible = false
	_schedule_advance()

func _schedule_advance() -> void:
	get_tree().create_timer(1.5).timeout.connect(_do_advance)

func _do_advance() -> void:
	_current_index += 1
	if _current_index < _photo_questions.size():
		_load_question()
	else:
		GameManager.advance_phase()

func _on_score_updated(total_score: int) -> void:
	_score_label.text = "得分: %d" % total_score

func _hex_to_color(hex: String) -> Color:
	var c: Color = Color.from_string(hex, Color.WHITE)
	return c
