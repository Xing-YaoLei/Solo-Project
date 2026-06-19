extends Control

signal popup_closed()

var result_data: Dictionary
var auto_close_time: float = 3.0

@onready var background: ColorRect = $Background
@onready var container: PanelContainer = $Container
@onready var title_label: Label = $Container/VBox/TitleLabel
@onready var message_label: Label = $Container/VBox/MessageLabel
@onready var score_label: Label = $Container/VBox/ScoreLabel
@onready var details_vbox: VBoxContainer = $Container/VBox/DetailsVBox
@onready var icon: ColorRect = $Container/VBox/Icon
@onready var close_button: Button = $Container/VBox/CloseButton

func _ready():
	close_button.pressed.connect(_on_close_pressed)
	background.gui_input.connect(_on_background_clicked)

func show_result(p_result: Dictionary) -> void:
	result_data = p_result
	_refresh_display()
	visible = true

	if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.MEDIUM):
		modulate.a = 0.0
		container.scale = Vector2(0.5, 0.5)
		var tween = create_tween()
		tween.tween_property(self, "modulate:a", 1.0, 0.2)
		tween.tween_property(container, "scale", Vector2(1.0, 1.0), 0.3)

	if auto_close_time > 0:
		await get_tree().create_timer(auto_close_time).timeout
		if visible:
			close()

func _refresh_display() -> void:
	if not result_data:
		return

	var success = result_data.get("success", false)
	var is_perfect = result_data.get("is_perfect", false)
	var repair_needed = result_data.get("repair_needed", false)

	if is_perfect:
		title_label.text = "完美完成！"
		title_label.add_theme_color_override("font_color", Color(0.3, 1.0, 0.5))
		icon.color = Color(0.3, 1.0, 0.5)
		_draw_check_icon()
	elif success:
		if repair_needed:
			title_label.text = "完成（需返修）"
			title_label.add_theme_color_override("font_color", Color(1.0, 0.7, 0.3))
			icon.color = Color(1.0, 0.7, 0.3)
			_draw_warning_icon()
		else:
			title_label.text = "完成"
			title_label.add_theme_color_override("font_color", Color(0.3, 0.8, 0.5))
			icon.color = Color(0.3, 0.8, 0.5)
			_draw_check_icon()
	else:
		title_label.text = "失败"
		title_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
		icon.color = Color(1.0, 0.3, 0.3)
		_draw_cross_icon()

	message_label.text = result_data.get("message", "")

	var score = result_data.get("score", 0)
	if score > 0:
		score_label.text = "+%d 分" % score
		score_label.add_theme_color_override("font_color", Color(0.5, 1.0, 0.5))
	else:
		score_label.text = "%d 分" % score
		score_label.add_theme_color_override("font_color", Color(1.0, 0.5, 0.5))

	_refresh_details()

func _refresh_details() -> void:
	for child in details_vbox.get_children():
		child.queue_free()

	var time_bonus = result_data.get("time_bonus", 0)
	var quality_bonus = result_data.get("quality_bonus", 0)
	var earnings = result_data.get("earnings", 0.0)

	if time_bonus > 0:
		_add_detail_row("时间奖励", "+%d" % time_bonus, Color(0.5, 0.8, 1.0))
	if quality_bonus > 0:
		_add_detail_row("质量奖励", "+%d" % quality_bonus, Color(0.8, 1.0, 0.5))
	if earnings > 0:
		_add_detail_row("收入", "¥%.2f" % earnings, Color(1.0, 0.9, 0.5))

func _add_detail_row(p_label: String, p_value: String, p_color: Color) -> void:
	var hbox = HBoxContainer.new()
	hbox.size_flags_horizontal = SIZE_EXPAND_FILL
	details_vbox.add_child(hbox)

	var label = Label.new()
	label.text = p_label
	label.size_flags_horizontal = SIZE_EXPAND_FILL
	label.add_theme_font_size_override("font_size", 12)
	label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	hbox.add_child(label)

	var value = Label.new()
	value.text = p_value
	value.add_theme_font_size_override("font_size", 12)
	value.add_theme_color_override("font_color", p_color)
	hbox.add_child(value)

func _draw_check_icon() -> void:
	icon.queue_redraw()
	icon.connect("draw", func():
		icon.draw_line(Vector2(15, 30), Vector2(30, 45), Color.WHITE, 4)
		icon.draw_line(Vector2(30, 45), Vector2(50, 15), Color.WHITE, 4)
	)

func _draw_cross_icon() -> void:
	icon.queue_redraw()
	icon.connect("draw", func():
		icon.draw_line(Vector2(15, 15), Vector2(50, 50), Color.WHITE, 4)
		icon.draw_line(Vector2(50, 15), Vector2(15, 50), Color.WHITE, 4)
	)

func _draw_warning_icon() -> void:
	icon.queue_redraw()
	icon.connect("draw", func():
		icon.draw_polygon(
			PackedVector2Array([Vector2(32, 10), Vector2(55, 50), Vector2(10, 50)]),
			Color.WHITE
		)
		icon.draw_line(Vector2(32, 25), Vector2(32, 38), Color(1.0, 0.7, 0.3), 4)
		icon.draw_circle(Vector2(32, 44), 3, Color(1.0, 0.7, 0.3))
	)

func close() -> void:
	if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.MEDIUM):
		var tween = create_tween()
		tween.tween_property(self, "modulate:a", 0.0, 0.2)
		tween.tween_property(container, "scale", Vector2(0.8, 0.8), 0.2)
		await tween.finished

	visible = false
	popup_closed.emit()

func _on_close_pressed() -> void:
	close()
	AudioManager.play_click()

func _on_background_clicked(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		close()
