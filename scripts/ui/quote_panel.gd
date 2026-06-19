extends Control

signal quote_approved(p_quote: Quote)
signal quote_rejected(p_quote: Quote)
signal quote_sent(p_quote: Quote)

var current_quote: Quote
var current_order: WorkOrder

@onready var header_label: Label = $Header/Label
@onready var quote_id_label: Label = $Header/QuoteIdLabel
@onready var status_label: Label = $Header/StatusLabel
@onready var customer_label: Label = $CustomerInfo/CustomerLabel
@onready var order_id_label: Label = $CustomerInfo/OrderIdLabel
@onready var items_list: VBoxContainer = $ScrollContainer/ItemsList
@onready var labor_cost_label: Label = $Summary/LaborRow/LaborCostLabel
@onready var parts_cost_label: Label = $Summary/PartsRow/PartsCostLabel
@onready var subtotal_label: Label = $Summary/SubtotalRow/SubtotalLabel
@onready var discount_label: Label = $Summary/DiscountRow2/DiscountLabel
@onready var tax_label: Label = $Summary/TaxRow/TaxLabel
@onready var total_label: Label = $Summary/TotalRow/TotalLabel
@onready var time_remaining_label: Label = $Summary/TimeRow/TimeRemainingLabel
@onready var approve_button: Button = $Buttons/ApproveButton
@onready var reject_button: Button = $Buttons/RejectButton
@onready var send_button: Button = $Buttons/SendButton
@onready var discount_slider: HSlider = $DiscountRow/DiscountSlider
@onready var discount_value_label: Label = $DiscountRow/DiscountValueLabel

func _ready():
	if approve_button:
		approve_button.pressed.connect(_on_approve_pressed)
	if reject_button:
		reject_button.pressed.connect(_on_reject_pressed)
	if send_button:
		send_button.pressed.connect(_on_send_pressed)
	if discount_slider:
		discount_slider.value_changed.connect(_on_discount_changed)
	clear_quote()

func set_quote(p_quote: Quote, p_order: WorkOrder = null) -> void:
	current_quote = p_quote
	current_order = p_order
	_refresh_display()

func _refresh_display() -> void:
	if not current_quote:
		return

	quote_id_label.text = "报价单: %s" % current_quote.id
	status_label.text = current_quote.get_status_text()

	match current_quote.status:
		Quote.Status.DRAFT:
			status_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
		Quote.Status.SENT:
			status_label.add_theme_color_override("font_color", Color(0.3, 0.7, 1.0))
		Quote.Status.APPROVED:
			status_label.add_theme_color_override("font_color", Color(0.3, 0.8, 0.3))
		Quote.Status.REJECTED:
			status_label.add_theme_color_override("font_color", Color(0.8, 0.3, 0.3))
		Quote.Status.EXPIRED:
			status_label.add_theme_color_override("font_color", Color(0.6, 0.3, 0.3))

	customer_label.text = "客户: %s" % current_quote.customer_name
	order_id_label.text = "工单: %s" % current_quote.work_order_id

	_refresh_items_list()
	_refresh_summary()
	_update_button_states()
	if discount_value_label:
		discount_value_label.text = "%.0f%%" % (current_quote.discount * 100)

func _refresh_items_list() -> void:
	for child in items_list.get_children():
		child.queue_free()

	var header = _create_header_row()
	items_list.add_child(header)

	for i in range(current_quote.items.size()):
		var item = current_quote.items[i]
		var row = _create_item_row(item, i)
		items_list.add_child(row)

func _create_header_row() -> Control:
	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("spacing", 10)
	hbox.custom_minimum_size = Vector2(0, 30)

	var name_label = Label.new()
	name_label.text = "项目"
	name_label.size_flags_horizontal = SIZE_EXPAND_FILL
	name_label.add_theme_font_size_override("font_size", 12)
	name_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	hbox.add_child(name_label)

	var qty_label = Label.new()
	qty_label.text = "数量"
	qty_label.custom_minimum_size = Vector2(60, 0)
	qty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	qty_label.add_theme_font_size_override("font_size", 12)
	qty_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	hbox.add_child(qty_label)

	var price_label = Label.new()
	price_label.text = "单价"
	price_label.custom_minimum_size = Vector2(100, 0)
	price_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	price_label.add_theme_font_size_override("font_size", 12)
	price_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	hbox.add_child(price_label)

	var total_label = Label.new()
	total_label.text = "小计"
	total_label.custom_minimum_size = Vector2(100, 0)
	total_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	total_label.add_theme_font_size_override("font_size", 12)
	total_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.8))
	hbox.add_child(total_label)

	return hbox

func _create_item_row(p_item: Quote.QuoteItem, p_index: int) -> Control:
	var hbox = HBoxContainer.new()
	hbox.add_theme_constant_override("spacing", 10)
	hbox.custom_minimum_size = Vector2(0, 35)

	var name_label = Label.new()
	name_label.text = p_item.part_name
	name_label.size_flags_horizontal = SIZE_EXPAND_FILL
	name_label.add_theme_font_size_override("font_size", 13)
	name_label.add_theme_color_override("font_color", Color.WHITE)
	hbox.add_child(name_label)

	var qty_label = Label.new()
	qty_label.text = str(p_item.quantity)
	qty_label.custom_minimum_size = Vector2(60, 0)
	qty_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	qty_label.add_theme_font_size_override("font_size", 13)
	qty_label.add_theme_color_override("font_color", Color.WHITE)
	hbox.add_child(qty_label)

	var price_label = Label.new()
	price_label.text = "¥%.2f" % p_item.unit_price
	price_label.custom_minimum_size = Vector2(100, 0)
	price_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	price_label.add_theme_font_size_override("font_size", 13)
	price_label.add_theme_color_override("font_color", Color(0.9, 0.9, 0.9))
	hbox.add_child(price_label)

	var total_label = Label.new()
	total_label.text = "¥%.2f" % p_item.get_total()
	total_label.custom_minimum_size = Vector2(100, 0)
	total_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	total_label.add_theme_font_size_override("font_size", 13)
	total_label.add_theme_color_override("font_color", Color(0.8, 1.0, 0.8))
	hbox.add_child(total_label)

	if current_quote.status == Quote.Status.DRAFT:
		var remove_btn = Button.new()
		remove_btn.text = "×"
		remove_btn.custom_minimum_size = Vector2(24, 24)
		remove_btn.add_theme_font_size_override("font_size", 14)
		remove_btn.pressed.connect(func():
			current_quote.remove_item(p_index)
			_refresh_display()
		)
		hbox.add_child(remove_btn)

	return hbox

func _refresh_summary() -> void:
	if not current_quote:
		labor_cost_label.text = "¥0.00"
		parts_cost_label.text = "¥0.00"
		subtotal_label.text = "¥0.00"
		discount_label.text = "¥0.00"
		tax_label.text = "¥0.00"
		total_label.text = "¥0.00"
		time_remaining_label.text = "--:--"
		return

	labor_cost_label.text = "¥%.2f" % current_quote.labor_cost
	parts_cost_label.text = "¥%.2f" % current_quote.parts_cost
	subtotal_label.text = "¥%.2f" % current_quote.get_subtotal()
	discount_label.text = "-¥%.2f (%.0f%%)" % [current_quote.get_discount_amount(), current_quote.discount * 100]
	tax_label.text = "¥%.2f" % current_quote.get_tax_amount()
	total_label.text = "¥%.2f" % current_quote.get_total()

	var remaining = current_quote.get_remaining_time()
	if remaining <= 0:
		time_remaining_label.text = "已过期"
		time_remaining_label.add_theme_color_override("font_color", Color(0.8, 0.3, 0.3))
	else:
		var mins = int(remaining / 60)
		var secs = int(remaining % 60)
		time_remaining_label.text = "剩余: %d:%02d" % [mins, secs]
		time_remaining_label.add_theme_color_override("font_color", Color(0.8, 0.8, 0.3))

func _update_button_states() -> void:
	if not current_quote:
		send_button.disabled = true
		send_button.visible = false
		approve_button.visible = false
		reject_button.visible = false
		discount_slider.editable = false
		if discount_slider:
			discount_slider.value = 0
		return

	match current_quote.status:
		Quote.Status.DRAFT:
			send_button.disabled = false
			send_button.visible = true
			approve_button.visible = false
			reject_button.visible = false
			discount_slider.editable = true
		Quote.Status.SENT:
			send_button.visible = false
			approve_button.visible = true
			reject_button.visible = true
			approve_button.disabled = false
			reject_button.disabled = false
			discount_slider.editable = false
		_:
			send_button.visible = false
			approve_button.visible = false
			reject_button.visible = false
			discount_slider.editable = false

	discount_slider.value = current_quote.discount * 100

func _on_discount_changed(p_value: float) -> void:
	if current_quote and current_quote.status == Quote.Status.DRAFT:
		current_quote.set_discount_percentage(p_value / 100.0)
		_refresh_summary()
	if discount_value_label:
		discount_value_label.text = "%.0f%%" % p_value

func _on_approve_pressed() -> void:
	if current_quote:
		GameManager.approve_quote(current_quote)
		quote_approved.emit(current_quote)
		AudioManager.play_sfx(AudioManager.SFXType.QUOTE_APPROVED)
		_update_button_states()

func _on_reject_pressed() -> void:
	if current_quote:
		GameManager.reject_quote(current_quote)
		quote_rejected.emit(current_quote)
		AudioManager.play_sfx(AudioManager.SFXType.QUOTE_REJECTED)
		_update_button_states()

func _on_send_pressed() -> void:
	if current_quote:
		current_quote.status = Quote.Status.SENT
		quote_sent.emit(current_quote)
		AudioManager.play_click()
		_update_button_states()
		TutorialManager.check_step_completion("confirm", {})

func _process(delta: float) -> void:
	if current_quote:
		_refresh_summary()

func clear_quote() -> void:
	current_quote = null
	current_order = null

	header_label.text = "报价单"
	quote_id_label.text = "请选择工单"
	status_label.text = "待选择工单"
	status_label.add_theme_color_override("font_color", Color(0.5, 0.6, 0.7))
	customer_label.text = ""
	order_id_label.text = ""
	discount_slider.value = 0
	discount_slider.editable = false
	if discount_value_label:
		discount_value_label.text = "0%"

	for child in items_list.get_children():
		child.queue_free()

	var hint_label = Label.new()
	hint_label.text = "点击左侧工单卡片，系统将自动生成报价单"
	hint_label.add_theme_font_size_override("font_size", 13)
	hint_label.add_theme_color_override("font_color", Color(0.5, 0.6, 0.7, 0.8))
	hint_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	hint_label.custom_minimum_size = Vector2(0, 80)
	hint_label.size_flags_vertical = SIZE_SHRINK_CENTER
	items_list.add_child(hint_label)

	labor_cost_label.text = "¥0.00"
	parts_cost_label.text = "¥0.00"
	subtotal_label.text = "¥0.00"
	discount_label.text = "¥0.00"
	tax_label.text = "¥0.00"
	total_label.text = "¥0.00"
	time_remaining_label.text = "--:--"
	time_remaining_label.add_theme_color_override("font_color", Color(0.5, 0.6, 0.7))

	_update_button_states()
