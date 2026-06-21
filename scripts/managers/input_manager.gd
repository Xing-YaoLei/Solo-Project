extends Node

signal ui_confirm
signal ui_cancel
signal ui_navigate(direction: Vector2i)

var _focus_index: int = 0
var _focusable_buttons: Array[BaseButton] = []
var _keyboard_active: bool = false

func setup_focus_group(buttons: Array[BaseButton]) -> void:
	_focusable_buttons = buttons
	_focus_index = 0
	if buttons.size() > 0:
		buttons[0].grab_focus()

func _input(event: InputEvent) -> void:
	if event is InputEventKey or event is InputEventJoypadButton:
		_keyboard_active = true
	elif event is InputEventScreenTouch or event is InputEventMouseButton:
		_keyboard_active = false

	if not _keyboard_active:
		return

	if event.is_action_pressed("ui_down"):
		_navigate(1)
	elif event.is_action_pressed("ui_up"):
		_navigate(-1)
	elif event.is_action_pressed("ui_accept"):
		ui_confirm.emit()
	elif event.is_action_pressed("ui_cancel"):
		ui_cancel.emit()

func _navigate(direction: int) -> void:
	if _focusable_buttons.is_empty():
		return
	_focus_index = wrapi(_focus_index + direction, 0, _focusable_buttons.size())
	_focusable_buttons[_focus_index].grab_focus()
	ui_navigate.emit(Vector2i(0, direction))
