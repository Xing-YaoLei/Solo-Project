extends Control

var scene_manager: SceneManager
var game_manager: GameManager

var current_patient: Patient = null
var current_document_type: int = Patient.DocumentType.NURSING_LOG
var patient_card_cache: Dictionary = {}

var warning_panel: Panel
var warning_text: Label
var warning_close: Button
var warning_tween: Tween = null

@onready var level_name_label: Label = $TopBar/TopBarHBox/LevelName
@onready var score_label: Label = $TopBar/TopBarHBox/ScoreLabel
@onready var accuracy_label: Label = $TopBar/TopBarHBox/AccuracyLabel
@onready var timer_label: Label = $TopBar/TopBarHBox/TimerLabel
@onready var back_button: Button = $TopBar/TopBarHBox/BackButton

@onready var patient_queue: VBoxContainer = $MainContainer/PatientQueuePanel/PatientQueueVBox/PatientQueueScroll/PatientQueue
@onready var patient_detail_vbox: VBoxContainer = $MainContainer/CenterPanel/PatientDetailPanel/PatientDetailVBox
@onready var no_patient_label: Label = $MainContainer/CenterPanel/PatientDetailPanel/PatientDetailVBox/NoPatientLabel

@onready var level1_button: Button = $MainContainer/CenterPanel/TriageButtonsPanel/TriageButtonsVBox/TriageButtonsHBox/Level1Button
@onready var level2_button: Button = $MainContainer/CenterPanel/TriageButtonsPanel/TriageButtonsVBox/TriageButtonsHBox/Level2Button
@onready var level3_button: Button = $MainContainer/CenterPanel/TriageButtonsPanel/TriageButtonsVBox/TriageButtonsHBox/Level3Button
@onready var level4_button: Button = $MainContainer/CenterPanel/TriageButtonsPanel/TriageButtonsVBox/TriageButtonsHBox/Level4Button

@onready var nursing_log_tab: Button = $MainContainer/DocumentPanel/DocumentVBox/DocumentTabs/NursingLogTab
@onready var settlement_tab: Button = $MainContainer/DocumentPanel/DocumentVBox/DocumentTabs/SettlementTab
@onready var assessment_tab: Button = $MainContainer/DocumentPanel/DocumentVBox/DocumentTabs/AssessmentTab
@onready var document_content: VBoxContainer = $MainContainer/DocumentPanel/DocumentVBox/DocumentContentScroll/DocumentContent
@onready var document_placeholder: Label = $MainContainer/DocumentPanel/DocumentVBox/DocumentContentScroll/DocumentContent/DocumentPlaceholder

func _ready():
	var main: Node = get_tree().root.get_node_or_null("Main")
	if main:
		scene_manager = main.get_node_or_null("SceneManager")
		game_manager = main.get_node_or_null("GameManager")
	
	warning_panel = $WarningPanel
	warning_text = $WarningPanel/WarningHBox/WarningVBox/WarningText
	warning_close = $WarningPanel/WarningHBox/WarningClose
	
	if game_manager:
		game_manager.level_started.connect(_on_level_started)
		game_manager.patient_arrived.connect(_on_patient_arrived)
		game_manager.patient_completed.connect(_on_patient_completed)
		game_manager.insurance_rejection_warning.connect(_on_insurance_warning)
		game_manager.level_completed.connect(_on_level_completed)
		game_manager.level_failed.connect(_on_level_failed)
	
	back_button.pressed.connect(_on_back_button_pressed)
	warning_close.pressed.connect(_hide_warning)
	
	level1_button.pressed.connect(_on_triage_button_pressed.bind(Patient.TriageLevel.LEVEL_1))
	level2_button.pressed.connect(_on_triage_button_pressed.bind(Patient.TriageLevel.LEVEL_2))
	level3_button.pressed.connect(_on_triage_button_pressed.bind(Patient.TriageLevel.LEVEL_3))
	level4_button.pressed.connect(_on_triage_button_pressed.bind(Patient.TriageLevel.LEVEL_4))
	
	nursing_log_tab.pressed.connect(_on_document_tab_pressed.bind(Patient.DocumentType.NURSING_LOG))
	settlement_tab.pressed.connect(_on_document_tab_pressed.bind(Patient.DocumentType.SETTLEMENT_DETAIL))
	assessment_tab.pressed.connect(_on_document_tab_pressed.bind(Patient.DocumentType.ASSESSMENT_SCALE))
	
	_set_triage_buttons_enabled(false)
	_set_document_tabs_enabled(false)
	
	if game_manager and game_manager.current_level:
		_on_level_started(game_manager.current_level)

func _process(delta: float):
	if game_manager and game_manager.is_level_active:
		_update_timer()
		_update_patient_cards()

func _update_timer():
	if not game_manager or not game_manager.current_level:
		return
	
	var remaining: float = game_manager.current_level.time_limit - game_manager.level_elapsed_time
	remaining = max(0, remaining)
	
	var minutes: int = int(remaining / 60)
	var seconds: int = int(remaining % 60)
	
	if remaining < 30:
		timer_label.add_theme_color_override("font_color", Color(0.95, 0.3, 0.3, 1))
	elif remaining < 60:
		timer_label.add_theme_color_override("font_color", Color(0.95, 0.7, 0.2, 1))
	else:
		timer_label.add_theme_color_override("font_color", Color(0.9, 0.9, 0.6, 1))
	
	timer_label.text = "⏱ %02d:%02d" % [minutes, seconds]

func _update_patient_cards():
	if not game_manager:
		return
	
	var current_time: float = Time.get_ticks_msec() / 1000.0
	for patient in game_manager.current_patients:
		if patient_card_cache.has(patient.id):
			var card_data: Dictionary = patient_card_cache[patient.id]
			var time_bar: ProgressBar = card_data.get("time_bar", null)
			var time_label: Label = card_data.get("time_label", null)
			if time_bar and time_label:
				var remaining: float = patient.get_remaining_time(current_time)
				var progress: float = remaining / patient.time_limit
				time_bar.value = progress * 100
				time_label.text = "⏱ %ds" % int(remaining)
				
				if remaining < 15:
					time_bar.add_theme_color_override("fill_color", Color(0.95, 0.3, 0.3, 1))
				elif remaining < 30:
					time_bar.add_theme_color_override("fill_color", Color(0.95, 0.7, 0.2, 1))
				else:
					time_bar.add_theme_color_override("fill_color", Color(0.3, 0.85, 0.4, 1))

func _on_level_started(level_data: LevelData):
	level_name_label.text = level_data.name
	_update_score_display()
	patient_queue.clear_children()
	patient_card_cache.clear()
	current_patient = null

func _on_patient_arrived(patient: Patient):
	var card: Panel = _create_patient_card(patient)
	patient_queue.add_child(card)
	patient_card_cache[patient.id] = {"card": card, "patient": patient}

func _create_patient_card(patient: Patient) -> Panel:
	var card: Panel = Panel.new()
	card.name = "PatientCard_" + patient.id
	card.custom_minimum_size = Vector2(0, 100)
	
	var vbox: VBoxContainer.new()
	vbox.layout_mode = 1
	vbox.anchors_preset = 15
	vbox.anchor_right = 1
	vbox.anchor_bottom = 1
	vbox.offset_left = 12
	vbox.offset_top = 10
	vbox.offset_right = -12
	vbox.offset_bottom = -10
	vbox.theme_override_constants.separation = 6
	card.add_child(vbox)
	
	var header: HBoxContainer.new()
	header.theme_override_constants.separation = 10
	vbox.add_child(header)
	
	var name_label: Label = Label.new()
	name_label.text = "👤 %s, %d岁" % [patient.name, patient.age]
	name_label.theme_override_colors.font_color = Color(0.95, 0.95, 0.95, 1)
	name_label.theme_override_font_sizes.font_size = 16
	header.add_child(name_label)
	
	if patient.is_critical:
		var critical_label: Label = Label.new()
		critical_label.text = "⚠ 危急"
		critical_label.theme_override_colors.font_color = Color(0.95, 0.3, 0.3, 1)
		critical_label.theme_override_font_sizes.font_size = 12
		header.add_child(critical_label)
	
	var time_label: Label = Label.new()
	time_label.text = "⏱ %ds" % int(patient.time_limit)
	time_label.size_flags_horizontal = 3
	time_label.horizontal_alignment = 2
	time_label.theme_override_colors.font_color = Color(0.7, 0.85, 0.7, 1)
	time_label.theme_override_font_sizes.font_size = 14
	header.add_child(time_label)
	
	var time_bar: ProgressBar = ProgressBar.new()
	time_bar.custom_minimum_size = Vector2(0, 8)
	time_bar.value = 100
	time_bar.show_percentage = false
	vbox.add_child(time_bar)
	
	var hint_label: Label = Label.new()
	var nursing_log: Dictionary = patient.get_document(Patient.DocumentType.NURSING_LOG)
	var symptoms: Array = nursing_log.get("symptoms", [])
	if symptoms.size() > 0:
		hint_label.text = "📋 症状: " + symptoms[0]
	else:
		hint_label.text = "📋 请查看详细文档"
	hint_label.theme_override_colors.font_color = Color(0.6, 0.65, 0.7, 1)
	hint_label.theme_override_font_sizes.font_size = 12
	hint_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	vbox.add_child(hint_label)
	
	patient_card_cache[patient.id] = {
		"card": card,
		"patient": patient,
		"time_bar": time_bar,
		"time_label": time_label
	}
	
	var mouse_filter: Control = card
	mouse_filter.mouse_filter = Control.MOUSE_FILTER_STOP
	card.gui_input.connect(_on_patient_card_clicked.bind(patient))
	
	return card

func _on_patient_card_clicked(event: InputEvent, patient: Patient):
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		_select_patient(patient)

func _select_patient(patient: Patient):
	current_patient = patient
	no_patient_label.visible = false
	_refresh_patient_detail()
	_refresh_document_content()
	_set_triage_buttons_enabled(true)
	_set_document_tabs_enabled(true)

func _refresh_patient_detail():
	if not current_patient:
		return
	
	for child in patient_detail_vbox.get_children():
		if child != no_patient_label:
			child.queue_free()
	
	var name_label: Label = Label.new()
	name_label.text = "👤 %s, %d岁, %s" % [current_patient.name, current_patient.age, current_patient.gender]
	name_label.theme_override_colors.font_color = Color(0.95, 0.95, 0.95, 1)
	name_label.theme_override_font_sizes.font_size = 24
	patient_detail_vbox.add_child(name_label)
	
	var critical_label: Label = Label.new()
	if current_patient.is_critical:
		critical_label.text = "⚠️ 危急患者 - 请优先处理"
		critical_label.theme_override_colors.font_color = Color(0.95, 0.3, 0.3, 1)
	else:
		critical_label.text = "✅ 普通患者"
		critical_label.theme_override_colors.font_color = Color(0.3, 0.85, 0.4, 1)
	critical_label.theme_override_font_sizes.font_size = 16
	patient_detail_vbox.add_child(critical_label)
	
	var separator: HSeparator = HSeparator.new()
	patient_detail_vbox.add_child(separator)
	
	var nursing_log: Dictionary = current_patient.get_document(Patient.DocumentType.NURSING_LOG)
	var symptoms: Array = nursing_log.get("symptoms", [])
	var symptoms_label: Label = Label.new()
	symptoms_label.text = "🏥 主诉症状:"
	symptoms_label.theme_override_colors.font_color = Color(0.8, 0.85, 0.9, 1)
	symptoms_label.theme_override_font_sizes.font_size = 16
	patient_detail_vbox.add_child(symptoms_label)
	
	for symptom in symptoms:
		var sym_label: Label = Label.new()
		sym_label.text = "  • " + symptom
		sym_label.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
		sym_label.theme_override_font_sizes.font_size = 14
		patient_detail_vbox.add_child(sym_label)
	
	var notes_label: Label = Label.new()
	notes_label.text = "\n📝 护理记录: " + nursing_log.get("nursing_notes", "")
	notes_label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	notes_label.theme_override_colors.font_color = Color(0.65, 0.7, 0.75, 1)
	notes_label.theme_override_font_sizes.font_size = 14
	patient_detail_vbox.add_child(notes_label)
	
	var spacer: Control = Control.new()
	spacer.size_flags_vertical = 3
	patient_detail_vbox.add_child(spacer)

func _on_document_tab_pressed(doc_type: int):
	current_document_type = doc_type
	_update_document_tab_styles()
	_refresh_document_content()

func _update_document_tab_styles():
	var tabs: Array = [nursing_log_tab, settlement_tab, assessment_tab]
	for i in range(tabs.size()):
		var tab: Button = tabs[i]
		if i == current_document_type:
			tab.add_theme_color_override("font_color", Color(0.3, 0.85, 1, 1))
		else:
			tab.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7, 1))

func _refresh_document_content():
	for child in document_content.get_children():
		if child != document_placeholder:
			child.queue_free()
	
	if not current_patient:
		document_placeholder.visible = true
		return
	
	document_placeholder.visible = false
	var doc_data: Dictionary = current_patient.get_document(current_document_type)
	
	match current_document_type:
		Patient.DocumentType.NURSING_LOG:
			_render_nursing_log(doc_data)
		Patient.DocumentType.SETTLEMENT_DETAIL:
			_render_settlement_detail(doc_data)
		Patient.DocumentType.ASSESSMENT_SCALE:
			_render_assessment_scale(doc_data)

func _render_nursing_log(data: Dictionary):
	var title: Label = Label.new()
	title.text = "📋 " + data.get("title", "护理日志")
	title.theme_override_colors.font_color = Color(0.3, 0.85, 1, 1)
	title.theme_override_font_sizes.font_size = 18
	document_content.add_child(title)
	
	var date: Label = Label.new()
	date.text = "📅 " + data.get("date", "")
	date.theme_override_colors.font_color = Color(0.6, 0.65, 0.7, 1)
	date.theme_override_font_sizes.font_size = 12
	document_content.add_child(date)
	
	var separator: HSeparator = HSeparator.new()
	document_content.add_child(separator)
	
	var vital_title: Label = Label.new()
	vital_title.text = "📊 生命体征"
	vital_title.theme_override_colors.font_color = Color(0.8, 0.85, 0.9, 1)
	vital_title.theme_override_font_sizes.font_size = 14
	document_content.add_child(vital_title)
	
	var vital_signs: Dictionary = data.get("vital_signs", {})
	for key in vital_signs:
		var vs_label: Label = Label.new()
		vs_label.text = "  %s: %s" % [key, vital_signs[key]]
		vs_label.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
		vs_label.theme_override_font_sizes.font_size = 13
		document_content.add_child(vs_label)
	
	var symptoms_title: Label = Label.new()
	symptoms_title.text = "\n🤒 症状"
	symptoms_title.theme_override_colors.font_color = Color(0.8, 0.85, 0.9, 1)
	symptoms_title.theme_override_font_sizes.font_size = 14
	document_content.add_child(symptoms_title)
	
	var symptoms: Array = data.get("symptoms", [])
	for symptom in symptoms:
		var sym_label: Label = Label.new()
		sym_label.text = "  • " + symptom
		sym_label.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
		sym_label.theme_override_font_sizes.font_size = 13
		document_content.add_child(sym_label)
	
	var notes_title: Label = Label.new()
	notes_title.text = "\n📝 护理记录"
	notes_title.theme_override_colors.font_color = Color(0.8, 0.85, 0.9, 1)
	notes_title.theme_override_font_sizes.font_size = 14
	document_content.add_child(notes_title)
	
	var notes: Label = Label.new()
	notes.text = "  " + data.get("nursing_notes", "")
	notes.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	notes.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
	notes.theme_override_font_sizes.font_size = 13
	document_content.add_child(notes)
	
	var indicators_title: Label = Label.new()
	indicators_title.text = "\n🔍 关键指标"
	indicators_title.theme_override_colors.font_color = Color(1, 0.85, 0.3, 1)
	indicators_title.theme_override_font_sizes.font_size = 14
	document_content.add_child(indicators_title)
	
	var indicators: Array = data.get("key_indicators", [])
	for indicator in indicators:
		var ind_label: Label = Label.new()
		ind_label.text = "  ⚡ " + indicator
		ind_label.theme_override_colors.font_color = Color(1, 0.75, 0.3, 1)
		ind_label.theme_override_font_sizes.font_size = 13
		document_content.add_child(ind_label)

func _render_settlement_detail(data: Dictionary):
	var title: Label = Label.new()
	title.text = "💰 " + data.get("title", "结算明细")
	title.theme_override_colors.font_color = Color(0.3, 0.85, 1, 1)
	title.theme_override_font_sizes.font_size = 18
	document_content.add_child(title)
	
	var date: Label = Label.new()
	date.text = "📅 " + data.get("date", "")
	date.theme_override_colors.font_color = Color(0.6, 0.65, 0.7, 1)
	date.theme_override_font_sizes.font_size = 12
	document_content.add_child(date)
	
	var prescription: Label = Label.new()
	prescription.text = "📋 处方编号: " + data.get("prescription_code", "")
	prescription.theme_override_colors.font_color = Color(0.7, 0.85, 0.7, 1)
	prescription.theme_override_font_sizes.font_size = 12
	document_content.add_child(prescription)
	
	var separator: HSeparator = HSeparator.new()
	document_content.add_child(separator)
	
	var items_title: Label = Label.new()
	items_title.text = "📄 收费项目"
	items_title.theme_override_colors.font_color = Color(0.8, 0.85, 0.9, 1)
	items_title.theme_override_font_sizes.font_size = 14
	document_content.add_child(items_title)
	
	var items: Array = data.get("items", [])
	for item in items:
		var item_hbox: HBoxContainer.new()
		item_hbox.theme_override_constants.separation = 10
		document_content.add_child(item_hbox)
		
		var name_label: Label = Label.new()
		name_label.text = "  • " + item.get("name", "")
		name_label.size_flags_horizontal = 3
		name_label.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
		name_label.theme_override_font_sizes.font_size = 13
		item_hbox.add_child(name_label)
		
		var amount_label: Label = Label.new()
		amount_label.text = "¥%.1f" % item.get("amount", 0)
		amount_label.theme_override_colors.font_color = Color(0.9, 0.8, 0.4, 1)
		amount_label.theme_override_font_sizes.font_size = 13
		item_hbox.add_child(amount_label)
		
		var insurance_label: Label = Label.new()
		if item.get("insurance_covered", true):
			insurance_label.text = "✅ 医保"
			insurance_label.theme_override_colors.font_color = Color(0.3, 0.85, 0.4, 1)
		else:
			insurance_label.text = "❌ 拒付"
			insurance_label.theme_override_colors.font_color = Color(0.95, 0.3, 0.3, 1)
		insurance_label.theme_override_font_sizes.font_size = 12
		item_hbox.add_child(insurance_label)
	
	var total_separator: HSeparator = HSeparator.new()
	document_content.add_child(total_separator)
	
	var total_hbox: HBoxContainer.new()
	total_hbox.theme_override_constants.separation = 20
	document_content.add_child(total_hbox)
	
	var total_label: Label = Label.new()
	total_label.text = "总计: ¥%.1f" % data.get("total_amount", 0)
	total_label.theme_override_colors.font_color = Color(0.95, 0.85, 0.3, 1)
	total_label.theme_override_font_sizes.font_size = 16
	total_hbox.add_child(total_label)
	
	var insurance_amount: Label = Label.new()
	insurance_amount.text = "医保: ¥%.1f" % data.get("insurance_amount", 0)
	insurance_amount.theme_override_colors.font_color = Color(0.3, 0.85, 0.4, 1)
	insurance_amount.theme_override_font_sizes.font_size = 14
	total_hbox.add_child(insurance_amount)
	
	var self_payment: Label = Label.new()
	self_payment.text = "自付: ¥%.1f" % data.get("self_payment", 0)
	self_payment.theme_override_colors.font_color = Color(0.95, 0.5, 0.3, 1)
	self_payment.theme_override_font_sizes.font_size = 14
	total_hbox.add_child(self_payment)
	
	var risk_points: Array = data.get("risk_points", [])
	if risk_points.size() > 0:
		var risk_title: Label = Label.new()
		risk_title.text = "\n⚠️ 医保风险提示"
		risk_title.theme_override_colors.font_color = Color(0.95, 0.3, 0.3, 1)
		risk_title.theme_override_font_sizes.font_size = 14
		document_content.add_child(risk_title)
		
		for risk in risk_points:
			var risk_label: Label = Label.new()
			risk_label.text = "  🚫 " + risk
			risk_label.theme_override_colors.font_color = Color(0.95, 0.5, 0.5, 1)
			risk_label.theme_override_font_sizes.font_size = 13
			document_content.add_child(risk_label)

func _render_assessment_scale(data: Dictionary):
	var title: Label = Label.new()
	title.text = "📐 " + data.get("title", "评估量表")
	title.theme_override_colors.font_color = Color(0.3, 0.85, 1, 1)
	title.theme_override_font_sizes.font_size = 18
	document_content.add_child(title)
	
	var scale_type: Label = Label.new()
	scale_type.text = "📊 量表类型: " + data.get("scale_type", "")
	scale_type.theme_override_colors.font_color = Color(0.6, 0.65, 0.7, 1)
	scale_type.theme_override_font_sizes.font_size = 12
	document_content.add_child(scale_type)
	
	var separator: HSeparator = HSeparator.new()
	document_content.add_child(separator)
	
	var scores_title: Label = Label.new()
	scores_title.text = "📈 评估项目得分"
	scores_title.theme_override_colors.font_color = Color(0.8, 0.85, 0.9, 1)
	scores_title.theme_override_font_sizes.font_size = 14
	document_content.add_child(scores_title)
	
	var scores: Dictionary = data.get("scores", {})
	for key in scores:
		var score_hbox: HBoxContainer.new()
		score_hbox.theme_override_constants.separation = 10
		document_content.add_child(score_hbox)
		
		var name_label: Label = Label.new()
		name_label.text = "  %s:" % key
		name_label.size_flags_horizontal = 3
		name_label.theme_override_colors.font_color = Color(0.7, 0.75, 0.8, 1)
		name_label.theme_override_font_sizes.font_size = 13
		score_hbox.add_child(name_label)
		
		var score_value: int = scores.get(key, 0)
		var value_label: Label = Label.new()
		value_label.text = str(score_value)
		if score_value >= 5:
			value_label.theme_override_colors.font_color = Color(0.95, 0.5, 0.3, 1)
		elif score_value >= 3:
			value_label.theme_override_colors.font_color = Color(0.95, 0.75, 0.3, 1)
		else:
			value_label.theme_override_colors.font_color = Color(0.3, 0.85, 0.4, 1)
		value_label.theme_override_font_sizes.font_size = 13
		score_hbox.add_child(value_label)
	
	var total_separator: HSeparator = HSeparator.new()
	document_content.add_child(total_separator)
	
	var total_hbox: HBoxContainer.new()
	document_content.add_child(total_hbox)
	
	var total_label: Label = Label.new()
	total_label.text = "总分: %d" % data.get("total_score", 0)
	total_label.theme_override_colors.font_color = Color(0.95, 0.85, 0.3, 1)
	total_label.theme_override_font_sizes.font_size = 18
	total_hbox.add_child(total_label)
	
	var interpretation: Label = Label.new()
	interpretation.text = "\n💡 结果解读: " + data.get("interpretation", "")
	interpretation.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	interpretation.theme_override_colors.font_color = Color(0.8, 0.7, 0.9, 1)
	interpretation.theme_override_font_sizes.font_size = 14
	document_content.add_child(interpretation)
	
	var recommendation: Label = Label.new()
	recommendation.text = "\n✅ 建议: " + data.get("recommendation", "")
	recommendation.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	recommendation.theme_override_colors.font_color = Color(0.7, 0.85, 0.7, 1)
	recommendation.theme_override_font_sizes.font_size = 14
	document_content.add_child(recommendation)

func _on_triage_button_pressed(level: int):
	if not current_patient or not game_manager:
		return
	
	var is_correct: bool = game_manager.triage_patient(current_patient, level)
	_show_triage_result(is_correct, level)
	_remove_patient_card(current_patient.id)
	current_patient = null
	_set_triage_buttons_enabled(false)
	_set_document_tabs_enabled(false)
	no_patient_label.visible = true
	
	for child in patient_detail_vbox.get_children():
		if child != no_patient_label:
			child.queue_free()
	
	for child in document_content.get_children():
		if child != document_placeholder:
			child.queue_free()
	document_placeholder.visible = true

func _show_triage_result(is_correct: bool, level: int):
	var dialog: AcceptDialog = AcceptDialog.new()
	if is_correct:
		dialog.title = "✅ 分级正确"
		dialog.dialog_text = "患者分级为 %s，判断正确！" % Patient.get_triage_level_name(level)
		dialog.add_theme_color_override("font_color", Color(0.3, 0.85, 0.4, 1))
	else:
		dialog.title = "❌ 分级错误"
		var correct_level: int = -1
		if current_patient:
			correct_level = current_patient.correct_triage_level
		dialog.dialog_text = "分级为 %s，但正确分级应为 %s。\n请在复盘中查看详细分析。" % [
			Patient.get_triage_level_name(level),
			Patient.get_triage_level_name(correct_level)
		]
		dialog.add_theme_color_override("font_color", Color(0.95, 0.3, 0.3, 1))
	dialog.add_button("确定", true)
	add_child(dialog)
	dialog.popup_centered()
	dialog.confirmed.connect(dialog.queue_free)
	dialog.canceled.connect(dialog.queue_free)

func _remove_patient_card(patient_id: String):
	if patient_card_cache.has(patient_id):
		var card_data: Dictionary = patient_card_cache[patient_id]
		var card: Panel = card_data.get("card", null)
		if card:
			card.queue_free()
		patient_card_cache.erase(patient_id)

func _on_patient_completed(patient: Patient, is_correct: bool):
	_update_score_display()

func _update_score_display():
	if not game_manager:
		return
	
	var processed: int = game_manager.total_correct + game_manager.total_wrong
	var accuracy: float = 0.0
	if processed > 0:
		accuracy = float(game_manager.total_correct) / float(processed)
	
	score_label.text = "得分: %d" % int(accuracy * 100)
	accuracy_label.text = "正确率: %d%% (%d/%d)" % [
		int(accuracy * 100),
		game_manager.total_correct,
		processed
	]

func _on_insurance_warning(patient: Patient, reason: String):
	_show_warning(reason)

func _show_warning(text: String):
	warning_text.text = text
	warning_panel.visible = true
	
	if warning_tween:
		warning_tween.kill()
	
	warning_tween = create_tween()
	warning_tween.tween_property(warning_panel, "modulate:a", 1.0, 0.3)
	warning_tween.parallel().tween_property(warning_panel, "position:y", -120.0, 0.3)

func _hide_warning():
	if warning_tween:
		warning_tween.kill()
	
	warning_tween = create_tween()
	warning_tween.tween_property(warning_panel, "modulate:a", 0.0, 0.3)
	warning_tween.tween_callback(func(): warning_panel.visible = false)

func _on_level_completed(result: Dictionary):
	_show_result_dialog("🎉 训练通过", result)

func _on_level_failed(reason: String, result: Dictionary):
	_show_result_dialog("😔 训练未通过", result)

func _show_result_dialog(title: String, result: Dictionary):
	var dialog: AcceptDialog = AcceptDialog.new()
	dialog.title = title
	var score: int = result.get("score", 0)
	var accuracy: float = result.get("accuracy", 0.0)
	var correct: int = result.get("correct_count", 0)
	var wrong: int = result.get("wrong_count", 0)
	var rejections: int = result.get("insurance_rejections", 0)
	
	var text: String = "得分: %d分\n正确率: %d%% (%d正确/%d错误)\n医保拒付: %d次\n\n" % [
		score, int(accuracy * 100), correct, wrong, rejections
	]
	
	if result.get("passed", false):
		text += "✅ 恭喜完成本次训练！"
	else:
		text += "❌ 请查看复盘分析错误原因，再次尝试。"
	
	dialog.dialog_text = text
	dialog.add_button("返回主菜单", false, "menu")
	dialog.add_button("查看复盘", false, "review")
	dialog.add_button("重新训练", false, "retry")
	add_child(dialog)
	dialog.popup_centered()
	
	dialog.action.connect(func(action):
		dialog.queue_free()
		match action:
			"menu":
				if scene_manager:
					scene_manager.go_to_main_menu()
			"review":
				if scene_manager:
					scene_manager.go_to_review(result)
			"retry":
				if game_manager and game_manager.current_level:
					_start_level(game_manager.current_level.id)

func _start_level(level_id: String):
	if game_manager:
		game_manager.start_level(level_id)

func _set_triage_buttons_enabled(enabled: bool):
	level1_button.disabled = not enabled
	level2_button.disabled = not enabled
	level3_button.disabled = not enabled
	level4_button.disabled = not enabled

func _set_document_tabs_enabled(enabled: bool):
	nursing_log_tab.disabled = not enabled
	settlement_tab.disabled = not enabled
	assessment_tab.disabled = not enabled

func _on_back_button_pressed():
	if game_manager:
		game_manager.pause_game()
	
	var dialog: ConfirmationDialog = ConfirmationDialog.new()
	dialog.title = "暂停训练"
	dialog.dialog_text = "确定要退出当前训练吗？\n进度将不会保存。"
	dialog.add_button("继续训练", false, "continue")
	dialog.add_button("退出训练", true, "quit")
	add_child(dialog)
	dialog.popup_centered()
	
	dialog.action.connect(func(action):
		dialog.queue_free()
		if action == "quit":
			if game_manager:
				game_manager.cancel_level()
			if scene_manager:
				scene_manager.go_to_main_menu()
		else:
			if game_manager:
				game_manager.resume_game()
