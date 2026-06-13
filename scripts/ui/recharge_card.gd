class_name RechargeCard
extends Control

var recharge_data: Dictionary = {}
var is_dragging: bool = false
var drag_offset: Vector2 = Vector2.ZERO
var original_position: Vector2 = Vector2.ZERO

signal card_dragged(card_data, position)
signal card_dropped
signal card_released(card_data, position)

func _init() -> void:
	recharge_data = {}

func setup(data: Dictionary) -> void:
	recharge_data = data
	_build_ui()

func _build_ui() -> void:
	var panel = PanelContainer.new()
	panel.custom_minimum_size = Vector2(260, 50)
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	
	var hbox = HBoxContainer.new()
	hbox.theme_override_constants.separation = 8
	
	var icon_label = Label.new()
	icon_label.text = "💳"
	icon_label.theme_override_font_sizes.font_size = 20
	
	var info_vbox = VBoxContainer.new()
	info_vbox.size_flags_horizontal = 3
	
	var name_label = Label.new()
	name_label.text = recharge_data.get("customer_name", "未知")
	name_label.theme_override_colors.font_color = Color(0.3, 0.25, 0.2, 1)
	name_label.theme_override_font_sizes.font_size = 12
	
	var amount = recharge_data.get("amount", 0)
	var bonus = recharge_data.get("bonus_percent", 0) * amount
	var amount_label = Label.new()
	amount_label.text = "¥%.0f (+%.0f)" % [amount, bonus]
	amount_label.theme_override_colors.font_color = Color(0.8, 0.4, 0.2, 1)
	amount_label.theme_override_font_sizes.font_size = 11
	
	info_vbox.add_child(name_label)
	info_vbox.add_child(amount_label)
	
	hbox.add_child(icon_label)
	hbox.add_child(info_vbox)
	panel.add_child(hbox)
	
	add_child(panel)
	custom_minimum_size = Vector2(260, 50)
	mouse_filter = Control.MOUSE_FILTER_STOP

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			is_dragging = true
			original_position = position
			drag_offset = get_global_mouse_position() - global_position
			card_dragged.emit(recharge_data, global_position)
		elif not event.pressed and event.button_index == MOUSE_BUTTON_LEFT and is_dragging:
			is_dragging = false
			card_released.emit(recharge_data, get_global_mouse_position())
			card_dropped.emit()
	
	elif event is InputEventMouseMotion and is_dragging:
		global_position = get_global_mouse_position() - drag_offset
		card_dragged.emit(recharge_data, global_position)
