extends Control

signal tag_selected(tag: String)

var _tags: PackedStringArray = []
var _selected_tags: PackedStringArray = []

func setup(tags: PackedStringArray) -> void:
	_tags = tags
	_selected_tags.clear()
	_rebuild()

func _rebuild() -> void:
	for child in get_children():
		child.queue_free()
	for tag in _tags:
		var btn := Button.new()
		btn.text = tag
		btn.toggle_mode = true
		btn.custom_minimum_size = Vector2(120, 40)
		btn.focus_mode = Control.FOCUS_ALL
		btn.toggled.connect(_on_tag_toggled.bind(tag, btn))
		add_child(btn)

func _on_tag_toggled(pressed: bool, tag: String, _btn: Button) -> void:
	if pressed:
		if tag not in _selected_tags:
			_selected_tags.append(tag)
	else:
		_selected_tags.erase(tag)
	tag_selected.emit(tag)

func get_selected_tags() -> PackedStringArray:
	return _selected_tags
