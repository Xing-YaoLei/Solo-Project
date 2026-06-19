class_name Quote
extends RefCounted

enum Status { DRAFT, SENT, APPROVED, REJECTED, EXPIRED }

var id: String
var work_order_id: String
var customer_name: String
var items: Array[QuoteItem]
var labor_cost: float
var parts_cost: float
var discount: float
var tax_rate: float
var status: Status
var expiration_time: float
var created_at: float
var notes: String

func _init(p_id: String, p_work_order_id: String, p_customer_name: String, p_labor_cost: float = 0.0, p_tax_rate: float = 0.13):
	id = p_id
	work_order_id = p_work_order_id
	customer_name = p_customer_name
	items = []
	labor_cost = p_labor_cost
	parts_cost = 0.0
	discount = 0.0
	tax_rate = p_tax_rate
	status = Status.DRAFT
	expiration_time = 7200.0
	created_at = Time.get_unix_time_from_system()
	notes = ""

func add_item(p_part_id: String, p_part_name: String, p_quantity: int, p_unit_price: float) -> void:
	var item = QuoteItem.new(p_part_id, p_part_name, p_quantity, p_unit_price)
	items.append(item)
	parts_cost += item.get_total()

func remove_item(p_index: int) -> void:
	if p_index >= 0 and p_index < items.size():
		var item = items[p_index]
		parts_cost -= item.get_total()
		items.remove_at(p_index)

func get_subtotal() -> float:
	return labor_cost + parts_cost

func get_discount_amount() -> float:
	return get_subtotal() * discount

func get_taxable_amount() -> float:
	return get_subtotal() - get_discount_amount()

func get_tax_amount() -> float:
	return get_taxable_amount() * tax_rate

func get_total() -> float:
	return get_taxable_amount() + get_tax_amount()

func get_status_text() -> String:
	match status:
		Status.DRAFT:
			return "草稿"
		Status.SENT:
			return "已发送"
		Status.APPROVED:
			return "已批准"
		Status.REJECTED:
			return "已拒绝"
		Status.EXPIRED:
			return "已过期"
		_:
			return "未知"

func is_expired() -> bool:
	return Time.get_unix_time_from_system() > (created_at + expiration_time)

func get_remaining_time() -> float:
	var remaining = (created_at + expiration_time) - Time.get_unix_time_from_system()
	return max(remaining, 0.0)

func set_discount_percentage(p_percentage: float) -> void:
	discount = clamp(p_percentage, 0.0, 1.0)

func set_labor_cost(p_cost: float) -> void:
	labor_cost = max(p_cost, 0.0)


class QuoteItem extends RefCounted:
	var part_id: String
	var part_name: String
	var quantity: int
	var unit_price: float

	func _init(p_part_id: String, p_part_name: String, p_quantity: int, p_unit_price: float):
		part_id = p_part_id
		part_name = p_part_name
		quantity = p_quantity
		unit_price = p_unit_price

	func get_total() -> float:
		return quantity * unit_price
