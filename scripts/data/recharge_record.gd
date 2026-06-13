class_name RechargeRecord

var id: String
var amount: float
var customer_id: String
var customer_name: String
var timestamp: float
var type: String
var is_used: bool
var bonus_percent: float

func _init(p_amount: float = 0.0, p_customer_id: String = "") -> void:
	id = "recharge_" + str(Time.get_ticks_msec()) + "_" + str(randi())
	amount = p_amount
	customer_id = p_customer_id
	customer_name = ""
	timestamp = Time.get_ticks_msec() / 1000.0
	type = "normal"
	is_used = false
	bonus_percent = 0.0
	_calculate_bonus()

func _calculate_bonus() -> void:
	if amount >= 1000:
		bonus_percent = 0.2
	elif amount >= 500:
		bonus_percent = 0.1
	elif amount >= 200:
		bonus_percent = 0.05
	else:
		bonus_percent = 0.0

func get_bonus_amount() -> float:
	return amount * bonus_percent

func get_total_amount() -> float:
	return amount + get_bonus_amount()

func use() -> void:
	is_used = true

func to_dict() -> Dictionary:
	return {
		"id": id,
		"amount": amount,
		"customer_id": customer_id,
		"customer_name": customer_name,
		"timestamp": timestamp,
		"type": type,
		"is_used": is_used,
		"bonus_percent": bonus_percent
	}

static func from_dict(data: Dictionary) -> RechargeRecord:
	var record = RechargeRecord.new(data.get("amount", 0.0), data.get("customer_id", ""))
	record.id = data.get("id", record.id)
	record.customer_name = data.get("customer_name", "")
	record.timestamp = data.get("timestamp", record.timestamp)
	record.type = data.get("type", "normal")
	record.is_used = data.get("is_used", false)
	record.bonus_percent = data.get("bonus_percent", 0.0)
	return record

static func generate_random() -> RechargeRecord:
	var amounts = [100, 200, 300, 500, 800, 1000, 2000]
	var amount = amounts[randi() % amounts.size()]
	var record = RechargeRecord.new(amount)
	var names = ["小美", "莉莉", "晓雯", "雨萱", "思琪", "雅婷"]
	record.customer_name = names[randi() % names.size()]
	return record
