extends Control

@onready var back_button: Button = $TopBar/HBoxContainer/BackButton
@onready var tab_container: TabContainer = $MainContainer/TabContainer

@onready var level_list: VBoxContainer = $MainContainer/TabContainer/LevelTab/LevelScroll/LevelList
@onready var add_level_button: Button = $MainContainer/TabContainer/LevelTab/AddLevelButton

@onready var material_list: VBoxContainer = $MainContainer/TabContainer/MaterialTab/MaterialScroll/MaterialList
@onready var add_material_button: Button = $MainContainer/TabContainer/MaterialTab/AddMaterialButton

@onready var reward_list: VBoxContainer = $MainContainer/TabContainer/RewardTab/RewardScroll/RewardList
@onready var add_reward_button: Button = $MainContainer/TabContainer/RewardTab/AddRewardButton

@onready var open_time_start: SpinBox = $MainContainer/TabContainer/TimeTab/VBox/OpenTimeRow/StartTime
@onready var open_time_end: SpinBox = $MainContainer/TabContainer/TimeTab/VBox/OpenTimeRow/EndTime
@onready var work_days_grid: GridContainer = $MainContainer/TabContainer/TimeTab/VBox/WorkDaysGrid
@onready var save_time_button: Button = $MainContainer/TabContainer/TimeTab/VBox/SaveButton

@onready var mode_list: VBoxContainer = $MainContainer/TabContainer/ModeTab/ModeList

var config_data: Dictionary = {}
var day_names: Array = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]

const CONFIG_FILE := "user://game_config.json"

func _ready() -> void:
	_load_config()
	_setup_connections()
	_refresh_all()

func _setup_connections() -> void:
	back_button.pressed.connect(_on_back_pressed)
	add_level_button.pressed.connect(_on_add_level)
	add_material_button.pressed.connect(_on_add_material)
	add_reward_button.pressed.connect(_on_add_reward)
	save_time_button.pressed.connect(_on_save_time)

func _load_config() -> void:
	if not FileAccess.file_exists(CONFIG_FILE):
		_init_default_config()
		return
	
	var file := FileAccess.open(CONFIG_FILE, FileAccess.READ)
	if file:
		var content: String = file.get_as_text()
		file.close()
		var parsed = JSON.parse_string(content)
		if typeof(parsed) == TYPE_DICTIONARY:
			config_data = parsed
		else:
			_init_default_config()
	else:
		_init_default_config()

func _init_default_config() -> void:
	config_data = {
		"levels": [
			{"id": 1, "name": "新手入门", "description": "学习基础排班概念", "difficulty": 1, "time_limit": 300, "order_count": 5, "required_score": 60},
			{"id": 2, "name": "冲突检测", "description": "识别时段冲突", "difficulty": 2, "time_limit": 360, "order_count": 8, "required_score": 70},
			{"id": 3, "name": "容量规划", "description": "合理分配订单", "difficulty": 3, "time_limit": 420, "order_count": 12, "required_score": 75},
			{"id": 4, "name": "改约处理", "description": "处理改约请求", "difficulty": 4, "time_limit": 480, "order_count": 15, "required_score": 80},
			{"id": 5, "name": "综合挑战", "description": "综合运用技能", "difficulty": 5, "time_limit": 600, "order_count": 20, "required_score": 85},
		],
		"materials": [
			{"id": 1, "name": "排班规则手册", "type": "文档", "description": "详细的排班规则说明"},
			{"id": 2, "name": "保洁员技能表", "type": "表格", "description": "各保洁员技能和容量"},
			{"id": 3, "name": "冲突处理指南", "type": "文档", "description": "常见冲突类型及处理方法"},
		],
		"rewards": [
			{"id": 1, "name": "青铜徽章", "condition": "完成第1关", "type": "badge"},
			{"id": 2, "name": "白银徽章", "condition": "完成第3关", "type": "badge"},
			{"id": 3, "name": "黄金徽章", "condition": "完成第5关", "type": "badge"},
			{"id": 4, "name": "排排班达人", "condition": "综合得分90+", "type": "title"},
		],
		"open_time": {
			"start_hour": 8,
			"end_hour": 18,
			"work_days": [1, 2, 3, 4, 5, 6],
		},
		"training_modes": [
			{"id": 1, "name": "标准模式", "description": "有时间限制，正常计分", "has_time_limit": true, "unlocked": true},
			{"id": 2, "name": "训练模式", "description": "无时间限制，可反复练习", "has_time_limit": false, "unlocked": true},
			{"id": 3, "name": "挑战模式", "description": "时间减半，分数加倍", "has_time_limit": true, "unlocked": false},
		],
	}
	_save_config()

func _save_config() -> void:
	var file := FileAccess.open(CONFIG_FILE, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(config_data))
		file.close()

func _refresh_all() -> void:
	_refresh_level_list()
	_refresh_material_list()
	_refresh_reward_list()
	_refresh_time_settings()
	_refresh_mode_list()

func _refresh_level_list() -> void:
	for child in level_list.get_children():
		child.queue_free()
	
	var levels: Array = config_data.get("levels", [])
	
	for level in levels:
		var panel: Panel = Panel.new()
		panel.custom_minimum_size = Vector2(0, 60)
		
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.offset_left = 10
		hbox.offset_top = 5
		hbox.offset_right = -10
		hbox.offset_bottom = -5
		hbox.anchor_right = 1.0
		hbox.anchor_bottom = 1.0
		hbox.add_theme_constant_override("separation", 10)
		
		var info_vbox: VBoxContainer = VBoxContainer.new()
		info_vbox.size_flags_horizontal = SIZE_EXPAND_FILL
		
		var name_label: Label = Label.new()
		var stars: String = "★" * level.get("difficulty", 1)
		name_label.text = "第%d关: %s [%s]" % [level.get("id", 0), level.get("name", ""), stars]
		name_label.add_theme_font_size_override("font_size", 14)
		name_label.add_theme_color_override("font_color", Color(0.2, 0.3, 0.5))
		info_vbox.add_child(name_label)
		
		var desc_label: Label = Label.new()
		var minutes: int = level.get("time_limit", 300) / 60
		desc_label.text = "%s | %d单 | %d分钟 | 及格%d分" % [
			level.get("description", ""),
			level.get("order_count", 5),
			minutes,
			level.get("required_score", 60)
		]
		desc_label.add_theme_font_size_override("font_size", 11)
		desc_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		info_vbox.add_child(desc_label)
		
		hbox.add_child(info_vbox)
		
		var edit_btn: Button = Button.new()
		edit_btn.text = "编辑"
		edit_btn.custom_minimum_size = Vector2(60, 30)
		edit_btn.add_theme_font_size_override("font_size", 11)
		edit_btn.pressed.connect(_on_edit_level.bind(level.get("id", 0)))
		hbox.add_child(edit_btn)
		
		var delete_btn: Button = Button.new()
		delete_btn.text = "删除"
		delete_btn.custom_minimum_size = Vector2(60, 30)
		delete_btn.add_theme_font_size_override("font_size", 11)
		delete_btn.pressed.connect(_on_delete_level.bind(level.get("id", 0)))
		hbox.add_child(delete_btn)
		
		panel.add_child(hbox)
		level_list.add_child(panel)

func _refresh_material_list() -> void:
	for child in material_list.get_children():
		child.queue_free()
	
	var materials: Array = config_data.get("materials", [])
	
	for material in materials:
		var panel: Panel = Panel.new()
		panel.custom_minimum_size = Vector2(0, 55)
		
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.offset_left = 10
		hbox.offset_top = 5
		hbox.offset_right = -10
		hbox.offset_bottom = -5
		hbox.anchor_right = 1.0
		hbox.anchor_bottom = 1.0
		hbox.add_theme_constant_override("separation", 10)
		
		var info_vbox: VBoxContainer = VBoxContainer.new()
		info_vbox.size_flags_horizontal = SIZE_EXPAND_FILL
		
		var name_label: Label = Label.new()
		name_label.text = "[%s] %s" % [material.get("type", ""), material.get("name", "")]
		name_label.add_theme_font_size_override("font_size", 13)
		name_label.add_theme_color_override("font_color", Color(0.2, 0.3, 0.5))
		info_vbox.add_child(name_label)
		
		var desc_label: Label = Label.new()
		desc_label.text = material.get("description", "")
		desc_label.add_theme_font_size_override("font_size", 11)
		desc_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		info_vbox.add_child(desc_label)
		
		hbox.add_child(info_vbox)
		
		var delete_btn: Button = Button.new()
		delete_btn.text = "删除"
		delete_btn.custom_minimum_size = Vector2(60, 30)
		delete_btn.add_theme_font_size_override("font_size", 11)
		delete_btn.pressed.connect(_on_delete_material.bind(material.get("id", 0)))
		hbox.add_child(delete_btn)
		
		panel.add_child(hbox)
		material_list.add_child(panel)

func _refresh_reward_list() -> void:
	for child in reward_list.get_children():
		child.queue_free()
	
	var rewards: Array = config_data.get("rewards", [])
	
	for reward in rewards:
		var panel: Panel = Panel.new()
		panel.custom_minimum_size = Vector2(0, 50)
		
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.offset_left = 10
		hbox.offset_top = 5
		hbox.offset_right = -10
		hbox.offset_bottom = -5
		hbox.anchor_right = 1.0
		hbox.anchor_bottom = 1.0
		hbox.add_theme_constant_override("separation", 10)
		
		var type_icon: Label = Label.new()
		type_icon.text = "🏆" if reward.get("type") == "badge" else "👑"
		type_icon.add_theme_font_size_override("font_size", 20)
		hbox.add_child(type_icon)
		
		var info_vbox: VBoxContainer = VBoxContainer.new()
		info_vbox.size_flags_horizontal = SIZE_EXPAND_FILL
		
		var name_label: Label = Label.new()
		name_label.text = reward.get("name", "")
		name_label.add_theme_font_size_override("font_size", 13)
		name_label.add_theme_color_override("font_color", Color(0.2, 0.3, 0.5))
		info_vbox.add_child(name_label)
		
		var cond_label: Label = Label.new()
		cond_label.text = "获取条件: %s" % reward.get("condition", "")
		cond_label.add_theme_font_size_override("font_size", 11)
		cond_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		info_vbox.add_child(cond_label)
		
		hbox.add_child(info_vbox)
		
		var delete_btn: Button = Button.new()
		delete_btn.text = "删除"
		delete_btn.custom_minimum_size = Vector2(60, 30)
		delete_btn.add_theme_font_size_override("font_size", 11)
		delete_btn.pressed.connect(_on_delete_reward.bind(reward.get("id", 0)))
		hbox.add_child(delete_btn)
		
		panel.add_child(hbox)
		reward_list.add_child(panel)

func _refresh_time_settings() -> void:
	var open_time: Dictionary = config_data.get("open_time", {})
	open_time_start.value = open_time.get("start_hour", 8)
	open_time_end.value = open_time.get("end_hour", 18)
	
	for child in work_days_grid.get_children():
		child.queue_free()
	
	var work_days: Array = open_time.get("work_days", [1, 2, 3, 4, 5, 6])
	
	for i in range(7):
		var check: CheckBox = CheckBox.new()
		check.text = day_names[i]
		check.button_pressed = work_days.has(i)
		check.name = "day_%d" % i
		check.add_theme_font_size_override("font_size", 12)
		work_days_grid.add_child(check)

func _refresh_mode_list() -> void:
	for child in mode_list.get_children():
		child.queue_free()
	
	var modes: Array = config_data.get("training_modes", [])
	
	for mode in modes:
		var panel: Panel = Panel.new()
		panel.custom_minimum_size = Vector2(0, 65)
		
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.offset_left = 12
		hbox.offset_top = 8
		hbox.offset_right = -12
		hbox.offset_bottom = -8
		hbox.anchor_right = 1.0
		hbox.anchor_bottom = 1.0
		hbox.add_theme_constant_override("separation", 15)
		
		var info_vbox: VBoxContainer = VBoxContainer.new()
		info_vbox.size_flags_horizontal = SIZE_EXPAND_FILL
		
		var name_label: Label = Label.new()
		var unlocked = mode.get("unlocked", false)
		name_label.text = "%s%s" % [mode.get("name", ""), " 🔒" if not unlocked else ""]
		name_label.add_theme_font_size_override("font_size", 15)
		name_label.add_theme_color_override("font_color", Color(0.2, 0.3, 0.5) if unlocked else Color(0.6, 0.6, 0.6))
		info_vbox.add_child(name_label)
		
		var desc_label: Label = Label.new()
		desc_label.text = mode.get("description", "")
		desc_label.add_theme_font_size_override("font_size", 11)
		desc_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		info_vbox.add_child(desc_label)
		
		hbox.add_child(info_vbox)
		
		var toggle_btn: Button = Button.new()
		toggle_btn.text = "锁定" if unlocked else "解锁"
		toggle_btn.custom_minimum_size = Vector2(70, 35)
		toggle_btn.add_theme_font_size_override("font_size", 12)
		toggle_btn.pressed.connect(_on_toggle_mode.bind(mode.get("id", 0)))
		hbox.add_child(toggle_btn)
		
		panel.add_child(hbox)
		mode_list.add_child(panel)

func _on_back_pressed() -> void:
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _on_add_level() -> void:
	var levels: Array = config_data.get("levels", [])
	var new_id: int = 1
	if levels.size() > 0:
		new_id = levels[-1].get("id", 0) + 1
	
	var new_level: Dictionary = {
		"id": new_id,
		"name": "新关卡%d" % new_id,
		"description": "新添加的关卡",
		"difficulty": 2,
		"time_limit": 300,
		"order_count": 6,
		"required_score": 65,
	}
	levels.append(new_level)
	config_data["levels"] = levels
	_save_config()
	_refresh_level_list()

func _on_edit_level(level_id: int) -> void:
	pass

func _on_delete_level(level_id: int) -> void:
	var levels: Array = config_data.get("levels", [])
	for i in range(levels.size()):
		if levels[i].get("id") == level_id:
			levels.remove_at(i)
			break
	config_data["levels"] = levels
	_save_config()
	_refresh_level_list()

func _on_add_material() -> void:
	var materials: Array = config_data.get("materials", [])
	var new_id: int = 1
	if materials.size() > 0:
		new_id = materials[-1].get("id", 0) + 1
	
	var new_material: Dictionary = {
		"id": new_id,
		"name": "新素材%d" % new_id,
		"type": "文档",
		"description": "新添加的学习素材",
	}
	materials.append(new_material)
	config_data["materials"] = materials
	_save_config()
	_refresh_material_list()

func _on_delete_material(material_id: int) -> void:
	var materials: Array = config_data.get("materials", [])
	for i in range(materials.size()):
		if materials[i].get("id") == material_id:
			materials.remove_at(i)
			break
	config_data["materials"] = materials
	_save_config()
	_refresh_material_list()

func _on_add_reward() -> void:
	var rewards: Array = config_data.get("rewards", [])
	var new_id: int = 1
	if rewards.size() > 0:
		new_id = rewards[-1].get("id", 0) + 1
	
	var new_reward: Dictionary = {
		"id": new_id,
		"name": "新奖励%d" % new_id,
		"condition": "完成指定关卡",
		"type": "badge",
	}
	rewards.append(new_reward)
	config_data["rewards"] = rewards
	_save_config()
	_refresh_reward_list()

func _on_delete_reward(reward_id: int) -> void:
	var rewards: Array = config_data.get("rewards", [])
	for i in range(rewards.size()):
		if rewards[i].get("id") == reward_id:
			rewards.remove_at(i)
			break
	config_data["rewards"] = rewards
	_save_config()
	_refresh_reward_list()

func _on_save_time() -> void:
	var open_time: Dictionary = config_data.get("open_time", {})
	open_time["start_hour"] = int(open_time_start.value)
	open_time["end_hour"] = int(open_time_end.value)
	
	var work_days: Array = []
	for i in range(7):
		var check = work_days_grid.get_node_or_null("day_%d" % i)
		if check and check.button_pressed:
			work_days.append(i)
	open_time["work_days"] = work_days
	
	config_data["open_time"] = open_time
	_save_config()
	
	var toast: Label = Label.new()
	toast.text = "保存成功！"
	toast.add_theme_font_size_override("font_size", 16)
	toast.add_theme_color_override("font_color", Color(0.3, 0.7, 0.3))
	toast.horizontal_alignment = 1
	toast.modulate.a = 0.0
	toast.position = Vector2(0, -50)
	toast.anchor_left = 0.5
	toast.anchor_top = 0.5
	toast.offset_left = -100
	toast.offset_right = 100
	toast.custom_minimum_size = Vector2(0, 40)
	add_child(toast)

func _on_toggle_mode(mode_id: int) -> void:
	var modes: Array = config_data.get("training_modes", [])
	for mode in modes:
		if mode.get("id") == mode_id:
			mode["unlocked"] = not mode.get("unlocked", false)
			break
	config_data["training_modes"] = modes
	_save_config()
	_refresh_mode_list()
