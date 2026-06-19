extends PanelContainer

signal date_selected(date_str)

@onready var day_label: Label = $MarginContainer/VBoxContainer/DayLabel
@onready var status_label: Label = $MarginContainer/VBoxContainer/StatusLabel

var date_data = null
var is_selected: bool = false
var is_selectable: bool = true

func _ready():
	gui_input.connect(_on_gui_input)

func setup(date):
	date_data = date
	if date_data:
		day_label.text = date_data.date.substr(8, 2).to_int()
		status_label.text = date_data.get_status_text()
		_update_colors()
	_update_visual_state()

func _update_colors():
	if date_data:
		var status_color = date_data.get_status_color()
		status_label.add_theme_color_override("font_color", status_color)
		if date_data.is_weekend:
			day_label.add_theme_color_override("font_color", Color(0.95, 0.61, 0.07))
		else:
			day_label.add_theme_color_override("font_color", Color(0.95, 0.95, 0.95, 1))

func set_selected(selected: bool):
	is_selected = selected
	_update_visual_state()

func set_selectable(selectable: bool):
	is_selectable = selectable
	mouse_filter = MOUSE_FILTER_STOP if is_selectable else MOUSE_FILTER_IGNORE
	_update_visual_state()

func _update_visual_state():
	var bg_panel = get_child(0) as Panel
	var bg_color = Color(0.12, 0.15, 0.18, 1)
	var border_color = Color(0.25, 0.3, 0.35, 1)
	
	if is_selected:
		bg_color = Color(0.2, 0.6, 0.86, 0.4)
		border_color = Color(0.2, 0.6, 0.86, 1)
	elif not is_selectable:
		bg_color = Color(0.08, 0.1, 0.12, 0.5)
	
	if bg_panel and bg_panel.has_theme_stylebox_override("panel"):
		var style = bg_panel.get_theme_stylebox_override("panel") as StyleBoxFlat
		if style:
			style.bg_color = bg_color
			style.border_color = border_color
			style.border_width_left = 2
			style.border_width_top = 2
			style.border_width_right = 2
			style.border_width_bottom = 2

func _on_gui_input(event):
	if not is_selectable:
		return
	
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if date_data:
			date_selected.emit(date_data.date)
		accept_event()
