class_name CustomerData

var id: String
var name: String
var type: String
var patience: float
var max_patience: float
var wanted_projects: Array
var review_tags: Array
var satisfaction: float
var recharge_amount: float
var avatar: String

func _init(p_type: String = "normal") -> void:
	id = "customer_" + str(Time.get_ticks_msec()) + "_" + str(randi())
	type = p_type
	_setup_by_type()
	satisfaction = 50.0
	recharge_amount = 0

func _setup_by_type() -> void:
	match type:
		"wash_cut":
			name = _get_random_name()
			patience = 60.0
			max_patience = 60.0
			wanted_projects = ["洗剪吹"]
			review_tags = ["干净", "快"]
			avatar = "👩"
		"wash_dry":
			name = _get_random_name()
			patience = 50.0
			max_patience = 50.0
			wanted_projects = ["洗吹造型"]
			review_tags = ["造型美", "服务好"]
			avatar = "👩‍🦰"
		"color":
			name = _get_random_name()
			patience = 90.0
			max_patience = 90.0
			wanted_projects = ["染发"]
			review_tags = ["颜色正", "专业"]
			avatar = "👩‍🦳"
		"perm":
			name = _get_random_name()
			patience = 120.0
			max_patience = 120.0
			wanted_projects = ["烫发"]
			review_tags = ["卷度自然", "持久"]
			avatar = "👩‍🦱"
		"treatment":
			name = _get_random_name()
			patience = 80.0
			max_patience = 80.0
			wanted_projects = ["护理"]
			review_tags = ["发质变好", "舒服"]
			avatar = "👧"
		_:
			name = _get_random_name()
			patience = 60.0
			max_patience = 60.0
			wanted_projects = ["洗剪吹"]
			review_tags = ["满意"]
			avatar = "🧑"

func _get_random_name() -> String:
	var names = ["小美", "莉莉", "晓雯", "雨萱", "思琪", "雅婷", "佳怡", "梦瑶", "欣怡", "梓涵"]
	return names[randi() % names.size()]

func update_patience(delta: float) -> void:
	patience -= delta
	if patience < 0:
		patience = 0

func is_patient() -> bool:
	return patience > 0

func get_patience_percent() -> float:
	if max_patience <= 0:
		return 0.0
	return patience / max_patience

func add_recharge(amount: float) -> void:
	recharge_amount += amount
	satisfaction = min(100.0, satisfaction + amount * 0.1)

func set_review_tags(tags: Array) -> void:
	review_tags = tags.duplicate()

func add_review_tag(tag: String) -> void:
	if not tag in review_tags:
		review_tags.append(tag)

func remove_review_tag(tag: String) -> void:
	if tag in review_tags:
		review_tags.erase(tag)

func to_dict() -> Dictionary:
	return {
		"id": id,
		"name": name,
		"type": type,
		"patience": patience,
		"max_patience": max_patience,
		"wanted_projects": wanted_projects.duplicate(),
		"review_tags": review_tags.duplicate(),
		"satisfaction": satisfaction,
		"recharge_amount": recharge_amount,
		"avatar": avatar
	}

static func from_dict(data: Dictionary) -> CustomerData:
	var customer = CustomerData.new(data.get("type", "normal"))
	customer.id = data.get("id", customer.id)
	customer.name = data.get("name", customer.name)
	customer.patience = data.get("patience", customer.patience)
	customer.max_patience = data.get("max_patience", customer.max_patience)
	customer.wanted_projects = data.get("wanted_projects", customer.wanted_projects)
	customer.review_tags = data.get("review_tags", customer.review_tags)
	customer.satisfaction = data.get("satisfaction", customer.satisfaction)
	customer.recharge_amount = data.get("recharge_amount", customer.recharge_amount)
	customer.avatar = data.get("avatar", customer.avatar)
	return customer
