extends Control

signal card_clicked(p_order: WorkOrder)
signal action_triggered(p_action: String, p_order: WorkOrder)

var work_order: WorkOrder
var is_selected: bool = false
var show_details: bool = false

@onready var background: Panel = $Background
@onready var priority_indicator: ColorRect = $PriorityIndicator
@onready var plate_label: Label = $Content/PlateLabel
@onready var model_label: Label = $Content/ModelLabel
@onready var customer_label: Label = $Content/CustomerLabel
@onready var desc_label: Label = $Content/DescLabel
@onready var priority_label: Label = $Content/TopRow/PriorityLabel
@onready var status_label: Label = $Content/TopRow/StatusLabel
@onready var time_bar: ProgressBar = $Content/TimeRow/TimeBar
@onready var time_label: Label = $Content/TimeRow/TimeLabel
@onready var services_container: HBoxContainer = $Content/ServicesContainer
@onready var parts_container: HBoxContainer = $Content/PartsContainer
@onready var select_button: Button = $Content/Buttons/SelectButton
@onready var details_panel: VBoxContainer = $Content/DetailsPanel

func _ready():
	if work_order:
		update_display()

	if select_button:
		select_button.pressed.connect(_on_select_button_pressed)

	gui_input.connect(_on_gui_input)
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)

func set_work_order(p_order: WorkOrder) -> void:
	work_order = p_order
	if is_inside_tree():
		update_display()

func update_display() -> void:
	if not work_order:
		return

	priority_indicator.color = work_order.get_priority_color()
	plate_label.text = work_order.vehicle_plate
	model_label.text = work_order.vehicle_model
	customer_label.text = work_order.customer_name
	desc_label.text = work_order.description
	priority_label.text = "优先级: %s" % work_order.get_priority_text()
	priority_label.add_theme_color_override("font_color", work_order.get_priority_color())
	status_label.text = work_order.get_status_text()

	match work_order.status:
		WorkOrder.Status.PENDING:
			status_label.add_theme_color_override("font_color", Color(1.0, 0.8, 0.2))
		WorkOrder.Status.IN_PROGRESS:
			status_label.add_theme_color_override("font_color", Color(0.3, 0.7, 1.0))
		WorkOrder.Status.COMPLETED:
			status_label.add_theme_color_override("font_color", Color(0.3, 0.8, 0.3))
		WorkOrder.Status.FAILED:
			status_label.add_theme_color_override("font_color", Color(0.8, 0.3, 0.3))

	_update_time_display()
	_update_service_tags()
	_update_part_tags()
	_update_button_state()

	if is_selected:
		background.add_theme_color_override("bg_color", Color(0.3, 0.5, 0.8, 0.8))
	else:
		background.add_theme_color_override("bg_color", Color(0.2, 0.25, 0.3, 0.9))

func _update_time_display() -> void:
	var remaining = work_order.get_remaining_time()
	var percentage = work_order.get_time_percentage()

	time_bar.value = percentage * 100

	if remaining <= 0:
		time_label.text = "已过期"
		time_bar.add_theme_color_override("foreground_color", Color(0.8, 0.2, 0.2))
	elif remaining < 30:
		time_label.text = "紧急: %ds" % int(remaining)
		time_bar.add_theme_color_override("foreground_color", Color(1.0, 0.3, 0.2))
	elif remaining < 60:
		time_label.text = "%ds" % int(remaining)
		time_bar.add_theme_color_override("foreground_color", Color(1.0, 0.6, 0.2))
	else:
		var mins = int(remaining / 60)
		var secs = int(remaining % 60)
		time_label.text = "%d:%02d" % [mins, secs]
		time_bar.add_theme_color_override("foreground_color", Color(0.3, 0.8, 0.5))

func _update_service_tags() -> void:
	for child in services_container.get_children():
		child.queue_free()

	for service in work_order.required_services:
		var tag = create_tag(service, Color(0.3, 0.5, 0.8))
		services_container.add_child(tag)

func _update_part_tags() -> void:
	for child in parts_container.get_children():
		child.queue_free()

	for part_id in work_order.required_parts:
		var part = GameManager.get_part(part_id)
		if part:
			var status_color = part.get_stock_color()
			var tag = create_tag(part.name, status_color)
			parts_container.add_child(tag)

func _update_button_state() -> void:
	if not select_button:
		return

	match work_order.status:
		WorkOrder.Status.PENDING:
			select_button.text = "处理工单"
			select_button.disabled = false
			select_button.visible = true
		WorkOrder.Status.IN_PROGRESS:
			select_button.text = "处理中"
			select_button.disabled = true
			select_button.visible = true
		_:
			select_button.visible = false

func create_tag(p_text: String, p_color: Color) -> Label:
	var tag = Label.new()
	tag.text = p_text
	tag.add_theme_font_size_override("font_size", 11)
	tag.add_theme_color_override("font_color", Color.WHITE)
	tag.custom_minimum_size = Vector2(0, 20)

	var bg = PanelContainer.new()
	bg.add_theme_stylebox_override("panel", create_stylebox(p_color, 4))
	bg.add_child(tag)

	return bg

func create_stylebox(p_color: Color, p_radius: int = 6) -> StyleBoxFlat:
	var style = StyleBoxFlat.new()
	style.bg_color = p_color
	style.corner_radius_top_left = p_radius
	style.corner_radius_top_right = p_radius
	style.corner_radius_bottom_right = p_radius
	style.corner_radius_bottom_left = p_radius
	style.content_margin_left = 6
	style.content_margin_right = 6
	style.content_margin_top = 2
	style.content_margin_bottom = 2
	return style

func set_selected(p_selected: bool) -> void:
	is_selected = p_selected
	if work_order and is_inside_tree():
		update_display()

func set_show_details(p_show: bool) -> void:
	show_details = p_show
	if details_panel:
		details_panel.visible = p_show

func _process(delta: float) -> void:
	if work_order and work_order.status == WorkOrder.Status.PENDING:
		_update_time_display()

func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		card_clicked.emit(work_order)
		AudioManager.play_click()

func _on_mouse_entered() -> void:
	if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.LOW):
		var tween = create_tween()
		tween.tween_property(background, "scale", Vector2(1.02, 1.02), 0.1)
	AudioManager.play_sfx(AudioManager.SFXType.BUTTON_HOVER)

func _on_mouse_exited() -> void:
	if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.LOW):
		var tween = create_tween()
		tween.tween_property(background, "scale", Vector2(1.0, 1.0), 0.1)

func _on_select_button_pressed() -> void:
	if work_order and work_order.status == WorkOrder.Status.PENDING:
		action_triggered.emit("select", work_order)
		AudioManager.play_click()
