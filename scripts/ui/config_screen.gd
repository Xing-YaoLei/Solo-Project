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
@onready var store_loss_rate_spin: SpinBox = $Background/TabContainer/StoresTab/VBoxContainer/FormGrid/StoreLossRateSpin

@onready var config_mode_option: OptionButton = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigModeOption
@onready var config_open_start: LineEdit = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigOpenStart
@onready var config_open_end: LineEdit = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigOpenEnd
@onready var config_sound_check: CheckBox = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigSoundCheck
@onready var config_music_slider: HSlider = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigMusicSlider
@onready var config_sfx_slider: HSlider = $Background/TabContainer/SystemTab/VBoxContainer/ConfigGrid/ConfigSfxSlider
@onready var save_config_btn: Button = $Background/TabContainer/SystemTab/VBoxContainer/SaveConfigBtn

var selected_level_id: String = ""
var selected_store_id: String = ""
var selected_question_id: String = ""
var selected_reward_id: String = ""

var question_edit_panel: PanelContainer = null
var question_desc_input: TextEdit = null
var question_score_spin: SpinBox = null
var question_difficulty_spin: SpinBox = null
var options_container: VBoxContainer = null
var question_save_btn: Button = null

var rewards_tree: Tree = null
var reward_id_input: LineEdit = null
var reward_name_input: LineEdit = null
var reward_desc_input: LineEdit = null
var reward_icon_input: LineEdit = null
var reward_condition_input: LineEdit = null
var reward_add_btn: Button = null
var reward_save_btn: Button = null
var reward_delete_btn: Button = null

func _ready() -> void:
	setup_option_buttons()
	build_question_editor()
	build_rewards_tab()
	build_assets_tab()
	setup_connections()
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
	
	if rewards_tree and reward_add_btn and reward_save_btn and reward_delete_btn:
		rewards_tree.item_selected.connect(_on_reward_selected)
		reward_add_btn.pressed.connect(_on_add_reward)
		reward_save_btn.pressed.connect(_on_save_reward)
		reward_delete_btn.pressed.connect(_on_delete_reward)
	
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
	load_rewards()
	load_config()

func build_question_editor() -> void:
	var questions_vbox: VBoxContainer = questions_tree.get_parent()
	for child in questions_vbox.get_children():
		if child.name == "HintLabel":
			child.queue_free()
			break
	
	question_edit_panel = PanelContainer.new()
	question_edit_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	question_edit_panel.custom_minimum_size = Vector2(0, 280)
	questions_vbox.add_child(question_edit_panel)
	
	var margin: MarginContainer = MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 15)
	margin.add_theme_constant_override("margin_right", 15)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_bottom", 12)
	question_edit_panel.add_child(margin)
	
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.add_theme_constant_override("separation", 8)
	margin.add_child(vbox)
	
	var title: Label = Label.new()
	title.text = "✏️ 题目编辑"
	title.add_theme_font_size_override("font_size", 16)
	title.add_theme_color_override("font_color", Color(0.4, 0.2, 0.08, 1))
	vbox.add_child(title)
	
	var info_grid: GridContainer = GridContainer.new()
	info_grid.columns = 2
	info_grid.add_theme_constant_override("h_separation", 15)
	info_grid.add_theme_constant_override("v_separation", 6)
	vbox.add_child(info_grid)
	
	var diff_label: Label = Label.new()
	diff_label.text = "难度："
	diff_label.add_theme_font_size_override("font_size", 13)
	info_grid.add_child(diff_label)
	
	question_difficulty_spin = SpinBox.new()
	question_difficulty_spin.min_value = 1
	question_difficulty_spin.max_value = 5
	question_difficulty_spin.step = 1
	question_difficulty_spin.add_theme_font_size_override("font_size", 13)
	info_grid.add_child(question_difficulty_spin)
	
	var score_label: Label = Label.new()
	score_label.text = "分值："
	score_label.add_theme_font_size_override("font_size", 13)
	info_grid.add_child(score_label)
	
	question_score_spin = SpinBox.new()
	question_score_spin.min_value = 5
	question_score_spin.max_value = 100
	question_score_spin.step = 5
	question_score_spin.value = 10
	question_score_spin.add_theme_font_size_override("font_size", 13)
	info_grid.add_child(question_score_spin)
	
	var desc_label: Label = Label.new()
	desc_label.text = "题目描述："
	desc_label.add_theme_font_size_override("font_size", 13)
	vbox.add_child(desc_label)
	
	question_desc_input = TextEdit.new()
	question_desc_input.custom_minimum_size = Vector2(0, 60)
	question_desc_input.add_theme_font_size_override("font_size", 13)
	vbox.add_child(question_desc_input)
	
	var opts_label: Label = Label.new()
	opts_label.text = "选项（勾选正确选项）："
	opts_label.add_theme_font_size_override("font_size", 13)
	vbox.add_child(opts_label)
	
	options_container = VBoxContainer.new()
	options_container.add_theme_constant_override("separation", 5)
	options_container.custom_minimum_size = Vector2(0, 80)
	vbox.add_child(options_container)
	
	var btn_row: HBoxContainer = HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 10)
	vbox.add_child(btn_row)
	
	var add_opt_btn: Button = Button.new()
	add_opt_btn.text = "➕ 增加选项"
	add_opt_btn.add_theme_font_size_override("font_size", 13)
	add_opt_btn.custom_minimum_size = Vector2(120, 32)
	add_opt_btn.pressed.connect(_on_add_option_pressed)
	btn_row.add_child(add_opt_btn)
	
	var spacer: Control = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	btn_row.add_child(spacer)
	
	question_save_btn = Button.new()
	question_save_btn.text = "💾 保存题目"
	question_save_btn.add_theme_font_size_override("font_size", 14)
	question_save_btn.custom_minimum_size = Vector2(130, 36)
	question_save_btn.pressed.connect(_on_save_question)
	btn_row.add_child(question_save_btn)
	
	for i in range(4):
		_add_option_row()

func _add_option_row() -> void:
	if not options_container:
		return
	var row: HBoxContainer = HBoxContainer.new()
	row.add_theme_constant_override("separation", 8)
	options_container.add_child(row)
	
	var correct_check: CheckBox = CheckBox.new()
	correct_check.text = "正确"
	correct_check.add_theme_font_size_override("font_size", 12)
	correct_check.custom_minimum_size = Vector2(50, 0)
	row.add_child(correct_check)
	
	var opt_id: LineEdit = LineEdit.new()
	opt_id.placeholder_text = "选项ID"
	opt_id.add_theme_font_size_override("font_size", 12)
	opt_id.custom_minimum_size = Vector2(60, 0)
	opt_id.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	row.add_child(opt_id)
	
	var opt_text: LineEdit = LineEdit.new()
	opt_text.placeholder_text = "选项内容"
	opt_text.add_theme_font_size_override("font_size", 12)
	opt_text.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(opt_text)
	
	var del_btn: Button = Button.new()
	del_btn.text = "×"
	del_btn.add_theme_font_size_override("font_size", 12)
	del_btn.custom_minimum_size = Vector2(30, 28)
	del_btn.pressed.connect(func(): row.queue_free())
	row.add_child(del_btn)

func build_rewards_tab() -> void:
	var rewards_tab: ScrollContainer = ScrollContainer.new()
	rewards_tab.name = "RewardsTab"
	rewards_tab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rewards_tab.size_flags_vertical = Control.SIZE_EXPAND_FILL
	tab_container.add_child(rewards_tab)
	tab_container.set_tab_title(tab_container.get_tab_count() - 1, "🎁 奖励配置")
	
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 12)
	rewards_tab.add_child(vbox)
	
	var btn_row: HBoxContainer = HBoxContainer.new()
	btn_row.add_theme_constant_override("separation", 10)
	vbox.add_child(btn_row)
	
	reward_add_btn = Button.new()
	reward_add_btn.text = "➕ 新增奖励"
	reward_add_btn.add_theme_font_size_override("font_size", 14)
	reward_add_btn.custom_minimum_size = Vector2(120, 36)
	btn_row.add_child(reward_add_btn)
	
	reward_save_btn = Button.new()
	reward_save_btn.text = "💾 保存修改"
	reward_save_btn.add_theme_font_size_override("font_size", 14)
	reward_save_btn.custom_minimum_size = Vector2(120, 36)
	btn_row.add_child(reward_save_btn)
	
	reward_delete_btn = Button.new()
	reward_delete_btn.text = "🗑️ 删除奖励"
	reward_delete_btn.add_theme_font_size_override("font_size", 14)
	reward_delete_btn.custom_minimum_size = Vector2(120, 36)
	btn_row.add_child(reward_delete_btn)
	
	var spacer: Control = Control.new()
	spacer.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	btn_row.add_child(spacer)
	
	rewards_tree = Tree.new()
	rewards_tree.columns = 3
	rewards_tree.column_titles_visible = true
	rewards_tree.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	rewards_tree.size_flags_vertical = Control.SIZE_EXPAND_FILL
	rewards_tree.custom_minimum_size = Vector2(0, 200)
	vbox.add_child(rewards_tree)
	
	var form_panel: PanelContainer = PanelContainer.new()
	form_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_child(form_panel)
	
	var form_margin: MarginContainer = MarginContainer.new()
	form_margin.add_theme_constant_override("margin_left", 15)
	form_margin.add_theme_constant_override("margin_right", 15)
	form_margin.add_theme_constant_override("margin_top", 12)
	form_margin.add_theme_constant_override("margin_bottom", 12)
	form_panel.add_child(form_margin)
	
	var form_grid: GridContainer = GridContainer.new()
	form_grid.columns = 2
	form_grid.add_theme_constant_override("h_separation", 15)
	form_grid.add_theme_constant_override("v_separation", 8)
	form_margin.add_child(form_grid)
	
	var rlabels: Array = ["奖励ID：", "奖励名称：", "奖励描述：", "图标(emoji)：", "获得条件："]
	var rinputs: Array = [null, null, null, null, null]
	for i in range(rlabels.size()):
		var lb: Label = Label.new()
		lb.text = rlabels[i]
		lb.add_theme_font_size_override("font_size", 13)
		form_grid.add_child(lb)
		
		var input: LineEdit = LineEdit.new()
		input.add_theme_font_size_override("font_size", 13)
		form_grid.add_child(input)
		rinputs[i] = input
	
	reward_id_input = rinputs[0]
	reward_name_input = rinputs[1]
	reward_desc_input = rinputs[2]
	reward_icon_input = rinputs[3]
	reward_condition_input = rinputs[4]

func build_assets_tab() -> void:
	var assets_tab: ScrollContainer = ScrollContainer.new()
	assets_tab.name = "AssetsTab"
	assets_tab.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	assets_tab.size_flags_vertical = Control.SIZE_EXPAND_FILL
	tab_container.add_child(assets_tab)
	tab_container.set_tab_title(tab_container.get_tab_count() - 1, "🖼️ 素材管理")
	
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.size_flags_vertical = Control.SIZE_EXPAND_FILL
	vbox.add_theme_constant_override("separation", 15)
	assets_tab.add_child(vbox)
	
	var title: Label = Label.new()
	title.text = "📁 游戏素材管理"
	title.add_theme_font_size_override("font_size", 20)
	title.add_theme_color_override("font_color", Color(0.4, 0.2, 0.08, 1))
	vbox.add_child(title)
	
	var hint: Label = Label.new()
	hint.text = "素材文件存放目录：assets/sounds/ 和 assets/images/"
	hint.add_theme_font_size_override("font_size", 14)
	hint.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(hint)
	
	var sound_panel: PanelContainer = PanelContainer.new()
	sound_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_child(sound_panel)
	
	var sound_margin: MarginContainer = MarginContainer.new()
	sound_margin.add_theme_constant_override("margin_left", 15)
	sound_margin.add_theme_constant_override("margin_right", 15)
	sound_margin.add_theme_constant_override("margin_top", 12)
	sound_margin.add_theme_constant_override("margin_bottom", 12)
	sound_panel.add_child(sound_margin)
	
	var sound_vbox: VBoxContainer = VBoxContainer.new()
	sound_vbox.add_theme_constant_override("separation", 6)
	sound_margin.add_child(sound_vbox)
	
	var sound_title: Label = Label.new()
	sound_title.text = "🔊 音效素材"
	sound_title.add_theme_font_size_override("font_size", 16)
	sound_vbox.add_child(sound_title)
	
	var sound_files: Array = [
		["click.wav", "按钮点击音效", "约 0.2 秒"],
		["correct.wav", "回答正确音效", "约 0.5 秒"],
		["wrong.wav", "回答错误音效", "约 0.5 秒"],
		["complete.wav", "关卡完成音效", "约 1.0 秒"]
	]
	for sf in sound_files:
		var row: HBoxContainer = HBoxContainer.new()
		row.add_theme_constant_override("separation", 10)
		sound_vbox.add_child(row)
		
		var name_lb: Label = Label.new()
		name_lb.text = "📄 " + sf[0]
		name_lb.add_theme_font_size_override("font_size", 13)
		name_lb.custom_minimum_size = Vector2(150, 0)
		row.add_child(name_lb)
		
		var desc_lb: Label = Label.new()
		desc_lb.text = sf[1]
		desc_lb.add_theme_font_size_override("font_size", 13)
		desc_lb.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(desc_lb)
		
		var dur_lb: Label = Label.new()
		dur_lb.text = sf[2]
		dur_lb.add_theme_font_size_override("font_size", 13)
		dur_lb.custom_minimum_size = Vector2(100, 0)
		row.add_child(dur_lb)
	
	var tip: Label = Label.new()
	tip.text = "💡 将音效文件放入 assets/sounds/ 目录即可自动加载，支持 WAV、MP3、OGG 格式"
	tip.add_theme_font_size_override("font_size", 12)
	tip.add_theme_color_override("font_color", Color(0.5, 0.4, 0.3, 1))
	sound_vbox.add_child(tip)
	
	var img_panel: PanelContainer = PanelContainer.new()
	img_panel.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	vbox.add_child(img_panel)
	
	var img_margin: MarginContainer = MarginContainer.new()
	img_margin.add_theme_constant_override("margin_left", 15)
	img_margin.add_theme_constant_override("margin_right", 15)
	img_margin.add_theme_constant_override("margin_top", 12)
	img_margin.add_theme_constant_override("margin_bottom", 12)
	img_panel.add_child(img_margin)
	
	var img_vbox: VBoxContainer = VBoxContainer.new()
	img_vbox.add_theme_constant_override("separation", 6)
	img_margin.add_child(img_vbox)
	
	var img_title: Label = Label.new()
	img_title.text = "🖼️ 图片素材"
	img_title.add_theme_font_size_override("font_size", 16)
	img_vbox.add_child(img_title)
	
	var img_tip: Label = Label.new()
	img_tip.text = "图片素材存放在 assets/images/ 目录，支持 PNG、JPG、SVG 格式\n目前游戏使用纯代码UI + emoji图标，无需额外图片资源"
	img_tip.add_theme_font_size_override("font_size", 13)
	img_tip.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	img_vbox.add_child(img_tip)
	
	var refresh_btn: Button = Button.new()
	refresh_btn.text = "🔄 刷新素材列表"
	refresh_btn.add_theme_font_size_override("font_size", 14)
	refresh_btn.custom_minimum_size = Vector2(180, 40)
	refresh_btn.pressed.connect(_on_refresh_assets)
	vbox.add_child(refresh_btn)

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

func load_rewards() -> void:
	if not rewards_tree:
		return
	rewards_tree.clear()
	rewards_tree.set_column_title(0, "奖励ID")
	rewards_tree.set_column_title(1, "图标")
	rewards_tree.set_column_title(2, "名称")
	
	var rewards: Array = DataManager.get_rewards()
	for reward in rewards:
		var item: TreeItem = rewards_tree.create_item()
		item.set_text(0, reward["id"])
		item.set_text(1, reward.get("icon", "🎁"))
		item.set_text(2, reward["name"])
		item.set_meta("reward_id", reward["id"])

func _on_add_option_pressed() -> void:
	AudioManager.play_click()
	_add_option_row()

func clear_question_form() -> void:
	if question_desc_input:
		question_desc_input.text = ""
	if question_score_spin:
		question_score_spin.value = 10
	if question_difficulty_spin:
		question_difficulty_spin.value = 1
	if options_container:
		for child in options_container.get_children():
			child.queue_free()
		for i in range(4):
			_add_option_row()

func _get_current_question_type() -> String:
	var types: Array = ["review_opinion", "store_selection", "amount_sorting", "approval_record"]
	return types[question_type_option.selected]

func _on_question_selected() -> void:
	AudioManager.play_click()
	var selected: TreeItem = questions_tree.get_selected()
	if not selected:
		return
	selected_question_id = selected.get_meta("question_id", "")
	var qtype: String = _get_current_question_type()
	var question: Dictionary = DataManager.get_question(selected_question_id, qtype)
	if question.is_empty():
		return
	
	if question_desc_input:
		question_desc_input.text = question.get("description", "")
	if question_score_spin:
		question_score_spin.value = question.get("score", 10)
	if question_difficulty_spin:
		question_difficulty_spin.value = question.get("difficulty", 1)
	
	if options_container:
		for child in options_container.get_children():
			child.queue_free()
		
		var options: Array = question.get("options", [])
		var correct_opts: Array = question.get("correct_options", [])
		for opt in options:
			_add_option_row()
			var last_row: HBoxContainer = options_container.get_child(options_container.get_child_count() - 1)
			if last_row and last_row.get_child_count() >= 3:
				var check: CheckBox = last_row.get_child(0)
				var id_input: LineEdit = last_row.get_child(1)
				var text_input: LineEdit = last_row.get_child(2)
				if check:
					check.button_pressed = correct_opts.has(opt.get("id", ""))
				if id_input:
					id_input.text = opt.get("id", "")
				if text_input:
					text_input.text = opt.get("text", "")

func _on_add_question() -> void:
	AudioManager.play_click()
	clear_question_form()
	selected_question_id = ""

func _on_save_question() -> void:
	AudioManager.play_click()
	if not options_container or not question_desc_input:
		return
	
	var qtype: String = _get_current_question_type()
	var options: Array = []
	var correct_opts: Array = []
	
	for i in range(options_container.get_child_count()):
		var row: HBoxContainer = options_container.get_child(i)
		if row and row.get_child_count() >= 3:
			var check: CheckBox = row.get_child(0)
			var id_input: LineEdit = row.get_child(1)
			var text_input: LineEdit = row.get_child(2)
			var opt_id: String = id_input.text if id_input else ""
			var opt_text: String = text_input.text if text_input else ""
			if opt_text == "" and opt_id == "":
				continue
			options.append({"id": opt_id, "text": opt_text})
			if check and check.button_pressed:
				correct_opts.append(opt_id)
	
	if options.size() == 0:
		return
	
	var qid: String = selected_question_id
	if qid == "":
		var type_prefix: Dictionary = {
			"review_opinion": "ro",
			"store_selection": "ss",
			"amount_sorting": "as",
			"approval_record": "ar"
		}
		var prefix: String = type_prefix.get(qtype, "q")
		var existing: Array = DataManager.get_questions_by_type(qtype)
		qid = "%s_%03d" % [prefix, existing.size() + 10]
	
	var question: Dictionary = {
		"id": qid,
		"type": qtype,
		"description": question_desc_input.text,
		"score": int(question_score_spin.value) if question_score_spin else 10,
		"difficulty": int(question_difficulty_spin.value) if question_difficulty_spin else 1,
		"options": options,
		"correct_options": correct_opts,
		"abnormal_reason": ""
	}
	
	DataManager.update_question(qid, question, qtype)
	selected_question_id = qid
	load_questions(qtype)

func _on_reward_selected() -> void:
	AudioManager.play_click()
	var selected: TreeItem = rewards_tree.get_selected()
	if not selected:
		return
	selected_reward_id = selected.get_meta("reward_id", "")
	var reward: Dictionary = DataManager.get_reward(selected_reward_id)
	if reward.is_empty():
		return
	
	if reward_id_input:
		reward_id_input.text = reward.get("id", "")
	if reward_name_input:
		reward_name_input.text = reward.get("name", "")
	if reward_desc_input:
		reward_desc_input.text = reward.get("description", "")
	if reward_icon_input:
		reward_icon_input.text = reward.get("icon", "🎁")
	if reward_condition_input:
		reward_condition_input.text = str(reward.get("condition", ""))

func _on_add_reward() -> void:
	AudioManager.play_click()
	var rewards: Array = DataManager.get_rewards()
	var new_id: String = "reward_%02d" % (rewards.size() + 5)
	var new_reward: Dictionary = {
		"id": new_id,
		"name": "新奖励",
		"description": "奖励描述",
		"icon": "🎁",
		"condition": "完成训练"
	}
	DataManager.update_reward(new_id, new_reward)
	selected_reward_id = new_id
	load_rewards()

func _on_save_reward() -> void:
	if selected_reward_id == "":
		return
	AudioManager.play_click()
	
	var reward: Dictionary = {
		"id": reward_id_input.text if reward_id_input else "",
		"name": reward_name_input.text if reward_name_input else "",
		"description": reward_desc_input.text if reward_desc_input else "",
		"icon": reward_icon_input.text if reward_icon_input else "🎁",
		"condition": reward_condition_input.text if reward_condition_input else ""
	}
	
	DataManager.update_reward(selected_reward_id, reward)
	load_rewards()

func _on_delete_reward() -> void:
	if selected_reward_id == "":
		return
	AudioManager.play_click()
	var dialog: ConfirmationDialog = ConfirmationDialog.new()
	dialog.title = "确认删除"
	dialog.dialog_text = "确定要删除奖励「%s」吗？" % selected_reward_id
	dialog.get_ok_button().text = "删除"
	dialog.get_cancel_button().text = "取消"
	add_child(dialog)
	dialog.confirmed.connect(func():
		DataManager.delete_reward(selected_reward_id)
		selected_reward_id = ""
		load_rewards()
	)
	dialog.popup_centered()

func _on_refresh_assets() -> void:
	AudioManager.play_click()
	var dialog: AcceptDialog = AcceptDialog.new()
	dialog.title = "素材刷新"
	dialog.dialog_text = "素材列表已刷新\n\n音效目录：assets/sounds/\n图片目录：assets/images/"
	add_child(dialog)
	dialog.popup_centered()
