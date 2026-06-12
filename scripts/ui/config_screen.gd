extends Control

@onready var back_btn: Button = $Background/TopBar/BackBtn
@onready var tab_container: TabContainer = $Background/TabContainer

@onready var levels_tree: Tree = $Background/TabContainer/LevelsTab/VBoxContainer/LevelsTree
@onready var add_level_btn: Button = $Background/TabContainer/LevelsTab/VBoxContainer/ButtonRow/AddLevelBtn
@onready var save_level_btn: Button = $Background/TabContainer/LevelsTab/VBoxContainer/ButtonRow/SaveLevelBtn
@onready var delete_level_btn: Button = $Background/TabContainer/LevelsTab/VBoxContainer/ButtonRow/DeleteLevelBtn

@onready var level_id_input: LineEdit = $Background/TabContainer/LevelsTab/VBoxContainer/FormGrid/LevelIdInput
@onready var level_name_input: LineEdit = $Background/TabContainer/LevelsTab/VBoxContainer/FormGrid/LevelNameInput
@onready var level_desc_input: LineEdit = $Background/TabContainer/LevelsTab/VBoxContainer/FormGrid/LevelDescInput
@onready var level_difficulty_spin: SpinBox = $Background/TabContainer/LevelsTab/VBoxContainer/FormGrid/LevelDifficultySpin
@onready var level_time_spin: SpinBox = $Background/TabContainer/LevelsTab/VBoxContainer/FormGrid/LevelTimeSpin
@onready var level_pass_spin: SpinBox = $Background/TabContainer/LevelsTab/VBoxContainer/FormGrid/LevelPassSpin
@onready var level_enabled_check: CheckBox = $Background/TabContainer/LevelsTab/VBoxContainer/FormGrid/LevelEnabledCheck
@onready var level_qtype_check1: CheckBox = $Background/TabContainer/LevelsTab/VBoxContainer/FormGrid/QTypesBox/LevelQTypeCheck1
@onready var level_qtype_check2: CheckBox = $Background/TabContainer/LevelsTab/VBoxContainer/FormGrid/QTypesBox/LevelQTypeCheck2
@onready var level_qtype_check3: CheckBox = $Background/TabContainer/LevelsTab/VBoxContainer/FormGrid/QTypesBox/LevelQTypeCheck3
@onready var level_qtype_check4: CheckBox = $Background/TabContainer/LevelsTab/VBoxContainer/FormGrid/QTypesBox/LevelQTypeCheck4

@onready var questions_tree: Tree = $Background/TabContainer/QuestionsTab/VBoxContainer/QuestionsTree
@onready var question_type_option: OptionButton = $Background/TabContainer/QuestionsTab/VBoxContainer/ButtonRow/QuestionTypeOption
@onready var add_question_btn: Button = $Background/TabContainer/QuestionsTab/VBoxContainer/ButtonRow/AddQuestionBtn
@onready var delete_question_btn: Button = $Background/TabContainer/QuestionsTab/VBoxContainer/ButtonRow/DeleteQuestionBtn

@onready var stores_tree: Tree = $Background/TabContainer/StoresTab/VBoxContainer/StoresTree
@onready var add_store_btn: Button = $Background/TabContainer/StoresTab/VBoxContainer/ButtonRow/AddStoreBtn
@onready var save_store_btn: Button = $Background/TabContainer/StoresTab/VBoxContainer/ButtonRow/SaveStoreBtn
@onready var delete_store_btn: Button = $Background/TabContainer/StoresTab/VBoxContainer/ButtonRow/DeleteStoreBtn

@onready var store_id_input: LineEdit = $Background/TabContainer/StoresTab/VBoxContainer/FormGrid/StoreIdInput
@onready var store_name_input: LineEdit = $Background/TabContainer/StoresTab/VBoxContainer/FormGrid/StoreNameInput
@onready var store_manager_input: LineEdit = $Background/TabContainer/StoresTab/VBoxContainer/FormGrid/StoreManagerInput
@onready var store_location_input: LineEdit = $Background/TabContainer/StoresTab/VBoxContainer/FormGrid/StoreLocationInput
@onready var store_loss_rate_spin: DoubleSpinBox = $Background/TabContainer/StoresTab/VBoxContainer/FormGrid/StoreLossRateSpin

@onready var config_mode_option: OptionButton = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigModeOption
@onready var config_open_start: LineEdit = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigOpenStart
@onready var config_open_end: LineEdit = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigOpenEnd
@onready var config_sound_check: CheckBox = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigSoundCheck
@onready var config_music_slider: HSlider = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigMusicSlider
@onready var config_sfx_slider: HSlider = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigSfxSlider
@onready var save_config_btn: Button = $Background/TabContainer/SystemTab/VBoxContainer/SaveConfigBtn

var selected_level_id: String = ""
var selected_store_id: String = ""

func _ready() -> void:
	setup_connections()
	setup_option_buttons()
	load_all_data()

func setup_connections() -> void:
	back_btn.pressed.connect(_on_back_pressed)
	
	levels_tree.item_selected.connect(_on_level_selected)
	add_level_btn.pressed.connect(_on_add_level)
	save_level_btn.pressed.connect(_on_save_level)
	delete_level_btn.pressed.connect(_on_delete_level)
	
	questions_tree.item_selected.connect(_on_question_selected)
	add_question_btn.pressed.connect(_on_add_question)
	delete_question_btn.pressed.connect(_on_delete_question)
	question_type_option.item_selected.connect(_on_question_type_changed)
	
	stores_tree.item_selected.connect(_on_store_selected)
	add_store_btn.pressed.connect(_on_add_store)
	save_store_btn.pressed.connect(_on_save_store)
	delete_store_btn.pressed.connect(_on_delete_store)
	
	save_config_btn.pressed.connect(_on_save_config)
	config_music_slider.value_changed.connect(_on_music_volume_changed)
	config_sfx_slider.value_changed.connect(_on_sfx_volume_changed)
	config_sound_check.toggled.connect(_on_sound_toggled)

func setup_option_buttons() -> void:
	question_type_option.clear()
	question_type_option.add_item("复核意见识别", 0)
	question_type_option.add_item("责任门店选择", 1)
	question_type_option.add_item("成本金额排序", 2)
	question_type_option.add_item("审批记录处理", 3)
	
	config_mode_option.clear()
	config_mode_option.add_item("引导模式", 0)
	config_mode_option.add_item("自由模式", 1)

func load_all_data() -> void:
	load_levels()
	load_questions("review_opinion")
	load_stores()
	load_config()

func load_levels() -> void:
	levels_tree.clear()
	levels_tree.set_column_title(0, "关卡ID")
	levels_tree.set_column_title(1, "名称")
	levels_tree.set_column_title(2, "难度")
	levels_tree.set_column_title(3, "状态")
	
	var levels: Array = DataManager.get_levels()
	for level in levels:
		var item: TreeItem = levels_tree.create_item()
		item.set_text(0, level["id"])
		item.set_text(1, level["name"])
		item.set_text(2, "★" * int(level["difficulty"]))
		item.set_text(3, "启用" if level.get("enabled", true) else "禁用")
		item.set_meta("level_id", level["id"])

func load_questions(qtype: String) -> void:
	questions_tree.clear()
	questions_tree.set_column_title(0, "题目ID")
	questions_tree.set_column_title(1, "描述")
	questions_tree.set_column_title(2, "分值")
	
	var questions: Array = DataManager.get_questions_by_type(qtype)
	for q in questions:
		var item: TreeItem = questions_tree.create_item()
		item.set_text(0, q["id"])
		item.set_text(1, q["description"])
		item.set_text(2, str(q.get("score", 0)))
		item.set_meta("question_id", q["id"])

func load_stores() -> void:
	stores_tree.clear()
	stores_tree.set_column_title(0, "门店ID")
	stores_tree.set_column_title(1, "名称")
	stores_tree.set_column_title(2, "经理")
	stores_tree.set_column_title(3, "目标损耗率")
	
	var stores: Array = DataManager.get_stores()
	for store in stores:
		var item: TreeItem = stores_tree.create_item()
		item.set_text(0, store["id"])
		item.set_text(1, store["name"])
		item.set_text(2, store.get("manager", "-"))
		item.set_text(3, "%.1f%%" % store.get("loss_rate_target", 0.0))
		item.set_meta("store_id", store["id"])

func load_config() -> void:
	var config: Dictionary = DataManager.get_config()
	
	var mode: String = config.get("training_mode", "guided")
	config_mode_option.select(0 if mode == "guided" else 1)
	
	config_open_start.text = config.get("open_time_start", "09:00")
	config_open_end.text = config.get("open_time_end", "18:00")
	
	config_sound_check.button_pressed = config.get("sound_enabled", true)
	config_music_slider.value = config.get("music_volume", 0.7) * 100
	config_sfx_slider.value = config.get("sfx_volume", 0.8) * 100

func _on_back_pressed() -> void:
	AudioManager.play_click()
	GameManager.change_scene("Main")

func _on_level_selected() -> void:
	AudioManager.play_click()
	var selected: TreeItem = levels_tree.get_selected()
	if not selected:
		return
	
	selected_level_id = selected.get_meta("level_id", "")
	var level: Dictionary = DataManager.get_level(selected_level_id)
	if level.is_empty():
		return
	
	level_id_input.text = level.get("id", "")
	level_name_input.text = level.get("name", "")
	level_desc_input.text = level.get("description", "")
	level_difficulty_spin.value = level.get("difficulty", 1)
	level_time_spin.value = level.get("time_limit", 300)
	level_pass_spin.value = level.get("pass_score", 60)
	level_enabled_check.button_pressed = level.get("enabled", true)
	
	var qtypes: Array = level.get("question_types", [])
	level_qtype_check1.button_pressed = "review_opinion" in qtypes
	level_qtype_check2.button_pressed = "store_selection" in qtypes
	level_qtype_check3.button_pressed = "amount_sorting" in qtypes
	level_qtype_check4.button_pressed = "approval_record" in qtypes

func _on_add_level() -> void:
	AudioManager.play_click()
	var new_id: String = "level_%d" % (DataManager.get_levels().size() + 1)
	var new_level: Dictionary = {
		"id": new_id,
		"name": "新关卡",
		"description": "请输入描述",
		"difficulty": 1,
		"unlocked": false,
		"question_types": ["review_opinion"],
		"time_limit": 300,
		"pass_score": 60,
		"open_time": "09:00-18:00",
		"enabled": true
	}
	DataManager.update_level(new_id, new_level)
	load_levels()

func _on_save_level() -> void:
	if selected_level_id == "":
		return
	AudioManager.play_click()
	
	var qtypes: Array = []
	if level_qtype_check1.button_pressed: qtypes.append("review_opinion")
	if level_qtype_check2.button_pressed: qtypes.append("store_selection")
	if level_qtype_check3.button_pressed: qtypes.append("amount_sorting")
	if level_qtype_check4.button_pressed: qtypes.append("approval_record")
	
	var level: Dictionary = {
		"id": level_id_input.text,
		"name": level_name_input.text,
		"description": level_desc_input.text,
		"difficulty": int(level_difficulty_spin.value),
		"unlocked": true,
		"question_types": qtypes,
		"time_limit": int(level_time_spin.value),
		"pass_score": int(level_pass_spin.value),
		"open_time": "09:00-18:00",
		"enabled": level_enabled_check.button_pressed
	}
	
	DataManager.update_level(selected_level_id, level)
	load_levels()

func _on_delete_level() -> void:
	if selected_level_id == "":
		return
	AudioManager.play_click()
	var dialog: ConfirmationDialog = ConfirmationDialog.new()
	dialog.title = "确认删除"
	dialog.dialog_text = "确定要删除关卡「%s」吗？" % level_name_input.text
	dialog.get_ok_button().text = "删除"
	dialog.get_cancel_button().text = "取消"
	add_child(dialog)
	dialog.confirmed.connect(func():
		DataManager.delete_level(selected_level_id)
		selected_level_id = ""
		clear_level_form()
		load_levels()
	)
	dialog.popup_centered()

func _on_question_selected() -> void:
	AudioManager.play_click()

func _on_question_type_changed(index: int) -> void:
	AudioManager.play_click()
	var types: Array = ["review_opinion", "store_selection", "amount_sorting", "approval_record"]
	load_questions(types[index])

func _on_add_question() -> void:
	AudioManager.play_click()

func _on_delete_question() -> void:
	var selected: TreeItem = questions_tree.get_selected()
	if not selected:
		return
	AudioManager.play_click()
	var question_id: String = selected.get_meta("question_id", "")
	if question_id == "":
		return
	var dialog: ConfirmationDialog = ConfirmationDialog.new()
	dialog.title = "确认删除"
	dialog.dialog_text = "确定要删除题目「%s」吗？" % question_id
	dialog.get_ok_button().text = "删除"
	dialog.get_cancel_button().text = "取消"
	add_child(dialog)
	dialog.confirmed.connect(func():
		DataManager.delete_question(question_id)
		var types: Array = ["review_opinion", "store_selection", "amount_sorting", "approval_record"]
		load_questions(types[question_type_option.selected])
	)
	dialog.popup_centered()

func clear_level_form() -> void:
	level_id_input.text = ""
	level_name_input.text = ""
	level_desc_input.text = ""
	level_difficulty_spin.value = 1
	level_time_spin.value = 300
	level_pass_spin.value = 60
	level_enabled_check.button_pressed = true
	level_qtype_check1.button_pressed = false
	level_qtype_check2.button_pressed = false
	level_qtype_check3.button_pressed = false
	level_qtype_check4.button_pressed = false

func clear_store_form() -> void:
	store_id_input.text = ""
	store_name_input.text = ""
	store_manager_input.text = ""
	store_location_input.text = ""
	store_loss_rate_spin.value = 3.0

func _on_store_selected() -> void:
	AudioManager.play_click()
	var selected: TreeItem = stores_tree.get_selected()
	if not selected:
		return
	
	selected_store_id = selected.get_meta("store_id", "")
	var store: Dictionary = DataManager.get_store(selected_store_id)
	if store.is_empty():
		return
	
	store_id_input.text = store.get("id", "")
	store_name_input.text = store.get("name", "")
	store_manager_input.text = store.get("manager", "")
	store_location_input.text = store.get("location", "")
	store_loss_rate_spin.value = store.get("loss_rate_target", 3.0)

func _on_add_store() -> void:
	AudioManager.play_click()
	var new_id: String = "store_%03d" % (DataManager.get_stores().size() + 6)
	var new_store: Dictionary = {
		"id": new_id,
		"name": "新门店",
		"manager": "-",
		"location": "-",
		"loss_rate_target": 3.0
	}
	DataManager.update_store(new_id, new_store)
	load_stores()

func _on_save_store() -> void:
	if selected_store_id == "":
		return
	AudioManager.play_click()
	
	var store: Dictionary = {
		"id": store_id_input.text,
		"name": store_name_input.text,
		"manager": store_manager_input.text,
		"location": store_location_input.text,
		"loss_rate_target": float(store_loss_rate_spin.value)
	}
	
	DataManager.update_store(selected_store_id, store)
	load_stores()

func _on_delete_store() -> void:
	if selected_store_id == "":
		return
	AudioManager.play_click()
	var dialog: ConfirmationDialog = ConfirmationDialog.new()
	dialog.title = "确认删除"
	dialog.dialog_text = "确定要删除门店「%s」吗？" % store_name_input.text
	dialog.get_ok_button().text = "删除"
	dialog.get_cancel_button().text = "取消"
	add_child(dialog)
	dialog.confirmed.connect(func():
		DataManager.delete_store(selected_store_id)
		selected_store_id = ""
		clear_store_form()
		load_stores()
	)
	dialog.popup_centered()

func _on_save_config() -> void:
	AudioManager.play_click()
	
	var mode: String = "guided" if config_mode_option.selected == 0 else "free"
	
	var config: Dictionary = {
		"training_mode": mode,
		"open_time_start": config_open_start.text,
		"open_time_end": config_open_end.text
	}
	
	DataManager.update_config(config)

func _on_music_volume_changed(value: float) -> void:
	AudioManager.set_music_volume(value / 100.0)

func _on_sfx_volume_changed(value: float) -> void:
	AudioManager.set_sfx_volume(value / 100.0)

func _on_sound_toggled(enabled: bool) -> void:
	AudioManager.set_sound_enabled(enabled)
