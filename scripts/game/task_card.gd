extends Control

signal answered

var current_task: Dictionary = {}
var answered_flag: bool = false

@onready var title_label: Label = $PanelContainer/VBoxContainer/HeaderHBox/TitleLabel
@onready var type_label: Label = $PanelContainer/VBoxContainer/HeaderHBox/TypeLabel
@onready var content_vbox: VBoxContainer = $PanelContainer/VBoxContainer/ContentScroll/VBoxContainer
@onready var pass_btn: Button = $PanelContainer/VBoxContainer/ButtonHBox/PassButton
@onready var fail_btn: Button = $PanelContainer/VBoxContainer/ButtonHBox/FailButton
@onready var card_panel: PanelContainer = $PanelContainer

func _ready() -> void:
	pass_btn.pressed.connect(_on_pass_pressed)
	fail_btn.pressed.connect(_on_fail_pressed)

func setup(task_data: Dictionary) -> void:
	current_task = task_data
	answered_flag = false
	pass_btn.disabled = false
	fail_btn.disabled = false
	card_panel.modulate = Color(1, 1, 1)
	_setup_appearance()
	_setup_content()
	if SettingsManager.animation_enabled:
		modulate.a = 0.0
		var tween := create_tween()
		tween.tween_property(self, "modulate:a", 1.0, 0.3)

func _setup_appearance() -> void:
	match current_task.get("type", ""):
		"batch":
			title_label.text = "📋 批号效期核查"
			type_label.text = "批号效期"
			type_label.add_theme_color_override("font_color", Color(0.85, 0.35, 0.35))
			pass_btn.text = "效期正常"
			fail_btn.text = "临近/已过期"
			_setup_button_colors(Color(0.1, 0.65, 0.5), Color(0.85, 0.35, 0.35))
		"member":
			title_label.text = "👤 会员档案核查"
			type_label.text = "会员档案"
			type_label.add_theme_color_override("font_color", Color(0.15, 0.55, 0.95))
			pass_btn.text = "档案完整"
			fail_btn.text = "需要回访"
			_setup_button_colors(Color(0.15, 0.55, 0.95), Color(0.95, 0.55, 0.1))
		"replenish":
			title_label.text = "📦 补货单处理"
			type_label.text = "补货调度"
			type_label.add_theme_color_override("font_color", Color(0.55, 0.45, 0.1))
			pass_btn.text = "库存充足"
			fail_btn.text = "需要补货"
			_setup_button_colors(Color(0.1, 0.65, 0.5), Color(0.95, 0.55, 0.1))
	pass_btn.add_theme_color_override("font_color", Color(1, 1, 1))
	fail_btn.add_theme_color_override("font_color", Color(1, 1, 1))

func _setup_button_colors(pass_color: Color, fail_color: Color) -> void:
	var pass_normal := StyleBoxFlat.new()
	pass_normal.bg_color = pass_color
	pass_normal.corner_radius_top_left = 8
	pass_normal.corner_radius_top_right = 8
	pass_normal.corner_radius_bottom_right = 8
	pass_normal.corner_radius_bottom_left = 8
	pass_normal.content_margin_left = 16
	pass_normal.content_margin_top = 10
	pass_normal.content_margin_right = 16
	pass_normal.content_margin_bottom = 10
	pass_btn.add_theme_stylebox_override("normal", pass_normal)
	var pass_hover := pass_normal.duplicate()
	pass_hover.bg_color = pass_color.lightened(0.15)
	pass_btn.add_theme_stylebox_override("hover", pass_hover)
	var pass_pressed := pass_normal.duplicate()
	pass_pressed.bg_color = pass_color.darkened(0.15)
	pass_btn.add_theme_stylebox_override("pressed", pass_pressed)

	var fail_normal := StyleBoxFlat.new()
	fail_normal.bg_color = fail_color
	fail_normal.corner_radius_top_left = 8
	fail_normal.corner_radius_top_right = 8
	fail_normal.corner_radius_bottom_right = 8
	fail_normal.corner_radius_bottom_left = 8
	fail_normal.content_margin_left = 16
	fail_normal.content_margin_top = 10
	fail_normal.content_margin_right = 16
	fail_normal.content_margin_bottom = 10
	fail_btn.add_theme_stylebox_override("normal", fail_normal)
	var fail_hover := fail_normal.duplicate()
	fail_hover.bg_color = fail_color.lightened(0.15)
	fail_btn.add_theme_stylebox_override("hover", fail_hover)
	var fail_pressed := fail_normal.duplicate()
	fail_pressed.bg_color = fail_color.darkened(0.15)
	fail_btn.add_theme_stylebox_override("pressed", fail_pressed)

func _setup_content() -> void:
	for child in content_vbox.get_children():
		child.queue_free()
	match current_task.get("type", ""):
		"batch":
			_add_content_row("药品名称", current_task.get("medicine", ""))
			_add_content_row("生产批号", current_task.get("batch_no", ""))
			_add_content_row("有效期至", str(current_task.get("expire_date", "")))
			_add_hint("判断是否在效期内")
		"member":
			_add_content_row("会员编号", current_task.get("member_id", ""))
			_add_content_row("姓名", current_task.get("name", ""))
			_add_content_row("年龄", "%d岁" % int(current_task.get("age", 0)))
			_add_content_row("慢病情况", current_task.get("condition", ""))
			_add_content_row("上次到店", current_task.get("last_visit", ""))
			var phone_val: String = current_task.get("phone", "")
			_add_content_row("联系电话", "未登记" if phone_val.is_empty() else phone_val)
			_add_hint("判断档案是否完善，是否需要回访")
		"replenish":
			_add_content_row("药品名称", current_task.get("medicine", ""))
			_add_content_row("当前库存", "%d盒" % int(current_task.get("stock", 0)))
			_add_content_row("补货阈值", "%d盒" % int(current_task.get("threshold", 0)))
			_add_content_row("周销量", "%d盒" % int(current_task.get("sales_week", 0)))
			_add_hint("判断是否需要补货")

func _add_content_row(label: String, value: String) -> void:
	var hbox := HBoxContainer.new()
	hbox.add_theme_constant_override("separation", 12)
	var lbl := Label.new()
	lbl.text = label
	lbl.custom_minimum_size = Vector2(120, 0)
	lbl.add_theme_color_override("font_color", Color(0.5, 0.55, 0.65))
	lbl.add_theme_font_size_override("font_size", 14)
	hbox.add_child(lbl)
	var val := Label.new()
	val.text = value
	val.add_theme_color_override("font_color", Color(0.2, 0.25, 0.35))
	val.add_theme_font_size_override("font_size", 15)
	hbox.add_child(val)
	content_vbox.add_child(hbox)

func _add_hint(text: String) -> void:
	var lbl := Label.new()
	lbl.text = "提示：" + text
	lbl.add_theme_color_override("font_color", Color(0.45, 0.5, 0.65))
	lbl.add_theme_font_size_override("font_size", 12)
	content_vbox.add_child(lbl)

func _on_pass_pressed() -> void:
	if answered_flag:
		return
	var correct: bool
	match current_task.get("type", ""):
		"batch":
			correct = current_task.get("is_valid", false)
		"member":
			correct = current_task.get("is_complete", false)
		"replenish":
			correct = not current_task.get("need_replenish", false)
	_submit_answer(correct)

func _on_fail_pressed() -> void:
	if answered_flag:
		return
	var correct: bool
	match current_task.get("type", ""):
		"batch":
			correct = not current_task.get("is_valid", false)
		"member":
			correct = not current_task.get("is_complete", false)
		"replenish":
			correct = current_task.get("need_replenish", false)
	_submit_answer(correct)

func _submit_answer(correct: bool) -> void:
	answered_flag = true
	pass_btn.disabled = true
	fail_btn.disabled = true
	var feedback_color: Color
	if correct:
		feedback_color = Color(0.9, 1.0, 0.92)
		AudioManager.play_sfx("correct")
		if GameState.combo >= 2:
			AudioManager.play_sfx("combo")
		AudioManager.vibrate(0.2)
	else:
		feedback_color = Color(1.0, 0.9, 0.9)
		AudioManager.play_sfx("wrong")
		AudioManager.vibrate(0.4)
	card_panel.modulate = feedback_color
	if SettingsManager.animation_enabled:
		var tween := create_tween()
		tween.tween_property(self, "modulate:a", 1.0, 0.2)
	GameState.submit_task(correct, current_task.get("type", ""))
	await get_tree().create_timer(0.4).timeout
	emit_signal("answered")
