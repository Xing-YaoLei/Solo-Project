extends Control

signal part_selected(p_part: Part)
signal part_restock_requested(p_part: Part)

@onready var parts_list: VBoxContainer = $ScrollContainer/PartsList
@onready var category_filter: OptionButton = $TopBar/FiltersRow/CategoryFilter
@onready var search_input: LineEdit = $TopBar/FiltersRow/SearchInput
@onready var status_filter: OptionButton = $TopBar/FiltersRow/StatusFilter

var selected_part: Part = null
var parts: Array[Part] = []
var current_category_filter: String = "全部"
var current_status_filter: String = "全部"

func _ready():
	_setup_filters()
	_refresh_parts_list()

	category_filter.item_selected.connect(_on_category_filter_changed)
	status_filter.item_selected.connect(_on_status_filter_changed)
	search_input.text_changed.connect(_on_search_text_changed)

	GameManager.part_consumed.connect(_on_part_consumed)

func _setup_filters() -> void:
	category_filter.clear()
	category_filter.add_item("全部")
	category_filter.add_item("发动机")
	category_filter.add_item("变速箱")
	category_filter.add_item("刹车系统")
	category_filter.add_item("悬挂系统")
	category_filter.add_item("电气系统")
	category_filter.add_item("滤清器")
	category_filter.add_item("油液")
	category_filter.add_item("轮胎")
	category_filter.add_item("车身")
	category_filter.add_item("其他")

	status_filter.clear()
	status_filter.add_item("全部")
	status_filter.add_item("库存充足")
	status_filter.add_item("库存不足")
	status_filter.add_item("缺货")

func _refresh_parts_list() -> void:
	for child in parts_list.get_children():
		child.queue_free()

	parts.clear()
	for part in GameManager.parts_inventory.values():
		if _matches_filters(part):
			parts.append(part)

	parts.sort_custom(func(a: Part, b: Part) -> bool:
		if a.is_out_of_stock != b.is_out_of_stock:
			return a.is_out_of_stock
		if a.is_low_stock != b.is_low_stock:
			return a.is_low_stock
		return a.name < b.name
	)

	for part in parts:
		var item = _create_part_item(part)
		parts_list.add_child(item)

func _matches_filters(p_part: Part) -> bool:
	if current_category_filter != "全部":
		if p_part.get_category_text() != current_category_filter:
			return false

	if current_status_filter != "全部":
		match current_status_filter:
			"库存充足":
				if p_part.is_low_stock or p_part.is_out_of_stock:
					return false
			"库存不足":
				if not p_part.is_low_stock or p_part.is_out_of_stock:
					return false
			"缺货":
				if not p_part.is_out_of_stock:
					return false

	if search_input.text.strip_edges() != "":
		var search_text = search_input.text.strip_edges().to_lower()
		if not p_part.name.to_lower().contains(search_text) and not p_part.id.to_lower().contains(search_text):
			return false

	return true

func _create_part_item(p_part: Part) -> Control:
	var item = PanelContainer.new()
	item.custom_minimum_size = Vector2(0, 60)
	item.name = "PartItem_%s" % p_part.id

	var style = StyleBoxFlat.new()
	style.bg_color = Color(0.25, 0.3, 0.35, 0.9)
	style.corner_radius_top_left = 6
	style.corner_radius_top_right = 6
	style.corner_radius_bottom_right = 6
	style.corner_radius_bottom_left = 6
	style.content_margin_left = 10
	style.content_margin_right = 10
	style.content_margin_top = 8
	style.content_margin_bottom = 8
	item.add_theme_stylebox_override("panel", style)

	var hbox = HBoxContainer.new()
	hbox.size_flags_horizontal = SIZE_EXPAND_FILL
	item.add_child(hbox)

	var status_indicator = ColorRect.new()
	status_indicator.custom_minimum_size = Vector2(8, 0)
	status_indicator.color = p_part.get_stock_color()
	hbox.add_child(status_indicator)

	var spacer1 = Control.new()
	spacer1.custom_minimum_size = Vector2(10, 0)
	hbox.add_child(spacer1)

	var info_vbox = VBoxContainer.new()
	info_vbox.size_flags_horizontal = SIZE_EXPAND_FILL
	hbox.add_child(info_vbox)

	var name_label = Label.new()
	name_label.text = p_part.name
	name_label.add_theme_font_size_override("font_size", 14)
	name_label.add_theme_color_override("font_color", Color.WHITE)
	info_vbox.add_child(name_label)

	var details_hbox = HBoxContainer.new()
	details_hbox.add_theme_constant_override("spacing", 15)
	info_vbox.add_child(details_hbox)

	var id_label = Label.new()
	id_label.text = "ID: %s" % p_part.id
	id_label.add_theme_font_size_override("font_size", 11)
	id_label.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
	details_hbox.add_child(id_label)

	var cat_label = Label.new()
	cat_label.text = p_part.get_category_text()
	cat_label.add_theme_font_size_override("font_size", 11)
	cat_label.add_theme_color_override("font_color", Color(0.7, 0.8, 1.0))
	details_hbox.add_child(cat_label)

	var price_label = Label.new()
	price_label.text = "¥%.2f/件" % p_part.unit_price
	price_label.add_theme_font_size_override("font_size", 11)
	price_label.add_theme_color_override("font_color", Color(0.8, 1.0, 0.8))
	details_hbox.add_child(price_label)

	var right_vbox = VBoxContainer.new()
	right_vbox.alignment = ALIGNMENT_CENTER
	right_vbox.size_flags_horizontal = SIZE_SHRINK_END
	hbox.add_child(right_vbox)

	var stock_label = Label.new()
	stock_label.text = "库存: %d/%d" % [p_part.stock_quantity, p_part.max_stock]
	stock_label.add_theme_font_size_override("font_size", 14)
	stock_label.add_theme_color_override("font_color", p_part.get_stock_color())
	stock_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	right_vbox.add_child(stock_label)

	var status_label = Label.new()
	status_label.text = p_part.get_stock_status_text()
	status_label.add_theme_font_size_override("font_size", 11)
	status_label.add_theme_color_override("font_color", p_part.get_stock_color())
	status_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	right_vbox.add_child(status_label)

	var restock_button = Button.new()
	restock_button.text = "补货"
	restock_button.custom_minimum_size = Vector2(60, 24)
	restock_button.add_theme_font_size_override("font_size", 11)
	restock_button.visible = p_part.is_low_stock or p_part.is_out_of_stock
	restock_button.pressed.connect(func():
		_on_restock_requested(p_part)
	)
	right_vbox.add_child(restock_button)

	item.gui_input.connect(func(event):
		if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			_on_part_item_clicked(p_part, item)
	)

	item.mouse_entered.connect(func():
		if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.LOW):
			var tween = create_tween()
			tween.tween_property(item, "modulate", Color(1.1, 1.1, 1.1), 0.1)
		AudioManager.play_sfx(AudioManager.SFXType.BUTTON_HOVER)
	)

	item.mouse_exited.connect(func():
		if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.LOW):
			var tween = create_tween()
			tween.tween_property(item, "modulate", Color.WHITE, 0.1)
	)

	return item

func _on_part_item_clicked(p_part: Part, p_item: Control) -> void:
	selected_part = p_part
	part_selected.emit(p_part)
	AudioManager.play_click()

	for child in parts_list.get_children():
		if child is PanelContainer:
			var style = child.get_theme_stylebox("panel")
			if child == p_item:
				style.bg_color = Color(0.4, 0.5, 0.8, 0.9)
			else:
				style.bg_color = Color(0.25, 0.3, 0.35, 0.9)

func _on_restock_requested(p_part: Part) -> void:
	var restock_amount = p_part.max_stock - p_part.stock_quantity
	p_part.restock(restock_amount)
	_refresh_parts_list()
	AudioManager.play_sfx(AudioManager.SFXType.SUCCESS)
	part_restock_requested.emit(p_part)

func _on_category_filter_changed(p_index: int) -> void:
	current_category_filter = category_filter.get_item_text(p_index)
	_refresh_parts_list()
	AudioManager.play_click()

func _on_status_filter_changed(p_index: int) -> void:
	current_status_filter = status_filter.get_item_text(p_index)
	_refresh_parts_list()
	AudioManager.play_click()

func _on_search_text_changed(p_text: String) -> void:
	_refresh_parts_list()

func _on_part_consumed(p_part: Part, p_quantity: int) -> void:
	_refresh_parts_list()

func highlight_part(p_part_id: String) -> void:
	for child in parts_list.get_children():
		if child.name == "PartItem_%s" % p_part_id:
			child.modulate = Color(1.5, 1.5, 1.0)
			await get_tree().create_timer(0.5).timeout
			child.modulate = Color.WHITE
			break
