extends Control

signal decision_made(result: Dictionary)

@onready var order_progress_label: Label = $TopBar/ProgressLabel
@onready var score_label: Label = $TopBar/ScoreLabel
@onready var timer_label: Label = $TopBar/TimerLabel
@onready var ticket_type_label: Label = $CenterPanel/VBox/HeaderContainer/TicketTypeLabel
@onready var order_id_label: Label = $CenterPanel/VBox/HeaderContainer/OrderIdLabel
@onready var clue_text: RichTextLabel = $CenterPanel/VBox/ClueContainer/ClueText
@onready var info_grid: GridContainer = $CenterPanel/VBox/InfoGrid
@onready var hint_label: Label = $CenterPanel/VBox/HintLabel
@onready var pass_btn: Button = $BottomContainer/ButtonRow/PassButton
@onready var reject_btn: Button = $BottomContainer/ButtonRow/RejectButton
@onready var upgrade_btn: Button = $BottomContainer/ButtonRow/UpgradeButton
@onready var feedback_label: Label = $CenterPanel/VBox/FeedbackLabel
@onready var intro_panel: PanelContainer = $IntroPanel
@onready var intro_text: RichTextLabel = $IntroPanel/VBoxContainer/IntroText
@onready var start_btn: Button = $IntroPanel/VBoxContainer/StartButton
@onready var hint_buttons: HBoxContainer = $CenterPanel/VBox/HintButtons
@onready var show_rules_btn: Button = $CenterPanel/VBox/HintButtons/ShowRulesBtn
@onready var rules_popup: PanelContainer = $RulesPopup
@onready var rules_text: RichTextLabel = $RulesPopup/VBoxContainer/RulesText
@onready var close_rules_btn: Button = $RulesPopup/VBoxContainer/CloseRulesBtn
@onready var bg_texture: TextureRect = $BackgroundAsset
@onready var bgm_player: AudioStreamPlayer = $BgmPlayer
@onready var sfx_correct_player: AudioStreamPlayer = $SfxCorrectPlayer
@onready var sfx_wrong_player: AudioStreamPlayer = $SfxWrongPlayer
@onready var sfx_dispute_player: AudioStreamPlayer = $SfxDisputePlayer

var level_data: Dictionary = {}
var orders: Array = []
var current_order_index: int = 0
var current_order: Dictionary = {}
var time_remaining: float = 0.0
var timer_active: bool = false
var showing_intro: bool = true
var awaiting_next: bool = false

func _ready() -> void:
	pass_btn.pressed.connect(func(): _make_decision("pass"))
	reject_btn.pressed.connect(func(): _make_decision("reject"))
	upgrade_btn.pressed.connect(func(): _make_decision("upgrade"))
	start_btn.pressed.connect(_start_game)
	show_rules_btn.pressed.connect(_show_rules)
	close_rules_btn.pressed.connect(_hide_rules)
	rules_popup.visible = false

	_setup_level()

func _setup_level() -> void:
	level_data = GameManager.current_level
	orders = GameManager.current_orders
	time_remaining = float(level_data.get("time_limit_seconds", 180))
	current_order_index = 0
	ScoreManager.reset_session()

	_load_level_assets()

	intro_text.text = "[b]%s[/b]\n\n%s" % [level_data.get("name", ""), level_data.get("intro_text", "")]
	var hints: Array = level_data.get("tutorial_hints", [])
	if hints.size() > 0:
		intro_text.text += "\n\n[color=#90caf9]💡 提示要点：[/color]\n"
		for h in hints:
			intro_text.text += "  • %s\n" % h

	intro_panel.visible = true
	showing_intro = true

func _load_level_assets() -> void:
	var bg_path: String = DataLoader.get_level_asset(level_data, "background")
	if bg_path != "":
		var tex: Texture2D = DataLoader.load_texture(bg_path)
		if tex:
			bg_texture.texture = tex
			bg_texture.visible = true

	var bgm_path: String = DataLoader.get_level_asset(level_data, "bgm")
	if bgm_path != "":
		var stream: AudioStream = DataLoader.load_audio_stream(bgm_path)
		if stream:
			bgm_player.stream = stream
			bgm_player.play()

func _start_game() -> void:
	intro_panel.visible = false
	showing_intro = false
	timer_active = true
	_show_current_order()
	ScoreManager.start_order_timer()

func _process(delta: float) -> void:
	if timer_active and not showing_intro:
		time_remaining -= delta
		if time_remaining <= 0:
			time_remaining = 0
			timer_active = false
			_end_session()
		_update_timer_display()

func _update_timer_display() -> void:
	var minutes: int = int(time_remaining) / 60
	var seconds: int = int(time_remaining) % 60
	timer_label.text = "⏱ %02d:%02d" % [minutes, seconds]
	if time_remaining < 30:
		timer_label.add_theme_color_override("font_color", Color(1, 0.3, 0.3, 1))
	else:
		timer_label.add_theme_color_override("font_color", Color(1, 1, 1, 1))

func _show_current_order() -> void:
	if current_order_index >= orders.size():
		_end_session()
		return

	current_order = orders[current_order_index]
	var ticket_type: Dictionary = DataLoader.get_ticket_type_by_id(current_order.get("ticket_type_id", ""))

	order_progress_label.text = "📋 订单进度: %d / %d" % [current_order_index + 1, orders.size()]
	score_label.text = "💰 得分: %d" % ScoreManager.current_score

	ticket_type_label.text = "🎟 %s" % ticket_type.get("name", "未知票种")
	order_id_label.text = "订单号: %s" % current_order.get("order_id", "")

	clue_text.text = "[b]🎤 现场线索：[/b]\n%s" % current_order.get("clue_description", "")

	_build_info_grid(current_order, ticket_type)
	feedback_label.text = ""
	_set_buttons_enabled(true)
	awaiting_next = false

func _build_info_grid(order: Dictionary, ticket_type: Dictionary) -> void:
	for child in info_grid.get_children():
		child.queue_free()

	var info_items: Array = [
		["👤 姓名", order.get("buyer_name", "未知")],
		["🎂 年龄", "%d 岁" % order.get("buyer_age", 0)],
		["📅 购票日期", order.get("purchase_date", "")],
		["📆 到访星期", _weekday_cn(order.get("visit_date_weekday", ""))],
		["⏰ 到场时间", order.get("arrival_time", "")],
		["🪪 身份证核验", "✅ 已验证" if order.get("id_verified", false) else "❌ 未验证"],
		["🔢 证件号匹配", "✅ 一致" if order.get("id_number_match", true) else "❌ 不一致"]
	]

	if ticket_type.get("rules", {}).get("student_id_required", false):
		var has_id: bool = order.get("has_student_id", false)
		var valid: bool = order.get("student_id_valid", false)
		var stu_text: String = "✅ 有效" if (has_id and valid) else ("⚠️ 已出示但无效" if has_id else "❌ 未出示")
		info_items.append(["🎓 学生证", stu_text])

	if order.get("ticket_type_id", "") == "group_ticket":
		info_items.append(["👥 是否领队", "✅ 是" if order.get("is_group_leader", false) else "❌ 否"])
		info_items.append(["👥 团体人数", "%d 人" % order.get("group_member_count", 1)])

	for item in info_items:
		var key_label: Label = Label.new()
		key_label.text = item[0]
		key_label.add_theme_font_size_override("font_size", 16)
		key_label.add_theme_color_override("font_color", Color(0.7, 0.85, 1.0, 1))
		info_grid.add_child(key_label)

		var val_label: Label = Label.new()
		val_label.text = str(item[1])
		val_label.add_theme_font_size_override("font_size", 16)
		info_grid.add_child(val_label)

func _weekday_cn(wd: String) -> String:
	var map: Dictionary = {
		"mon": "周一", "tue": "周二", "wed": "周三", "thu": "周四",
		"fri": "周五", "sat": "周六", "sun": "周日"
	}
	return map.get(wd, wd)

func _set_buttons_enabled(enabled: bool) -> void:
	pass_btn.disabled = not enabled
	reject_btn.disabled = not enabled
	upgrade_btn.disabled = not enabled

func _make_decision(decision: String) -> void:
	if awaiting_next:
		_next_order()
		return

	var result: Dictionary = ScoreManager.process_decision(current_order, decision)
	_set_buttons_enabled(false)

	if result["score_change"] > 0:
		feedback_label.text = "✅ 正确！  +%d 分" % result["score_change"]
		feedback_label.add_theme_color_override("font_color", Color(0.4, 1, 0.4, 1))
		_play_sfx("sfx_correct")
	else:
		var msg: String = "❌ 错误！ %d 分" % result["score_change"]
		if result.get("wrong_reason", "") != "":
			msg += "\n原因: %s" % result["wrong_reason"]
		if result.get("dispute_triggered", false):
			msg += "\n⚠️  触发退票争议！额外 -25 分"
			_play_sfx("sfx_dispute")
		else:
			_play_sfx("sfx_wrong")
		feedback_label.text = msg
		feedback_label.add_theme_color_override("font_color", Color(1, 0.4, 0.4, 1))

	score_label.text = "💰 得分: %d" % ScoreManager.current_score

	awaiting_next = true
	pass_btn.text = "⏭ 下一位"
	reject_btn.visible = false
	upgrade_btn.visible = false
	pass_btn.disabled = false

func _play_sfx(key: String) -> void:
	var sfx_path: String = DataLoader.get_level_asset(level_data, key)
	if sfx_path == "":
		return
	var stream: AudioStream = DataLoader.load_audio_stream(sfx_path)
	if stream:
		var player: AudioStreamPlayer = sfx_correct_player
		match key:
			"sfx_wrong":
				player = sfx_wrong_player
			"sfx_dispute":
				player = sfx_dispute_player
		player.stream = stream
		player.play()

func _next_order() -> void:
	pass_btn.text = "✅ 放行通过"
	reject_btn.visible = true
	upgrade_btn.visible = true
	reject_btn.text = "❌ 拒绝入场"
	upgrade_btn.text = "⚠️ 升级处理"

	current_order_index += 1
	if current_order_index >= orders.size():
		_end_session()
	else:
		_show_current_order()
		ScoreManager.start_order_timer()

func _show_rules() -> void:
	var ticket_type: Dictionary = DataLoader.get_ticket_type_by_id(current_order.get("ticket_type_id", ""))
	var rules: Dictionary = ticket_type.get("rules", {})
	var text: String = "[b]📋 %s - 核销规则[/b]\n\n" % ticket_type.get("name", "")
	text += "📝 %s\n\n" % ticket_type.get("description", "")

	text += "[color=#90caf9]基本规则：[/color]\n"
	text += "  • 年龄范围: %d - %d 岁\n" % [rules.get("age_min", 0), rules.get("age_max", 99)]
	text += "  • 身份证核验: %s\n" % ("需要" if rules.get("identity_required", false) else "无需")
	if rules.get("student_id_required", false):
		text += "  • 学生证: 必须出示有效证件\n"
	if rules.get("group_leader_required", false):
		text += "  • 团体票: 需由领队统一核销\n"
	if rules.get("fast_track", false):
		text += "  • VIP通道: 可快速入场\n"

	var valid_days: Array = rules.get("valid_days", [])
	var days_cn: Array = []
	for d in valid_days:
		days_cn.append(_weekday_cn(d))
	text += "  • 有效日期: %s\n" % ", ".join(days_cn)
	text += "  • 入场时段: %s - %s\n" % [rules.get("time_start", ""), rules.get("time_end", "")]
	text += "  • 可退票: %s\n" % ("是" if rules.get("refundable", true) else "否")

	rules_text.text = text
	rules_popup.visible = true

func _hide_rules() -> void:
	rules_popup.visible = false

func _end_session() -> void:
	timer_active = false
	var result: Dictionary = ScoreManager.finalize_session()
	GameManager.go_to_results(result)
