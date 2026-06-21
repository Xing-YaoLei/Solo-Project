extends Control

signal method_selected(method: String)
signal confirmed

var _methods: PackedStringArray = []
var _selected_method: String = ""
var _buttons: Array[BaseButton] = []

@onready var _method_list: VBoxContainer = $VBoxContainer/MethodList
@onready var _confirm_btn: Button = $VBoxContainer/ConfirmButton

func setup(methods: PackedStringArray) -> void:
	_methods = methods
	_selected_method = ""
	_rebuild()

func _rebuild() -> void:
	for child in _method_list.get_children():
		child.queue_free()
	_buttons.clear()
	for method in _methods:
		var btn := Button.new()
		btn.text = method
		btn.toggle_mode = true
		btn.custom_minimum_size = Vector2(400, 50)
		btn.focus_mode = Control.FOCUS_ALL
		btn.toggled.connect(_on_method_toggled.bind(method, btn))
		_method_list.add_child(btn)
		_buttons.append(btn)
	_buttons.append(_confirm_btn)
	_confirm_btn.disabled = true

func _on_method_toggled(pressed: bool, method: String, btn: Button) -> void:
	for child in _method_list.get_children():
		if child is Button and child != btn:
			child.set_pressed_no_signal(false)
	if pressed:
		_selected_method = method
		_confirm_btn.disabled = false
		method_selected.emit(method)
	else:
		_selected_method = ""
		_confirm_btn.disabled = true

func _on_confirm_button_pressed() -> void:
	if not _selected_method.is_empty():
		confirmed.emit()

func get_selected_method() -> String:
	return _selected_method
