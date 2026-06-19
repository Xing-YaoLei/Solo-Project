extends Panel

signal clicked(rule_data)

@onready var title_label: Label = $ContentContainer/TitleLabel
@onready var desc_label: Label = $ContentContainer/DescLabel
@onready var effect_label: Label = $ContentContainer/EffectLabel

var rule_data = null
var is_selected: bool = false

func _ready():
	gui_input.connect(_on_gui_input)

func setup(rule):
	rule_data = rule
	if rule_data:
		title_label.text = rule_data.name
		desc_label.text = rule_data.description
		_update_effect_label()
	_update_visual_state()

func _update_effect_label():
	if not rule_data:
		effect_label.text = ""
		return
	
	var effect_text = ""
	match rule_data.effect:
		GameData.RuleEffect.DISCOUNT_FIXED:
			effect_text = "立减 ¥%.0f" % rule_data.effect_value
		GameData.RuleEffect.DISCOUNT_PERCENT:
			effect_text = "%d%% 折扣" % int(100 - rule_data.effect_value)
		GameData.RuleEffect.SURCHARGE_FIXED:
			effect_text = "加收 ¥%.0f" % rule_data.effect_value
		GameData.RuleEffect.SURCHARGE_PERCENT:
			effect_text = "加价 %d%%" % int(rule_data.effect_value)
		GameData.RuleEffect.GIFT:
			effect_text = "赠送礼品"
		GameData.RuleEffect.UPGRADE:
			effect_text = "免费升级"
	effect_label.text = effect_text

func set_selected(selected: bool):
	is_selected = selected
	_update_visual_state()

func _update_visual_state():
	var bg_color = Color(0.15, 0.18, 0.22, 0.95)
	if is_selected:
		bg_color = Color(0.2, 0.6, 0.86, 0.3)
	modulate = bg_color

func _on_gui_input(event):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		clicked.emit(rule_data)
		accept_event()
