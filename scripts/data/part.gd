class_name Part
extends RefCounted

enum Category { ENGINE, TRANSMISSION, BRAKES, SUSPENSION, ELECTRICAL, FILTERS, FLUIDS, TIRES, BODY, OTHER }

var id: String
var name: String
var category: Category
var stock_quantity: int
var min_stock: int
var max_stock: int
var unit_price: float
var supplier: String
var lead_time: float
var is_low_stock: bool
var is_out_of_stock: bool

func _init(p_id: String, p_name: String, p_category: Category, p_stock: int, p_min_stock: int, p_max_stock: int, p_price: float, p_supplier: String = "默认供应商", p_lead_time: float = 24.0):
	id = p_id
	name = p_name
	category = p_category
	stock_quantity = p_stock
	min_stock = p_min_stock
	max_stock = p_max_stock
	unit_price = p_price
	supplier = p_supplier
	lead_time = p_lead_time
	update_stock_status()

func update_stock_status() -> void:
	is_low_stock = stock_quantity <= min_stock
	is_out_of_stock = stock_quantity <= 0

func get_stock_color() -> Color:
	if is_out_of_stock:
		return Color(0.8, 0.2, 0.2)
	elif is_low_stock:
		return Color(1.0, 0.6, 0.2)
	else:
		return Color(0.3, 0.8, 0.3)

func get_stock_status_text() -> String:
	if is_out_of_stock:
		return "缺货"
	elif is_low_stock:
		return "库存不足"
	else:
		return "库存充足"

func get_category_text() -> String:
	match category:
		Category.ENGINE:
			return "发动机"
		Category.TRANSMISSION:
			return "变速箱"
		Category.BRAKES:
			return "刹车系统"
		Category.SUSPENSION:
			return "悬挂系统"
		Category.ELECTRICAL:
			return "电气系统"
		Category.FILTERS:
			return "滤清器"
		Category.FLUIDS:
			return "油液"
		Category.TIRES:
			return "轮胎"
		Category.BODY:
			return "车身"
		Category.OTHER:
			return "其他"
		_:
			return "未知"

func consume(p_quantity: int) -> bool:
	if stock_quantity >= p_quantity:
		stock_quantity -= p_quantity
		update_stock_status()
		return true
	return false

func restock(p_quantity: int) -> void:
	stock_quantity = min(stock_quantity + p_quantity, max_stock)
	update_stock_status()

func can_fulfill(p_quantity: int) -> bool:
	return stock_quantity >= p_quantity

func get_total_value() -> float:
	return stock_quantity * unit_price
