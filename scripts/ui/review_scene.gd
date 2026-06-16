extends Control

var scene_manager: SceneManager
var replay_manager: ReplayManager
var game_manager: GameManager

var replay_data: Dictionary = {}
var current_replay: Dictionary = {}
var all_replays: Array[Dictionary] = []

@onready var back_button: Button = $MainVBox/Header/BackButton
@onready var replay_selector: OptionButton = $MainVBox/Header/ReplaySelector

@onready var level_name_label: Label = $MainVBox/SummaryPanel/SummaryHBox/LevelNameLabel
@onready var score_label: Label = $MainVBox/SummaryPanel/SummaryHBox/ScoreLabel
@onready var accuracy_label: Label = $MainVBox/SummaryPanel/SummaryHBox/AccuracyLabel
@onready var time_label: Label = $MainVBox/SummaryPanel/SummaryHBox/TimeLabel
@onready var result_label: Label = $MainVBox/SummaryPanel/SummaryHBox/ResultLabel

@onready var wrong_steps_content: VBoxContainer = $MainVBox/TabContainer/WrongStepsTab/WrongStepsContent
@onready var settlement_content: VBoxContainer = $MainVBox/TabContainer/SettlementTab/SettlementContent
@onready var assessment_content: VBoxContainer = $MainVBox/TabContainer/AssessmentTab/AssessmentContent
@onready var recent_failures_content: VBoxContainer = $MainVBox/TabContainer/RecentFailuresTab/RecentFailuresContent

@onready var tab_container: TabContainer = $MainVBox/TabContainer
@onready var retry_button: Button = $MainVBox/Footer/RetryButton
@onready var menu_button: Button = $MainVBox/Footer/MenuButton

func _ready():
	if Globals:
		scene_manager = Globals.scene_manager
		replay_manager = Globals.replay_manager
		game_manager = Globals.game_manager
		if Globals.pending_replay_data.size() > 0:
			replay_data = Globals.pending_replay_data.duplicate(true)
			Globals.pending_replay_data.clear()
	
	tab_container.set_tab_title(0, "❌ 错误步骤")
	tab_container.set_tab_title(1, "💰 结算错因")
	tab_container.set_tab_title(2, "📐 评估回放")
	tab_container.set_tab_title(3, "📜 最近失败")
	
	back_button.pressed.connect(_on_back_button_pressed)
	retry_button.pressed.connect(_on_retry_button_pressed)
	menu_button.pressed.connect(_on_menu_button_pressed)
	replay_selector.item_selected.connect(_on_replay_selected)
	
	_load_replays()
	
	if replay_data and replay_data.size() > 0:
		current_replay = replay_data
		_render_all()
	else:
		_load_latest_replay()

func _load_replays():
	if not replay_manager:
		return
	
	all_replays = replay_manager.get_recent_replays(10)
	replay_selector.clear()
	
	if all_replays.size() == 0:
		replay_selector.add_item("暂无复盘记录")
		replay_selector.disabled = true
		return
	
	for i in range(all_replays.size()):
		var replay: Dictionary = all_replays[i]
		var passed: bool = replay.get("passed", false)
		var status_icon: String = "✅" if passed else "❌"
		var text: String = "%s %s - %d分" % [
			status_icon,
			replay.get("level_name", "未知"),
			replay.get("score", 0)
		]
		replay_selector.add_item(text)
		replay_selector.set_item_metadata(i, replay)
	
	replay_selector.selected = 0

func _on_replay_selected(index: int):
	if index >= 0 and index < all_replays.size():
		current_replay = all_replays[index]
		_render_all()

func _load_latest_replay():
	if not replay_manager:
		return
	
	var recent_replays: Array = replay_manager.get_recent_replays(1)
	if recent_replays.size() > 0:
		current_replay = recent_replays[0]
		replay_selector.selected = 0
		_render_all()
	else:
		_show_no_data_message()

func _render_all():
	_render_summary()
	_render_wrong_steps()
	_render_settlement_errors()
	_render_assessment_replays()
	_render_recent_failures()

func _render_summary():
	if current_replay.size() == 0:
		return
	
	level_name_label.text = current_replay.get("level_name", "未知关卡")
	score_label.text = "得分: %d" % current_replay.get("score", 0)
	accuracy_label.text = "正确率: %d%%" % int(current_replay.get("accuracy", 0) * 100)
	time_label.text = "用时: %d秒" % int(current_replay.get("time_used", 0))
	
	var passed: bool = current_replay.get("passed", false)
	if passed:
		result_label.text = "✅ 训练通过"
		result_label.add_theme_color_override("font_color", Color(0.3, 0.85, 0.4, 1))
	else:
		result_label.text = "❌ 训练未通过"
		result_label.add_theme_color_override("font_color", Color(0.95, 0.3, 0.3, 1))

func _render_wrong_steps():
	_clear_container(wrong_steps_content)
	
	if not replay_manager or current_replay.size() == 0:
		return
	
	var wrong_steps: Array = replay_manager.get_wrong_steps_from_replay(current_replay)
	
	if wrong_steps.size() == 0:
		var label: Label = Label.new()
		label.text = "🎉 本次训练没有错误步骤！"
		label.horizontal_alignment = 1
		label.theme_override_colors.font_color = Color(0.3, 0.85, 0.4, 1)
		label.theme_override_font_sizes.font_size = 18
		wrong_steps_content.add_child(label)
		return
	
	for step in wrong_steps:
		var card: Panel = _create_wrong_step_card(step)
		wrong_steps_content.add_child(card)

func _create_wrong_step_card(step: Dictionary) -> Panel:
	var card: Panel = Panel.new()
	card.custom_minimum_size = Vector2(0, 160)
	
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.layout_mode = 1
	vbox.anchors_preset = 15
	vbox.anchor_right = 1
	vbox.anchor_bottom = 1
	vbox.offset_left = 15
	vbox.offset_top = 12
	vbox.offset_right = -15
	vbox.offset_bottom = -12
	vbox.theme_override_constants.separation = 8
	card.add_child(vbox)
	
	var header: HBoxContainer = HBoxContainer.new()
	header.theme_override_constants.separation = 15
	vbox.add_child(header)
	
	var name_label: Label = Label.new()
	var is_critical: bool = step.get("is_critical", false)
	var critical_icon: String = "⚠️ " if is_critical else "👤 "
	name_label.text = "%s%s, %d岁" % [
		critical_icon,
		step.get("patient_name", "未知"),
		step.get("patient_age", 0)
	]
	name_label.theme_override_colors.font_color = Color(0.95, 0.95, 0.95, 1)
	name_label.theme_override_font_sizes.font_size = 18
	header.add_child(name_label)
	
	var error_cause: Dictionary = step.get("error_cause", {})
	var error_type: Label = Label.new()
	error_type.text = "❌ " + error_cause.get("type", "未知错误")
	error_type.theme_override_colors.font_color = Color(0.95, 0.5, 0.3, 1)
	error_type.theme_override_font_sizes.font_size = 14
	header.add_child(error_type)
	
	var levels_hbox: HBoxContainer = HBoxContainer.new()
	levels_hbox.theme_override_constants.separation = 20
	vbox.add_child(levels_hbox)
	
	var selected_level: int = step.get("selected_level", -1)
	var correct_level: int = step.get("correct_level", -1)
	
	var selected_label: Label = Label.new()
	if selected_level == -1:
		selected_label.text = "你的选择: ⏱ 超时未处理"
	else:
		selected_label.text = "你的选择: " + Patient.get_triage_level_name(selected_level)
	selected_label.theme_override_colors.font_color = Color(0.95, 0.3, 0.3, 1)
	selected_label.theme_override_font_sizes.font_size = 14
	levels_hbox.add_child(selected_label)
	
	var correct_label: Label = Label.new()
	correct_label.text = "正确分级: " + Patient.get_triage_level_name(correct_level)
	correct_label.theme_override_colors.font_color = Color(0.3, 0.85, 0.4, 1)
	correct_label.theme_override_font_sizes.font_size = 14
	levels_hbox.add_child(correct_label)
	
	var desc_label: Label = Label.new()
	desc_label.text = "📝 " + error_cause.get("description", "")
	desc_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	desc_label.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
	desc_label.theme_override_font_sizes.font_size = 13
	vbox.add_child(desc_label)
	
	var missed_indicators: Array = error_cause.get("key_indicators_missed", [])
	if missed_indicators.size() > 0:
		var indicators_title: Label = Label.new()
		indicators_title.text = "\n🔍 你可能忽略了这些关键指标:"
		indicators_title.theme_override_colors.font_color = Color(1, 0.75, 0.3, 1)
		indicators_title.theme_override_font_sizes.font_size = 13
		vbox.add_child(indicators_title)
		
		for indicator in missed_indicators:
			var ind_label: Label = Label.new()
			ind_label.text = "   ⚡ " + indicator
			ind_label.theme_override_colors.font_color = Color(0.9, 0.7, 0.4, 1)
			ind_label.theme_override_font_sizes.font_size = 12
			vbox.add_child(ind_label)
	
	var insurance_risk: Array = error_cause.get("insurance_risk", [])
	if insurance_risk.size() > 0:
		var risk_title: Label = Label.new()
		risk_title.text = "\n⚠️ 医保风险提示:"
		risk_title.theme_override_colors.font_color = Color(0.95, 0.3, 0.3, 1)
		risk_title.theme_override_font_sizes.font_size = 13
		vbox.add_child(risk_title)
		
		for risk in insurance_risk:
			var risk_label: Label = Label.new()
			risk_label.text = "   🚫 " + risk
			risk_label.theme_override_colors.font_color = Color(0.95, 0.5, 0.5, 1)
			risk_label.theme_override_font_sizes.font_size = 12
			vbox.add_child(risk_label)
	
	return card

func _render_settlement_errors():
	_clear_container(settlement_content)
	
	if not replay_manager or current_replay.size() == 0:
		return
	
	var prescription_errors: Array = replay_manager.get_training_prescription_errors(current_replay)
	
	if prescription_errors.size() == 0:
		var label: Label = Label.new()
		label.text = "🎉 本次训练没有处方相关错误！"
		label.horizontal_alignment = 1
		label.theme_override_colors.font_color = Color(0.3, 0.85, 0.4, 1)
		label.theme_override_font_sizes.font_size = 18
		settlement_content.add_child(label)
		return
	
	for error_info in prescription_errors:
		var card: Panel = _create_settlement_error_card(error_info)
		settlement_content.add_child(card)

func _create_settlement_error_card(error_info: Dictionary) -> Panel:
	var card: Panel = Panel.new()
	card.custom_minimum_size = Vector2(0, 200)
	
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.layout_mode = 1
	vbox.anchors_preset = 15
	vbox.anchor_right = 1
	vbox.anchor_bottom = 1
	vbox.offset_left = 15
	vbox.offset_top = 12
	vbox.offset_right = -15
	vbox.offset_bottom = -12
	vbox.theme_override_constants.separation = 8
	card.add_child(vbox)
	
	var header: HBoxContainer = HBoxContainer.new()
	header.theme_override_constants.separation = 15
	vbox.add_child(header)
	
	var patient_label: Label = Label.new()
	patient_label.text = "👤 " + error_info.get("patient_name", "未知")
	patient_label.theme_override_colors.font_color = Color(0.95, 0.95, 0.95, 1)
	patient_label.theme_override_font_sizes.font_size = 16
	header.add_child(patient_label)
	
	var prescription_code: Label = Label.new()
	prescription_code.text = "📋 处方: " + error_info.get("prescription_code", "")
	prescription_code.theme_override_colors.font_color = Color(0.6, 0.8, 0.9, 1)
	prescription_code.theme_override_font_sizes.font_size = 12
	header.add_child(prescription_code)
	
	var items_label: Label = Label.new()
	var prescribed_items: Array = error_info.get("prescribed_items", [])
	items_label.text = "\n💊 处方项目: " + ", ".join(prescribed_items)
	items_label.theme_override_colors.font_color = Color(0.7, 0.85, 0.7, 1)
	items_label.theme_override_font_sizes.font_size = 13
	vbox.add_child(items_label)
	
	var frequency_label: Label = Label.new()
	var prescription: Dictionary = error_info.get("training_prescription", {})
	frequency_label.text = "⏰ 频次: " + prescription.get("frequency", "未知")
	frequency_label.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
	frequency_label.theme_override_font_sizes.font_size = 12
	vbox.add_child(frequency_label)
	
	var common_errors: Array = error_info.get("common_errors", [])
	if common_errors.size() > 0:
		var common_title: Label = Label.new()
		common_title.text = "\n⚠️ 常见错误类型:"
		common_title.theme_override_colors.font_color = Color(0.95, 0.7, 0.3, 1)
		common_title.theme_override_font_sizes.font_size = 13
		vbox.add_child(common_title)
		
		for err in common_errors:
			var err_label: Label = Label.new()
			err_label.text = "   ❌ " + err
			err_label.theme_override_colors.font_color = Color(0.95, 0.5, 0.3, 1)
			err_label.theme_override_font_sizes.font_size = 12
			vbox.add_child(err_label)
	
	var settlement_items: Array = error_info.get("settlement_items", [])
	if settlement_items.size() > 0:
		var items_title: Label = Label.new()
		items_title.text = "\n💰 结算明细:"
		items_title.theme_override_colors.font_color = Color(0.8, 0.85, 0.9, 1)
		items_title.theme_override_font_sizes.font_size = 13
		vbox.add_child(items_title)
		
		for item in settlement_items:
			var item_hbox: HBoxContainer = HBoxContainer.new()
			item_hbox.theme_override_constants.separation = 10
			vbox.add_child(item_hbox)
			
			var name_label: Label = Label.new()
			name_label.text = "   • " + item.get("name", "")
			name_label.size_flags_horizontal = 3
			name_label.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
			name_label.theme_override_font_sizes.font_size = 12
			item_hbox.add_child(name_label)
			
			var amount_label: Label = Label.new()
			amount_label.text = "¥%.1f" % item.get("amount", 0)
			amount_label.theme_override_colors.font_color = Color(0.9, 0.8, 0.4, 1)
			amount_label.theme_override_font_sizes.font_size = 12
			item_hbox.add_child(amount_label)
			
			var insurance_label: Label = Label.new()
			if item.get("insurance_covered", true):
				insurance_label.text = "✅"
			else:
				insurance_label.text = "❌ 拒付"
				insurance_label.theme_override_colors.font_color = Color(0.95, 0.3, 0.3, 1)
			insurance_label.theme_override_font_sizes.font_size = 12
			item_hbox.add_child(insurance_label)
	
	var mismatch_analysis: Array = error_info.get("mismatch_analysis", [])
	if mismatch_analysis.size() > 0:
		var analysis_title: Label = Label.new()
		analysis_title.text = "\n🚫 错因分析:"
		analysis_title.theme_override_colors.font_color = Color(0.95, 0.3, 0.3, 1)
		analysis_title.theme_override_font_sizes.font_size = 13
		vbox.add_child(analysis_title)
		
		for analysis in mismatch_analysis:
			var analysis_label: Label = Label.new()
			analysis_label.text = "   ⚠️ " + analysis
			analysis_label.theme_override_colors.font_color = Color(0.95, 0.5, 0.5, 1)
			analysis_label.theme_override_font_sizes.font_size = 12
			vbox.add_child(analysis_label)
	
	return card

func _render_assessment_replays():
	_clear_container(assessment_content)
	
	if not replay_manager:
		return
	
	var assessment_replays: Array = replay_manager.get_assessment_replays()
	
	if assessment_replays.size() == 0:
		var label: Label = Label.new()
		label.text = "暂无评估量表失败回放记录\n（最近3次失败的评估量表将显示在这里）"
		label.horizontal_alignment = 1
		label.theme_override_colors.font_color = Color(0.5, 0.5, 0.5, 1)
		label.theme_override_font_sizes.font_size = 16
		assessment_content.add_child(label)
		return
	
	var info_label: Label = Label.new()
	info_label.text = "📊 最近%d次评估量表失败回放（帮助你找出卡在哪里）" % assessment_replays.size()
	info_label.theme_override_colors.font_color = Color(0.8, 0.85, 0.9, 1)
	info_label.theme_override_font_sizes.font_size = 14
	assessment_content.add_child(info_label)
	
	for i in range(assessment_replays.size()):
		var replay: Dictionary = assessment_replays[i]
		var card: Panel = _create_assessment_replay_card(replay, i + 1)
		assessment_content.add_child(card)

func _create_assessment_replay_card(replay: Dictionary, index: int) -> Panel:
	var card: Panel = Panel.new()
	card.custom_minimum_size = Vector2(0, 220)
	
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.layout_mode = 1
	vbox.anchors_preset = 15
	vbox.anchor_right = 1
	vbox.anchor_bottom = 1
	vbox.offset_left = 15
	vbox.offset_top = 12
	vbox.offset_right = -15
	vbox.offset_bottom = -12
	vbox.theme_override_constants.separation = 8
	card.add_child(vbox)
	
	var header: HBoxContainer = HBoxContainer.new()
	header.theme_override_constants.separation = 15
	vbox.add_child(header)
	
	var index_label: Label = Label.new()
	index_label.text = "#%d" % index
	index_label.theme_override_colors.font_color = Color(1, 0.85, 0.3, 1)
	index_label.theme_override_font_sizes.font_size = 20
	header.add_child(index_label)
	
	var patient_info: Dictionary = replay.get("patient", {})
	var patient_label: Label = Label.new()
	patient_label.text = "👤 %s, %d岁" % [
		patient_info.get("name", "未知"),
		patient_info.get("age", 0)
	]
	patient_label.theme_override_colors.font_color = Color(0.95, 0.95, 0.95, 1)
	patient_label.theme_override_font_sizes.font_size = 16
	header.add_child(patient_label)
	
	var level_label: Label = Label.new()
	var selected: int = patient_info.get("selected_level", -1)
	var correct: int = patient_info.get("correct_level", -1)
	level_label.text = "分级: 你选了%s，正确是%s" % [
		Patient.get_triage_level_name(selected) if selected != -1 else "未选择",
		Patient.get_triage_level_name(correct)
	]
	level_label.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
	level_label.theme_override_font_sizes.font_size = 12
	header.add_child(level_label)
	
	var timestamp_label: Label = Label.new()
	timestamp_label.text = "⏰ " + replay.get("timestamp", "")
	timestamp_label.size_flags_horizontal = 3
	timestamp_label.horizontal_alignment = 2
	timestamp_label.theme_override_colors.font_color = Color(0.5, 0.55, 0.6, 1)
	timestamp_label.theme_override_font_sizes.font_size = 11
	header.add_child(timestamp_label)
	
	var assessment: Dictionary = replay.get("assessment", {})
	var scale_type: String = assessment.get("scale_type", "未知量表")
	var total_score: int = assessment.get("total_score", 0)
	
	var scale_label: Label = Label.new()
	scale_label.text = "\n📐 量表: %s | 总分: %d" % [scale_type, total_score]
	scale_label.theme_override_colors.font_color = Color(0.6, 0.8, 0.9, 1)
	scale_label.theme_override_font_sizes.font_size = 14
	vbox.add_child(scale_label)
	
	var interpretation: String = assessment.get("interpretation", "")
	var interpretation_label: Label = Label.new()
	interpretation_label.text = "💡 解读: " + interpretation
	interpretation_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	interpretation_label.theme_override_colors.font_color = Color(0.8, 0.7, 0.9, 1)
	interpretation_label.theme_override_font_sizes.font_size = 13
	vbox.add_child(interpretation_label)
	
	var scores: Dictionary = assessment.get("scores", {})
	if scores.size() > 0:
		var scores_title: Label = Label.new()
		scores_title.text = "\n📈 高分项目（可能是你忽略的关键点）:"
		scores_title.theme_override_colors.font_color = Color(0.95, 0.7, 0.3, 1)
		scores_title.theme_override_font_sizes.font_size = 13
		vbox.add_child(scores_title)
		
		var high_scores: Array = []
		for key in scores:
			var val: int = scores.get(key, 0)
			if val >= 3:
				high_scores.append({"name": key, "score": val})
		
		high_scores.sort_custom(func(a, b): return b.score > a.score)
		
		for hs in high_scores.slice(0, 5):
			var score_label: Label = Label.new()
			score_label.text = "   🔴 %s: %d分" % [hs.name, hs.score]
			score_label.theme_override_colors.font_color = Color(0.95, 0.5, 0.3, 1)
			score_label.theme_override_font_sizes.font_size = 12
			vbox.add_child(score_label)
	
	var recommendation: String = assessment.get("recommendation", "")
	if recommendation:
		var rec_label: Label = Label.new()
		rec_label.text = "\n✅ 建议: " + recommendation
		rec_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		rec_label.theme_override_colors.font_color = Color(0.7, 0.85, 0.7, 1)
		rec_label.theme_override_font_sizes.font_size = 12
		vbox.add_child(rec_label)
	
	return card

func _render_recent_failures():
	_clear_container(recent_failures_content)
	
	if not replay_manager:
		return
	
	var recent_failures: Array = replay_manager.get_recent_failures(3)
	
	if recent_failures.size() == 0:
		var label: Label = Label.new()
		label.text = "🎉 太棒了！最近没有失败记录\n继续保持！"
		label.horizontal_alignment = 1
		label.theme_override_colors.font_color = Color(0.3, 0.85, 0.4, 1)
		label.theme_override_font_sizes.font_size = 16
		recent_failures_content.add_child(label)
		return
	
	var info_label: Label = Label.new()
	info_label.text = "📜 最近%d次失败过程回放" % recent_failures.size()
	info_label.theme_override_colors.font_color = Color(0.8, 0.85, 0.9, 1)
	info_label.theme_override_font_sizes.font_size = 14
	recent_failures_content.add_child(info_label)
	
	for i in range(recent_failures.size()):
		var failure: Dictionary = recent_failures[i]
		var card: Panel = _create_failure_replay_card(failure, i + 1)
		recent_failures_content.add_child(card)

func _create_failure_replay_card(failure: Dictionary, index: int) -> Panel:
	var card: Panel = Panel.new()
	card.custom_minimum_size = Vector2(0, 180)
	
	var vbox: VBoxContainer = VBoxContainer.new()
	vbox.layout_mode = 1
	vbox.anchors_preset = 15
	vbox.anchor_right = 1
	vbox.anchor_bottom = 1
	vbox.offset_left = 15
	vbox.offset_top = 12
	vbox.offset_right = -15
	vbox.offset_bottom = -12
	vbox.theme_override_constants.separation = 8
	card.add_child(vbox)
	
	var header: HBoxContainer = HBoxContainer.new()
	header.theme_override_constants.separation = 15
	vbox.add_child(header)
	
	var index_label: Label = Label.new()
	index_label.text = "失败 #%d" % index
	index_label.theme_override_colors.font_color = Color(0.95, 0.3, 0.3, 1)
	index_label.theme_override_font_sizes.font_size = 16
	header.add_child(index_label)
	
	var level_label: Label = Label.new()
	level_label.text = failure.get("level_name", "未知关卡")
	level_label.theme_override_colors.font_color = Color(0.9, 0.9, 0.9, 1)
	level_label.theme_override_font_sizes.font_size = 16
	header.add_child(level_label)
	
	var score_label: Label = Label.new()
	score_label.text = "得分: %d分" % failure.get("score", 0)
	score_label.theme_override_colors.font_color = Color(1, 0.85, 0.3, 1)
	score_label.theme_override_font_sizes.font_size = 14
	header.add_child(score_label)
	
	var time_label: Label = Label.new()
	time_label.text = "⏰ " + failure.get("timestamp", "")
	time_label.size_flags_horizontal = 3
	time_label.horizontal_alignment = 2
	time_label.theme_override_colors.font_color = Color(0.5, 0.55, 0.6, 1)
	time_label.theme_override_font_sizes.font_size = 11
	header.add_child(time_label)
	
	var stats_hbox: HBoxContainer = HBoxContainer.new()
	stats_hbox.theme_override_constants.separation = 30
	vbox.add_child(stats_hbox)
	
	var correct_label: Label = Label.new()
	correct_label.text = "✅ 正确: %d" % failure.get("correct_count", 0)
	correct_label.theme_override_colors.font_color = Color(0.3, 0.85, 0.4, 1)
	correct_label.theme_override_font_sizes.font_size = 14
	stats_hbox.add_child(correct_label)
	
	var wrong_label: Label = Label.new()
	wrong_label.text = "❌ 错误: %d" % failure.get("wrong_count", 0)
	wrong_label.theme_override_colors.font_color = Color(0.95, 0.3, 0.3, 1)
	wrong_label.theme_override_font_sizes.font_size = 14
	stats_hbox.add_child(wrong_label)
	
	var rejection_label: Label = Label.new()
	rejection_label.text = "💰 拒付: %d次" % failure.get("insurance_rejections", 0)
	rejection_label.theme_override_colors.font_color = Color(0.95, 0.5, 0.3, 1)
	rejection_label.theme_override_font_sizes.font_size = 14
	stats_hbox.add_child(rejection_label)
	
	var time_used_label: Label = Label.new()
	time_used_label.text = "⏱ 用时: %d秒" % int(failure.get("time_used", 0))
	time_used_label.theme_override_colors.font_color = Color(0.6, 0.8, 0.9, 1)
	time_used_label.theme_override_font_sizes.font_size = 14
	stats_hbox.add_child(time_used_label)
	
	var failed_patients: Array = failure.get("failed_patients", [])
	if failed_patients.size() > 0:
		var failed_title: Label = Label.new()
		failed_title.text = "\n❌ 出错的患者:"
		failed_title.theme_override_colors.font_color = Color(0.95, 0.7, 0.3, 1)
		failed_title.theme_override_font_sizes.font_size = 13
		vbox.add_child(failed_title)
		
		for patient in failed_patients:
			var patient_label: Label = Label.new()
			var selected: int = patient.get("selected_level", -1)
			var correct: int = patient.get("correct_level", -1)
			var selected_text: String = Patient.get_triage_level_name(selected) if selected != -1 else "超时未处理"
			patient_label.text = "   • %s: 你选了%s，正确是%s" % [
				patient.get("name", "未知"),
				selected_text,
				Patient.get_triage_level_name(correct)
			]
			patient_label.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
			patient_label.theme_override_font_sizes.font_size = 12
			vbox.add_child(patient_label)
	
	var load_button: Button = Button.new()
	load_button.text = "查看详细复盘 →"
	load_button.custom_minimum_size = Vector2(0, 35)
	load_button.theme_override_font_sizes.font_size = 12
	load_button.pressed.connect(_load_failure_replay.bind(failure))
	vbox.add_child(load_button)
	
	return card

func _load_failure_replay(failure: Dictionary):
	current_replay = failure
	replay_data = failure
	_render_all()
	tab_container.current_tab = 0

func _clear_container(container: VBoxContainer):
	for child in container.get_children():
		child.queue_free()

func _show_no_data_message():
	var label: Label = Label.new()
	label.text = "暂无复盘记录\n请先完成一次训练"
	label.horizontal_alignment = 1
	label.vertical_alignment = 1
	label.theme_override_colors.font_color = Color(0.5, 0.5, 0.5, 1)
	label.theme_override_font_sizes.font_size = 18
	wrong_steps_content.add_child(label)

func _on_back_button_pressed():
	if scene_manager:
		scene_manager.go_to_main_menu()

func _on_retry_button_pressed():
	if current_replay.size() > 0 and game_manager and scene_manager:
		var level_id: String = current_replay.get("level_id", "")
		if level_id:
			scene_manager.go_to_game_level(level_id)

func _on_menu_button_pressed():
	if scene_manager:
		scene_manager.go_to_main_menu()
