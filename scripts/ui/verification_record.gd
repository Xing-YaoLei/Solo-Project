extends Panel

@onready var status_icon: Label = $ContentContainer/StatusIcon
@onready var date_label: Label = $ContentContainer/VBoxContainer/DateLabel
@onready var package_label: Label = $ContentContainer/VBoxContainer/PackageLabel
@onready var price_label: Label = $ContentContainer/PriceLabel
@onready var details_label: Label = $ContentContainer/VBoxContainer/DetailsLabel

var record_data = null

func setup(record):
	record_data = record
	if record_data:
		_update_status()
		_update_date()
		_update_package()
		_update_price()
		_update_details()

func _update_status():
	if record_data.is_correct:
		status_icon.text = "✓"
		status_icon.add_theme_color_override("font_color", Color(0.18, 0.8, 0.44))
	else:
		status_icon.text = "✗"
		status_icon.add_theme_color_override("font_color", Color(0.91, 0.3, 0.24))

func _update_date():
	date_label.text = "%s → %s" % [record_data.checkin_date, record_data.checkout_date]

func _update_package():
	var pkg = GameData.get_package(record_data.package_id)
	if pkg:
		package_label.text = "%s · %d人" % [pkg.name, record_data.guest_count]
	else:
		package_label.text = "未知套餐 · %d人" % record_data.guest_count

func _update_price():
	if record_data.is_correct:
		price_label.text = "¥%.2f" % record_data.final_price
		price_label.add_theme_color_override("font_color", Color(0.18, 0.8, 0.44))
	else:
		price_label.text = "¥%.2f / ¥%.2f" % [record_data.final_price, record_data.expected_price]
		price_label.add_theme_color_override("font_color", Color(0.91, 0.3, 0.24))

func _update_details():
	if record_data.applied_rules.is_empty():
		details_label.text = "无价格规则"
		return
	
	var rule_names = []
	for rule in record_data.applied_rules:
		rule_names.append(rule.name)
	details_label.text = "规则: %s" % ", ".join(rule_names)
