extends Control

signal button_pressed(button_name: String)

const STYLE_DARK_BG = Color(0.12, 0.14, 0.18, 1)
const STYLE_CARD_BG = Color(0.18, 0.21, 0.27, 1)
const STYLE_ACCENT = Color(0.3, 0.6, 1.0, 1)
const STYLE_SUCCESS = Color(0.25, 0.75, 0.45, 1)
const STYLE_WARNING = Color(0.95, 0.7, 0.2, 1)
const STYLE_DANGER = Color(0.9, 0.3, 0.3, 1)
const STYLE_TEXT_PRIMARY = Color(0.95, 0.96, 0.98, 1)
const STYLE_TEXT_SECONDARY = Color(0.65, 0.7, 0.78, 1)

func create_button(text: String, position: Vector2, size: Vector2 = Vector2(160, 44), color: Color = STYLE_ACCENT) -> Button:
	var btn = Button.new()
	btn.text = text
	btn.position = position
	btn.size = size
	btn.add_theme_font_size_override("font_size", 16)
	var style_normal = StyleBoxFlat.new()
	style_normal.bg_color = color
	style_normal.corner_radius_top_left = 8
	style_normal.corner_radius_top_right = 8
	style_normal.corner_radius_bottom_left = 8
	style_normal.corner_radius_bottom_right = 8
	style_normal.content_margin_left = 16
	style_normal.content_margin_right = 16
	style_normal.content_margin_top = 8
	style_normal.content_margin_bottom = 8
	btn.add_theme_stylebox_override("normal", style_normal)
	var style_hover = style_normal.duplicate()
	style_hover.bg_color = color.lightened(0.15)
	btn.add_theme_stylebox_override("hover", style_hover)
	var style_pressed = style_normal.duplicate()
	style_pressed.bg_color = color.darkened(0.15)
	btn.add_theme_stylebox_override("pressed", style_pressed)
	btn.add_theme_color_override("font_color", STYLE_TEXT_PRIMARY)
	return btn

func create_label(text: String, position: Vector2, font_size: int = 16, color: Color = STYLE_TEXT_PRIMARY) -> Label:
	var lbl = Label.new()
	lbl.text = text
	lbl.position = position
	lbl.add_theme_font_size_override("font_size", font_size)
	lbl.add_theme_color_override("font_color", color)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	return lbl

func create_panel(position: Vector2, size: Vector2, bg_color: Color = STYLE_CARD_BG) -> PanelContainer:
	var panel = PanelContainer.new()
	panel.position = position
	panel.size = size
	var style = StyleBoxFlat.new()
	style.bg_color = bg_color
	style.corner_radius_top_left = 12
	style.corner_radius_top_right = 12
	style.corner_radius_bottom_left = 12
	style.corner_radius_bottom_right = 12
	style.content_margin_left = 20
	style.content_margin_right = 20
	style.content_margin_top = 16
	style.content_margin_bottom = 16
	panel.add_theme_stylebox_override("panel", style)
	return panel

func create_margin_container(margins: Dictionary = {"left": 16, "right": 16, "top": 12, "bottom": 12}) -> MarginContainer:
	var mc = MarginContainer.new()
	mc.add_theme_constant_override("margin_left", margins.get("left", 16))
	mc.add_theme_constant_override("margin_right", margins.get("right", 16))
	mc.add_theme_constant_override("margin_top", margins.get("top", 12))
	mc.add_theme_constant_override("margin_bottom", margins.get("bottom", 12))
	return mc

func show_notification(message: String, type: String = "info", duration: float = 3.0) -> void:
	var notification = PanelContainer.new()
	notification.name = "Notification_" + str(randi())
	var style = StyleBoxFlat.new()
	var bg_color = STYLE_ACCENT
	if type == "success":
		bg_color = STYLE_SUCCESS
	elif type == "warning":
		bg_color = STYLE_WARNING
	elif type == "error":
		bg_color = STYLE_DANGER
	style.bg_color = bg_color
	style.corner_radius_top_left = 8
	style.corner_radius_top_right = 8
	style.corner_radius_bottom_left = 8
	style.corner_radius_bottom_right = 8
	notification.add_theme_stylebox_override("panel", style)
	notification.position = Vector2(get_viewport_rect().size.x / 2 - 200, 30)
	notification.size = Vector2(400, 60)
	var mc = create_margin_container({"left": 20, "right": 20, "top": 8, "bottom": 8})
	notification.add_child(mc)
	var lbl = Label.new()
	lbl.text = message
	lbl.add_theme_font_size_override("font_size", 16)
	lbl.add_theme_color_override("font_color", STYLE_TEXT_PRIMARY)
	lbl.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	lbl.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	lbl.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	mc.add_child(lbl)
	add_child(notification)
	var tween = create_tween()
	notification.modulate.a = 0.0
	tween.tween_property(notification, "modulate:a", 1.0, 0.3)
	tween.tween_interval(duration)
	tween.tween_property(notification, "modulate:a", 0.0, 0.5)
	tween.tween_callback(notification.queue_free)

func show_permission_error(reason: String) -> void:
	show_notification("权限不足：" + reason, "error", 5.0)

func format_time(seconds: int) -> String:
	var h = seconds / 3600
	var m = (seconds % 3600) / 60
	var s = seconds % 60
	if h > 0:
		return "%02d:%02d:%02d" % [h, m, s]
	return "%02d:%02d" % [m, s]
