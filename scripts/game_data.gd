extends Node

signal package_selected(package_data)
signal date_selected(date_data)
signal verification_completed(result)

enum PackageType {
	STANDARD,
	PREMIUM,
	FAMILY,
	ROMANTIC,
	BUSINESS
}

enum DateStatus {
	AVAILABLE,
	BOOKED,
	PEAK,
	OFF_PEAK,
	HOLIDAY
}

enum RuleCondition {
	DATE_RANGE,
	DAY_OF_WEEK,
	PACKAGE_TYPE,
	STAY_DURATION,
	GUEST_COUNT,
	COMBINATION
}

enum RuleEffect {
	DISCOUNT_FIXED,
	DISCOUNT_PERCENT,
	SURCHARGE_FIXED,
	SURCHARGE_PERCENT,
	GIFT,
	UPGRADE
}

class PackageData:
	var id: String
	var name: String
	var type: PackageType
	var base_price: float
	var description: String
	var max_guests: int
	var min_stay: int
	var max_stay: int
	var includes: Array
	
	func _init(p_id: String, p_name: String, p_type: PackageType, p_base: float, p_desc: String, p_max_guests: int = 2, p_min_stay: int = 1, p_max_stay: int = 30):
		id = p_id
		name = p_name
		type = p_type
		base_price = p_base
		description = p_desc
		max_guests = p_max_guests
		min_stay = p_min_stay
		max_stay = p_max_stay
		includes = []
	
	func add_include(item: String):
		includes.append(item)

class PriceRule:
	var id: String
	var name: String
	var description: String
	var condition: RuleCondition
	var condition_params: Dictionary
	var effect: RuleEffect
	var effect_value: float
	var priority: int
	var is_active: bool
	
	func _init(p_id: String, p_name: String, p_desc: String, p_cond: RuleCondition, p_cond_params: Dictionary, p_effect: RuleEffect, p_effect_val: float, p_priority: int = 0):
		id = p_id
		name = p_name
		description = p_desc
		condition = p_cond
		condition_params = p_cond_params
		effect = p_effect
		effect_value = p_effect_val
		priority = p_priority
		is_active = true
	
	func check_condition(date_data, package_data, stay_days: int, guest_count: int) -> bool:
		if not is_active:
			return false
		match condition:
			RuleCondition.DATE_RANGE:
				return _check_date_range(date_data)
			RuleCondition.DAY_OF_WEEK:
				return _check_day_of_week(date_data)
			RuleCondition.PACKAGE_TYPE:
				return _check_package_type(package_data)
			RuleCondition.STAY_DURATION:
				return _check_stay_duration(stay_days)
			RuleCondition.GUEST_COUNT:
				return _check_guest_count(guest_count)
			RuleCondition.COMBINATION:
				return _check_combination(date_data, package_data, stay_days, guest_count)
		return false
	
	func _check_date_range(date_data) -> bool:
		var start_date: String = condition_params.get("start_date", "")
		var end_date: String = condition_params.get("end_date", "")
		if start_date == "" or end_date == "":
			return true
		return date_data.date >= start_date and date_data.date <= end_date
	
	func _check_day_of_week(date_data) -> bool:
		var allowed_days: Array = condition_params.get("days_of_week", [])
		if allowed_days.is_empty():
			return true
		return date_data.day_of_week in allowed_days
	
	func _check_package_type(package_data) -> bool:
		var allowed_types: Array = condition_params.get("package_types", [])
		if allowed_types.is_empty():
			return true
		return package_data.type in allowed_types
	
	func _check_stay_duration(stay_days: int) -> bool:
		var min_days: int = condition_params.get("min_days", 0)
		var max_days: int = condition_params.get("max_days", 999)
		return stay_days >= min_days and stay_days <= max_days
	
	func _check_guest_count(guest_count: int) -> bool:
		var min_guests: int = condition_params.get("min_guests", 0)
		var max_guests: int = condition_params.get("max_guests", 99)
		return guest_count >= min_guests and guest_count <= max_guests
	
	func _check_combination(date_data, package_data, stay_days: int, guest_count: int) -> bool:
		var sub_conditions: Array = condition_params.get("conditions", [])
		var require_all: bool = condition_params.get("require_all", true)
		for sub_cond in sub_conditions:
			var sub_rule = PriceRule.new("", "", "", sub_cond.get("type", 0), sub_cond.get("params", {}), 0, 0)
			var result = sub_rule.check_condition(date_data, package_data, stay_days, guest_count)
			if require_all and not result:
				return false
			if not require_all and result:
				return true
		return require_all
	
	func apply_effect(current_price: float) -> float:
		match effect:
			RuleEffect.DISCOUNT_FIXED:
				return max(0, current_price - effect_value)
			RuleEffect.DISCOUNT_PERCENT:
				return current_price * (1 - effect_value / 100)
			RuleEffect.SURCHARGE_FIXED:
				return current_price + effect_value
			RuleEffect.SURCHARGE_PERCENT:
				return current_price * (1 + effect_value / 100)
		return current_price

class DateData:
	var date: String
	var day_of_week: int
	var status: DateStatus
	var base_rate_multiplier: float
	var is_weekend: bool
	var is_holiday: bool
	
	func _init(p_date: String, p_day: int, p_status: DateStatus = DateStatus.AVAILABLE):
		date = p_date
		day_of_week = p_day
		status = p_status
		is_weekend = (p_day >= 5)
		is_holiday = (p_status == DateStatus.HOLIDAY)
		_update_rate_multiplier()
	
	func _update_rate_multiplier():
		match status:
			DateStatus.PEAK:
				base_rate_multiplier = 1.5
			DateStatus.HOLIDAY:
				base_rate_multiplier = 2.0
			DateStatus.OFF_PEAK:
				base_rate_multiplier = 0.7
			_:
				base_rate_multiplier = 1.0
		if is_weekend and status == DateStatus.AVAILABLE:
			base_rate_multiplier = 1.2
	
	func get_status_text() -> String:
		match status:
			DateStatus.AVAILABLE:
				return "可预订"
			DateStatus.BOOKED:
				return "已预订"
			DateStatus.PEAK:
				return "旺季"
			DateStatus.OFF_PEAK:
				return "淡季"
			DateStatus.HOLIDAY:
				return "节假日"
		return "未知"
	
	func get_status_color() -> Color:
		match status:
			DateStatus.AVAILABLE:
				return Color(0.18, 0.8, 0.44)
			DateStatus.BOOKED:
				return Color(0.55, 0.55, 0.55)
			DateStatus.PEAK:
				return Color(0.95, 0.61, 0.07)
			DateStatus.OFF_PEAK:
				return Color(0.2, 0.6, 0.86)
			DateStatus.HOLIDAY:
				return Color(0.91, 0.3, 0.24)
		return Color.WHITE

class VerificationRecord:
	var id: String
	var timestamp: float
	var package_id: String
	var checkin_date: String
	var checkout_date: String
	var guest_count: int
	var base_price: float
	var final_price: float
	var applied_rules: Array
	var is_correct: bool
	var expected_price: float
	
	func _init(p_id: String, p_pkg_id: String, p_checkin: String, p_checkout: String, p_guests: int, p_base: float, p_final: float, p_rules: Array, p_correct: bool, p_expected: float):
		id = p_id
		timestamp = Time.get_unix_time_from_system()
		package_id = p_pkg_id
		checkin_date = p_checkin
		checkout_date = p_checkout
		guest_count = p_guests
		base_price = p_base
		final_price = p_final
		applied_rules = p_rules
		is_correct = p_correct
		expected_price = p_expected

class LevelData:
	var id: String
	var name: String
	var description: String
	var type: String
	var difficulty: int
	var target_conversion_rate: float
	var time_limit: float
	var packages: Array
	var rules: Array
	var dates: Array
	var tasks: Array
	var target_sales: int
	
	func _init(p_id: String, p_name: String, p_desc: String, p_type: String = "training", p_diff: int = 1):
		id = p_id
		name = p_name
		description = p_desc
		type = p_type
		difficulty = p_diff
		target_conversion_rate = 0.7
		time_limit = 300.0
		target_sales = 10
		packages = []
		rules = []
		dates = []
		tasks = []

class Task:
	var id: String
	var description: String
	var package_type: int
	var checkin_date: String
	var stay_days: int
	var guest_count: int
	var expected_price: float
	var hint: String
	
	func _init(p_id: String, p_desc: String, p_pkg_type: int, p_checkin: String, p_stay: int, p_guests: int, p_expected: float, p_hint: String = ""):
		id = p_id
		description = p_desc
		package_type = p_pkg_type
		checkin_date = p_checkin
		stay_days = p_stay
		guest_count = p_guests
		expected_price = p_expected
		hint = p_hint

var all_packages: Dictionary = {}
var all_rules: Dictionary = {}
var all_levels: Dictionary = {}

func _ready():
	_initialize_packages()
	_initialize_rules()
	_initialize_levels()

func _initialize_packages():
	var std = PackageData.new("pkg_std", "标准间", PackageType.STANDARD, 298.0, "温馨舒适的标准房间，配备基础设施。", 2)
	std.add_include("免费WiFi")
	std.add_include("双人早餐")
	std.add_include("空调")
	all_packages["pkg_std"] = std
	
	var prm = PackageData.new("pkg_prm", "豪华间", PackageType.PREMIUM, 598.0, "宽敞豪华的房间，配备高档设施和景观。", 2)
	prm.add_include("免费WiFi")
	prm.add_include("双人早餐")
	prm.add_include("迷你吧")
	prm.add_include("景观阳台")
	all_packages["pkg_prm"] = prm
	
	var fam = PackageData.new("pkg_fam", "家庭套房", PackageType.FAMILY, 888.0, "适合家庭入住的套房，多床设计。", 4, 2)
	fam.add_include("免费WiFi")
	fam.add_include("四人早餐")
	fam.add_include("儿童用品")
	fam.add_include("客厅")
	all_packages["pkg_fam"] = fam
	
	var rom = PackageData.new("pkg_rom", "浪漫套餐", PackageType.ROMANTIC, 998.0, "浪漫主题房间，含香槟和鲜花。", 2, 1)
	rom.add_include("免费WiFi")
	rom.add_include("双人早餐")
	rom.add_include("香槟")
	rom.add_include("鲜花布置")
	all_packages["pkg_rom"] = rom
	
	var biz = PackageData.new("pkg_biz", "商务套房", PackageType.BUSINESS, 688.0, "配备办公设施的商务套房。", 2)
	biz.add_include("免费WiFi")
	biz.add_include("单人早餐")
	biz.add_include("办公桌椅")
	biz.add_include("会议室2小时")
	all_packages["pkg_biz"] = biz

func _initialize_rules():
	var rule1 = PriceRule.new(
		"rule_weekend_surcharge",
		"周末加价",
		"周五、周六入住加价20%",
		RuleCondition.DAY_OF_WEEK,
		{"days_of_week": [5, 6]},
		RuleEffect.SURCHARGE_PERCENT,
		20.0,
		10
	)
	all_rules["rule_weekend_surcharge"] = rule1
	
	var rule2 = PriceRule.new(
		"rule_holiday_surcharge",
		"节假日加价",
		"节假日入住加价100%",
		RuleCondition.DATE_RANGE,
		{"start_date": "2026-10-01", "end_date": "2026-10-07"},
		RuleEffect.SURCHARGE_PERCENT,
		100.0,
		20
	)
	all_rules["rule_holiday_surcharge"] = rule2
	
	var rule3 = PriceRule.new(
		"rule_long_stay_discount",
		"长住优惠",
		"入住3天及以上享8折优惠",
		RuleCondition.STAY_DURATION,
		{"min_days": 3},
		RuleEffect.DISCOUNT_PERCENT,
		20.0,
		5
	)
	all_rules["rule_long_stay_discount"] = rule3
	
	var rule4 = PriceRule.new(
		"rule_off_season",
		"淡季优惠",
		"淡季期间入住享7折",
		RuleCondition.DATE_RANGE,
		{"start_date": "2026-01-01", "end_date": "2026-02-28"},
		RuleEffect.DISCOUNT_PERCENT,
		30.0,
		15
	)
	all_rules["rule_off_season"] = rule4
	
	var rule5 = PriceRule.new(
		"rule_family_package",
		"家庭套餐优惠",
		"选择家庭套房立减100元",
		RuleCondition.PACKAGE_TYPE,
		{"package_types": [PackageType.FAMILY]},
		RuleEffect.DISCOUNT_FIXED,
		100.0,
		8
	)
	all_rules["rule_family_package"] = rule5
	
	var rule6 = PriceRule.new(
		"rule_romantic_weekday",
		"浪漫平日特惠",
		"周日至周四选择浪漫套餐立减200",
		RuleCondition.COMBINATION,
		{
			"require_all": true,
			"conditions": [
				{"type": RuleCondition.PACKAGE_TYPE, "params": {"package_types": [PackageType.ROMANTIC]}},
				{"type": RuleCondition.DAY_OF_WEEK, "params": {"days_of_week": [0, 1, 2, 3, 4]}}
			]
		},
		RuleEffect.DISCOUNT_FIXED,
		200.0,
		12
	)
	all_rules["rule_romantic_weekday"] = rule6
	
	var rule7 = PriceRule.new(
		"rule_peak_season",
		"旺季加价",
		"旺季期间入住加价50%",
		RuleCondition.DATE_RANGE,
		{"start_date": "2026-07-01", "end_date": "2026-08-31"},
		RuleEffect.SURCHARGE_PERCENT,
		50.0,
		18
	)
	all_rules["rule_peak_season"] = rule7

func _initialize_levels():
	_initialize_training_levels()
	_initialize_practice_levels()

func _initialize_training_levels():
	var level1 = LevelData.new("train_001", "新手入门：价格规则基础", "学习最基础的价格计算规则", "training", 1)
	level1.target_sales = 3
	level1.time_limit = 180.0
	level1.packages = ["pkg_std", "pkg_prm"]
	level1.rules = ["rule_weekend_surcharge"]
	level1.tasks = [
		Task.new("t1", "顾客王先生预订6月22日（周一）入住标准间1晚", PackageType.STANDARD, "2026-06-22", 1, 2, 298.0, "周一非周末，按基础价格计算"),
		Task.new("t2", "顾客李女士预订6月27日（周六）入住豪华间1晚", PackageType.PREMIUM, "2026-06-27", 1, 2, 717.6, "周六属于周末，需加20%"),
		Task.new("t3", "顾客张先生预订6月29日（周一）入住标准间2晚", PackageType.STANDARD, "2026-06-29", 2, 2, 596.0, "两晚都是工作日，基础价格×2")
	]
	all_levels["train_001"] = level1
	
	var level2 = LevelData.new("train_002", "进阶训练：多规则组合", "学习叠加使用多条价格规则", "training", 2)
	level2.target_sales = 4
	level2.time_limit = 240.0
	level2.packages = ["pkg_std", "pkg_prm", "pkg_fam"]
	level2.rules = ["rule_weekend_surcharge", "rule_long_stay_discount"]
	level2.tasks = [
		Task.new("t1", "家庭顾客预订7月1日（周三）入住家庭套房3晚", PackageType.FAMILY, "2026-07-01", 3, 4, 2131.2, "提示：长住3天享8折优惠"),
		Task.new("t2", "顾客预订7月6日（周一）入住豪华间3晚", PackageType.PREMIUM, "2026-07-06", 3, 2, 1435.2, "提示：周一非周末，长住3天享8折"),
		Task.new("t3", "顾客预订7月3日（周五）入住标准间3晚", PackageType.STANDARD, "2026-07-03", 3, 2, 858.24, "提示：周五起住3晚，先长住8折，再周末加价20%"),
		Task.new("t4", "顾客预订7月4日（周六）入住标准间1晚", PackageType.STANDARD, "2026-07-04", 1, 2, 357.6, "提示：周六入住，周末加价20%")
	]
	all_levels["train_002"] = level2
	
	var level3 = LevelData.new("train_003", "高级训练：旺季与节假日", "处理复杂的季节性价格调整", "training", 3)
	level3.target_sales = 5
	level3.time_limit = 300.0
	level3.packages = ["pkg_std", "pkg_prm", "pkg_rom", "pkg_biz"]
	level3.rules = ["rule_weekend_surcharge", "rule_long_stay_discount", "rule_peak_season", "rule_romantic_weekday"]
	level3.tasks = [
		Task.new("t1", "情侣预订8月15日（周六）入住浪漫套餐2晚", PackageType.ROMANTIC, "2026-08-15", 2, 2, 3592.8, "旺季+周末，浪漫套餐无平日优惠"),
		Task.new("t2", "商务人士预订8月18日（周二）入住商务套房5晚", PackageType.BUSINESS, "2026-08-18", 5, 1, 4128.0, "旺季+长住优惠"),
		Task.new("t3", "情侣预订9月1日（周二）入住浪漫套餐1晚", PackageType.ROMANTIC, "2026-09-01", 1, 2, 798.0, "非旺季+平日浪漫套餐立减200"),
		Task.new("t4", "顾客预订7月20日（周一）入住豪华间4晚", PackageType.PREMIUM, "2026-07-20", 4, 2, 2870.4, "旺季加价50%，长住4天8折"),
		Task.new("t5", "顾客预订9月5日（周六）入住标准间3晚", PackageType.STANDARD, "2026-09-05", 3, 2, 858.24, "非旺季，周六起住3晚，周末加价+长住优惠")
	]
	all_levels["train_003"] = level3

func _initialize_practice_levels():
	var level1 = LevelData.new("free_001", "自由练习：夏季周末", "练习处理暑期周末订单", "practice", 2)
	level1.target_sales = 8
	level1.time_limit = 300.0
	level1.packages = ["pkg_std", "pkg_prm", "pkg_fam"]
	level1.rules = ["rule_weekend_surcharge", "rule_long_stay_discount", "rule_peak_season"]
	level1.tasks = []
	all_levels["free_001"] = level1
	
	var level2 = LevelData.new("free_002", "自由练习：国庆黄金周", "处理国庆期间的订单高峰", "practice", 4)
	level2.target_sales = 12
	level2.time_limit = 360.0
	level2.packages = ["pkg_std", "pkg_prm", "pkg_fam", "pkg_rom"]
	level2.rules = ["rule_weekend_surcharge", "rule_long_stay_discount", "rule_holiday_surcharge", "rule_family_package", "rule_romantic_weekday"]
	level2.tasks = []
	all_levels["free_002"] = level2
	
	var level3 = LevelData.new("free_003", "自由练习：综合挑战", "包含所有规则的综合练习", "practice", 5)
	level3.target_sales = 15
	level3.time_limit = 420.0
	level3.packages = ["pkg_std", "pkg_prm", "pkg_fam", "pkg_rom", "pkg_biz"]
	level3.rules = all_rules.keys()
	level3.tasks = []
	all_levels["free_003"] = level3

func generate_dates_for_month(year: int, month: int) -> Array:
	var dates: Array = []
	var days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
	if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0):
		days_in_month[1] = 29
	
	var first_day = _get_first_day_of_month(year, month)
	
	for day in range(1, days_in_month[month - 1] + 1):
		var date_str = "%04d-%02d-%02d" % [year, month, day]
		var day_of_week = (first_day + day - 1) % 7
		var status = _get_date_status(date_str, month, day_of_week)
		dates.append(DateData.new(date_str, day_of_week, status))
	
	return dates

func _get_first_day_of_month(year: int, month: int) -> int:
	var y = year
	var m = month
	if m < 3:
		y -= 1
		m += 12
	var k = y % 100
	var j = y / 100
	var h = (1 + int(13 * (m + 1) / 5) + k + int(k / 4) + int(j / 4) + 5 * j) % 7
	return (h + 5) % 7

func _get_date_status(date_str: String, month: int, day_of_week: int) -> int:
	if month >= 7 and month <= 8:
		return DateStatus.PEAK
	if date_str >= "2026-10-01" and date_str <= "2026-10-07":
		return DateStatus.HOLIDAY
	if month >= 1 and month <= 2:
		return DateStatus.OFF_PEAK
	return DateStatus.AVAILABLE

func get_package(pkg_id: String) -> PackageData:
	return all_packages.get(pkg_id, null)

func get_rule(rule_id: String) -> PriceRule:
	return all_rules.get(rule_id, null)

func get_level(level_id: String) -> LevelData:
	return all_levels.get(level_id, null)

func get_training_levels() -> Array:
	var result: Array = []
	for level_id in all_levels.keys():
		var level = all_levels[level_id]
		if level.type == "training":
			result.append(level)
	result.sort_custom(func(a, b): return a.difficulty < b.difficulty)
	return result

func get_practice_levels() -> Array:
	var result: Array = []
	for level_id in all_levels.keys():
		var level = all_levels[level_id]
		if level.type == "practice":
			result.append(level)
	result.sort_custom(func(a, b): return a.difficulty < b.difficulty)
	return result

func calculate_price(package_data, checkin_date_str: String, stay_days: int, guest_count: int, active_rules: Array) -> Dictionary:
	var result = {
		"base_price": 0.0,
		"final_price": 0.0,
		"applied_rules": [],
		"breakdown": []
	}
	
	if not package_data or stay_days <= 0:
		return result
	
	var dates = generate_dates_for_month(checkin_date_str.substr(0, 4).to_int(), checkin_date_str.substr(5, 2).to_int())
	var checkin_date = null
	for d in dates:
		if d.date == checkin_date_str:
			checkin_date = d
			break
	
	if not checkin_date:
		return result
	
	result["base_price"] = package_data.base_price * stay_days
	result["final_price"] = result["base_price"]
	
	var sorted_rules = active_rules.duplicate()
	sorted_rules.sort_custom(func(a, b): return a.priority < b.priority)
	
	var current_price = result["base_price"]
	for rule in sorted_rules:
		if rule.check_condition(checkin_date, package_data, stay_days, guest_count):
			var new_price = rule.apply_effect(current_price)
			if new_price != current_price:
				result["applied_rules"].append(rule)
				result["breakdown"].append({
					"rule_name": rule.name,
					"effect": rule.effect,
					"value": rule.effect_value,
					"price_before": current_price,
					"price_after": new_price
				})
				current_price = new_price
	
	result["final_price"] = round(current_price * 100) / 100
	result["breakdown"].append({
		"rule_name": "基础价格",
		"effect": -1,
		"value": result["base_price"],
		"price_before": 0,
		"price_after": result["base_price"]
	})
	
	return result
