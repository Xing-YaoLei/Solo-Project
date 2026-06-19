extends Control

@onready var result_icon: Label = $Panel/MarginContainer/VBoxContainer/ResultIcon
@onready var result_label: Label = $Panel/MarginContainer/VBoxContainer/ResultLabel
@onready var price_diff_label: Label = $Panel/MarginContainer/VBoxContainer/PriceDiffLabel
@onready var rules_container: VBoxContainer = $Panel/MarginContainer/VBoxContainer/RulesContainer
@onready var rules_label: Label = $Panel/MarginContainer/VBoxContainer/RulesContainer/RulesLabel

var tween: Tween

var auto_close_timer: float = 2.5
var is_correct: bool = false
var expected_price: float = 0.0
var calculated_price: float = 0.0
var applied_rules: Array = []

func _ready():
	modulate.a = 0.0
	scale = Vector2(0.8, 0.8)

func show_feedback(correct: bool, expected: float, calculated: float, rules: Array = []):
	is_correct = correct
	expected_price = expected
	calculated_price = calculated
	applied_rules = rules
	
	_update_display()
	_play_show_animation()

func _update_display():
	if is_correct:
		result_icon.text = "✓"
		result_icon.modulate = Color(0.18, 0.8, 0.44, 1)
		result_label.text = "回答正确！"
		result_label.modulate = Color(0.18, 0.8, 0.44, 1)
		price_diff_label.visible = false
	else:
		result_icon.text = "✗"
		result_icon.modulate = Color(0.91, 0.3, 0.24, 1)
		result_label.text = "回答错误"
		result_label.modulate = Color(0.91, 0.3, 0.24, 1)
		price_diff_label.visible = true
		
		var diff = calculated_price - expected_price
		var diff_text = ""
		if abs(diff) < 0.01:
			diff_text = "价格接近"
		elif diff > 0:
			diff_text = "高出 ¥%.2f" % diff
		else:
			diff_text = "低了 ¥%.2f" % abs(diff)
		
		price_diff_label.text = "正确价格：¥%.2f\n你的价格：¥%.2f\n%s" % [expected_price, calculated_price, diff_text]
	
	_update_rules_display()

func _update_rules_display():
	if applied_rules.is_empty():
		rules_container.visible = false
		return
	
	rules_container.visible = true
	
	var rules_text = "应用的规则：\n"
	for rule in applied_rules:
		var rule_name = rule.get("name", "未知规则") if rule is Dictionary else str(rule)
		if has_method("_get_rule_effect_text") and rule is Dictionary:
			var effect_text = _get_rule_effect_text(rule)
			rules_text += "• %s %s\n" % [rule_name, effect_text]
		else:
			rules_text += "• %s\n" % rule_name
	
	rules_label.text = rules_text

func _get_rule_effect_text(rule: Dictionary) -> String:
	var effect = rule.get("effect", 0)
	var value = rule.get("effect_value", 0)
	
	match effect:
		1:
			return "(优惠 ¥%.0f)" % value
		2:
			return "(优惠 %.0f%%)" % value
		3:
			return "(加价 ¥%.0f)" % value
		4:
			return "(加价 %.0f%%)" % value
		_:
			return ""

func _play_show_animation():
	if tween:
		tween.kill()
	
	tween = create_tween()
	tween.set_ease(Tween.EASE_OUT)
	tween.set_trans(Tween.TRANS_BACK)
	
	tween.tween_property(self, "modulate:a", 1.0, 0.3)
	tween.parallel().tween_property(self, "scale", Vector2(1.0, 1.0), 0.3)
	
	tween.tween_interval(auto_close_timer)
	
	tween.tween_callback(_play_hide_animation)

func _play_hide_animation():
	if tween:
		tween.kill()
	
	tween = create_tween()
	tween.set_ease(Tween.EASE_IN)
	tween.set_trans(Tween.TRANS_QUAD)
	
	tween.tween_property(self, "modulate:a", 0.0, 0.3)
	tween.parallel().tween_property(self, "scale", Vector2(0.8, 0.8), 0.3)
	
	tween.tween_callback(queue_free)

func close():
	if tween:
		tween.kill()
	_play_hide_animation()
