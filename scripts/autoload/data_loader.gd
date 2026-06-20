extends Node

signal data_loaded()

var ticket_types: Array = []
var levels: Array = []
var order_templates: Array = []
var tutorials: Array = []

var _is_loaded: bool = false

func _ready() -> void:
	load_all_data()

func load_all_data() -> void:
	_load_json("res://data/ticket_types.json", "ticket_types")
	_load_json("res://data/levels.json", "levels")
	_load_json("res://data/order_templates.json", "order_templates")
	_load_json("res://data/tutorials.json", "tutorials")
	_is_loaded = true
	data_loaded.emit()

func _load_json(file_path: String, target_var: String) -> void:
	var file := FileAccess.open(file_path, FileAccess.READ)
	if file:
		var content: String = file.get_as_text()
		file.close()
		var parsed: Variant = JSON.parse_string(content)
		if typeof(parsed) == TYPE_ARRAY:
			set(target_var, parsed)
		else:
			push_error("Failed to parse JSON: " + file_path)
	else:
		push_error("Failed to open file: " + file_path)

func is_loaded() -> bool:
	return _is_loaded

func get_ticket_type_by_id(id: String) -> Dictionary:
	for tt in ticket_types:
		if tt["id"] == id:
			return tt
	return {}

func get_level_by_id(id: String) -> Dictionary:
	for lvl in levels:
		if lvl["id"] == id:
			return lvl
	return {}

func get_tutorial_by_id(id: String) -> Dictionary:
	for t in tutorials:
		if t["id"] == id:
			return t
	return {}

func get_order_templates_for_level(level_data: Dictionary) -> Array:
	var allowed_types: Array = level_data.get("ticket_types", [])
	var result: Array = []
	for tpl in order_templates:
		if tpl["ticket_type_id"] in allowed_types:
			result.append(tpl.duplicate(true))
	return result

func generate_random_orders(level_data: Dictionary) -> Array:
	var templates: Array = get_order_templates_for_level(level_data)
	var count: int = level_data.get("order_count", 5)
	var result: Array = []
	for i in range(count):
		var idx: int = randi() % templates.size()
		var order: Dictionary = templates[idx].duplicate(true)
		order["order_id"] = "ORD-%04d-%06d" % [Time.get_unix_time_from_system(), i]
		result.append(order)
	result.shuffle()
	return result
