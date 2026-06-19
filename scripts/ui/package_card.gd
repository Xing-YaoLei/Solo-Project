extends Panel

signal selected(package_id)

@onready var name_label: Label = $ContentContainer/NameLabel
@onready var type_label: Label = $ContentContainer/TypeLabel
@onready var price_label: Label = $ContentContainer/PriceLabel
@onready var desc_label: Label = $ContentContainer/DescLabel
@onready var includes_container: VBoxContainer = $ContentContainer/IncludesContainer
@onready var info_label: Label = $ContentContainer/InfoLabel
@onready var select_button: Button = $ContentContainer/SelectButton

var package_data = null
var is_selected: bool = false

func _ready():
	select_button.pressed.connect(_on_select_pressed)
	gui_input.connect(_on_gui_input)

func setup(pkg):
	package_data = pkg
	if package_data:
		name_label.text = package_data.name
		type_label.text = _get_type_text(package_data.type)
		price_label.text = "¥%.0f/晚" % package_data.base_price
		desc_label.text = package_data.description
		info_label.text = "最多%d人 | 最少%d晚" % [package_data.max_guests, package_data.min_stay]
		_update_includes()
	_update_visual_state()

func _get_type_text(type_val: int) -> String:
	match type_val:
		GameData.PackageType.STANDARD:
			return "标准"
		GameData.PackageType.PREMIUM:
			return "豪华"
		GameData.PackageType.FAMILY:
			return "家庭"
		GameData.PackageType.ROMANTIC:
			return "浪漫"
		GameData.PackageType.BUSINESS:
			return "商务"
	return "未知"

func _update_includes():
	for child in includes_container.get_children():
		child.queue_free()
	
	if package_data:
		for item in package_data.includes:
			var label = Label.new()
			label.text = "✓ %s" % item
			label.add_theme_color_override("font_color", Color(0.18, 0.8, 0.44))
			label.horizontal_alignment = HORIZONTAL_ALIGNMENT_LEFT
			includes_container.add_child(label)

func set_selected(selected: bool):
	is_selected = selected
	_update_visual_state()

func _update_visual_state():
	var border_color = Color(0.3, 0.35, 0.4, 1)
	if is_selected:
		border_color = Color(0.2, 0.6, 0.86, 1)
	modulate = border_color
	select_button.text = "已选择" if is_selected else "选择"

func _on_select_pressed():
	selected.emit(package_data.id if package_data else "")

func _on_gui_input(event):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		selected.emit(package_data.id if package_data else "")
		accept_event()
