extends Node

var selected_order: WorkOrder = null
var current_quote: Quote = null
var order_cards: Dictionary = {}

@onready var orders_container: VBoxContainer = $MainContent/LeftPanel/OrdersScroll/OrdersContainer
@onready var parts_panel: Control = $MainContent/RightPanel/RightContent/PartsInventoryPanel
@onready var quote_panel: Control = $MainContent/RightPanel/RightContent/QuotePanel
@onready var result_popup: Control = $ResultPopup
@onready var pause_menu: Control = $PauseMenu
@onready var game_over_panel: Control = $GameOverPanel
@onready var tutorial_panel: Control = $TutorialPanel
@onready var score_label: Label = $TopBar/Content/ScoreLabel
@onready var time_label: Label = $TopBar/Content/TimeLabel
@onready var order_count_label: Label = $TopBar/Content/OrderCountLabel
@onready var repair_rate_label: Label = $TopBar/Content/RepairRateLabel
@onready var pause_button: Button = $TopBar/Content/PauseButton
@onready var end_button: Button = $TopBar/Content/EndButton
@onready var parts_tab_button: Button = $MainContent/RightPanel/RightContent/TabContainer/PartsTab
@onready var quote_tab_button: Button = $MainContent/RightPanel/RightContent/TabContainer/QuoteTab

func _ready():
	_setup_connections()
	_start_game()

	if GameManager.current_level and GameManager.current_level.is_tutorial:
		_start_tutorial()

func _setup_connections() -> void:
	pause_button.pressed.connect(_on_pause_pressed)
	end_button.pressed.connect(_on_end_pressed)
	parts_tab_button.pressed.connect(_on_parts_tab_pressed)
	quote_tab_button.pressed.connect(_on_quote_tab_pressed)

	GameManager.work_order_added.connect(_on_work_order_added)
	GameManager.work_order_completed.connect(_on_work_order_completed)
	GameManager.result_shown.connect(_on_result_shown)
	GameManager.game_ended.connect(_on_game_ended)
	GameManager.game_paused.connect(_on_game_paused)
	GameManager.game_resumed.connect(_on_game_resumed)

	TutorialManager.tutorial_completed.connect(_on_tutorial_completed)

	$PauseMenu/PauseContainer/PauseVBox/ResumeButton.pressed.connect(_on_resume_pressed)
	$PauseMenu/PauseContainer/PauseVBox/QuitButton.pressed.connect(_on_quit_pressed)

	$GameOverPanel/GameOverContainer/GameOverVBox/PlayAgainButton.pressed.connect(_on_play_again_pressed)
	$GameOverPanel/GameOverContainer/GameOverVBox/MainMenuButton.pressed.connect(_on_main_menu_pressed)

func _start_game() -> void:
	selected_order = null
	current_quote = null

	for order in GameManager.work_orders.values():
		_add_order_card(order)

	_update_top_bar()
	_refresh_quote_panel()

func _start_tutorial() -> void:
	var instruction_label = tutorial_panel.get_node_or_null("TutorialBg/TutorialContent/InstructionLabel")
	var highlight_root = $MainContent
	if instruction_label and highlight_root:
		TutorialManager.start_tutorial(GameManager.current_level, highlight_root, instruction_label)

func _process(delta: float) -> void:
	if GameManager.game_state == GameManager.GameState.PLAYING:
		GameManager.update_game(delta)
		_update_top_bar()

		if GameManager.is_game_over():
			GameManager.end_game()

func _update_top_bar() -> void:
	score_label.text = "分数: %d" % GameManager.session_score

	var remaining = GameManager.get_remaining_game_time()
	if remaining <= 0:
		time_label.text = "时间: 00:00"
		time_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
	elif remaining < 60:
		var secs = int(remaining)
		time_label.text = "时间: 00:%02d" % secs
		time_label.add_theme_color_override("font_color", Color(1.0, 0.6, 0.3))
	else:
		var mins = int(remaining / 60)
		var secs = int(remaining % 60)
		time_label.text = "时间: %02d:%02d" % [mins, secs]
		time_label.add_theme_color_override("font_color", Color.WHITE)

	var total = GameManager.session_completed_orders + GameManager.session_failed_orders
	order_count_label.text = "工单: %d/%d" % [GameManager.session_completed_orders, total]

	var repair_rate = 0.0
	if GameManager.session_completed_orders > 0:
		repair_rate = float(GameManager.session_repair_orders) / float(GameManager.session_completed_orders)
	repair_rate_label.text = "返修率: %.1f%%" % [repair_rate * 100]

	if repair_rate > 0.3:
		repair_rate_label.add_theme_color_override("font_color", Color(1.0, 0.3, 0.3))
	elif repair_rate > 0.1:
		repair_rate_label.add_theme_color_override("font_color", Color(1.0, 0.7, 0.3))
	else:
		repair_rate_label.add_theme_color_override("font_color", Color(0.5, 1.0, 0.5))

func _add_order_card(p_order: WorkOrder) -> void:
	if order_cards.has(p_order.id):
		return

	var card_scene = preload("res://scenes/ui/work_order_card.tscn")
	if not card_scene:
		return

	var card = card_scene.instantiate()
	card.set_work_order(p_order)
	card.card_clicked.connect(_on_order_card_clicked)
	card.action_triggered.connect(_on_order_action_triggered)

	orders_container.add_child(card)
	order_cards[p_order.id] = card

	if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.LOW):
		card.modulate.a = 0.0
		card.position.y = -20
		var tween = create_tween()
		tween.tween_property(card, "modulate:a", 1.0, 0.3)
		tween.tween_property(card, "position:y", 0.0, 0.3)

func _remove_order_card(p_order_id: String) -> void:
	if order_cards.has(p_order_id):
		var card = order_cards[p_order_id]
		if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.MEDIUM):
			var tween = create_tween()
			tween.tween_property(card, "modulate:a", 0.0, 0.3)
			tween.tween_property(card, "position:x", 100.0, 0.3)
			await tween.finished
		card.queue_free()
		order_cards.erase(p_order_id)

func _on_order_card_clicked(p_order: WorkOrder) -> void:
	for id in order_cards.keys():
		var card = order_cards[id]
		card.set_selected(id == p_order.id)

func _on_order_action_triggered(p_action: String, p_order: WorkOrder) -> void:
	if p_action == "select":
		var order = GameManager.select_work_order(p_order.id)
		if order:
			selected_order = order
			_create_quote_for_order(order)
			_switch_to_quote_tab()
			TutorialManager.check_step_completion("select_order", {"order_id": order.id})

func _create_quote_for_order(p_order: WorkOrder) -> void:
	var availability = GameManager.check_parts_availability(p_order)

	if not availability["all_available"]:
		var missing_names = []
		for part in availability["missing_parts"]:
			missing_names.append(part.name if part.name else part.id)
		_show_missing_parts_warning(missing_names)

	current_quote = GameManager.create_quote(p_order)
	_refresh_quote_panel()

	if not availability["all_available"]:
		_switch_to_parts_tab()
		TutorialManager.check_step_completion("view_parts", {})

func _refresh_quote_panel() -> void:
	if current_quote and quote_panel:
		quote_panel.set_quote(current_quote, selected_order)
		quote_panel.quote_approved.connect(_on_quote_approved)
		quote_panel.quote_rejected.connect(_on_quote_rejected)
		quote_panel.quote_sent.connect(_on_quote_sent)

func _show_missing_parts_warning(p_missing: Array[String]) -> void:
	var warning_text = "以下配件缺货: %s\n请先补货或调整订单。" % ", ".join(p_missing)
	AudioManager.play_warning()

func _on_work_order_added(p_order: WorkOrder) -> void:
	_add_order_card(p_order)

func _on_work_order_completed(p_order: WorkOrder, p_success: bool, p_is_perfect: bool) -> void:
	_remove_order_card(p_order.id)
	selected_order = null
	current_quote = null
	_refresh_quote_panel()

func _on_result_shown(p_result: Dictionary) -> void:
	if result_popup:
		result_popup.show_result(p_result)

func _on_quote_approved(p_quote: Quote) -> void:
	if selected_order:
		var result = GameManager.complete_work_order(selected_order, true, p_quote)
		_play_result_animation(result)
		TutorialManager.check_step_completion("schedule", {})

func _on_quote_rejected(p_quote: Quote) -> void:
	if selected_order:
		selected_order.status = WorkOrder.Status.PENDING
		selected_order = null
		current_quote = null
		_refresh_quote_panel()
		AudioManager.play_failure()

func _on_quote_sent(p_quote: Quote) -> void:
	AudioManager.play_sfx(AudioManager.SFXType.SUCCESS)

func _play_result_animation(p_result: Dictionary) -> void:
	if SettingsManager.should_play_animation(SettingsManager.AnimationIntensity.HIGH):
		if p_result.get("is_perfect", false):
			_create_confetti_effect()

func _create_confetti_effect() -> void:
	for i in range(30):
		var confetti = ColorRect.new()
		confetti.custom_minimum_size = Vector2(8, 8)
		confetti.color = Color.from_hsv(randf(), 0.8, 0.9)
		confetti.position = Vector2(randf_range(400, 880), 200)
		add_child(confetti)

		var tween = create_tween()
		var duration = randf_range(1.0, 2.0)
		tween.tween_property(confetti, "position", Vector2(randf_range(300, 980), 600), duration)
		tween.tween_property(confetti, "rotation", randf_range(-PI, PI), duration)
		tween.tween_property(confetti, "modulate:a", 0.0, 0.3)
		tween.finished.connect(func(): confetti.queue_free())

func _on_pause_pressed() -> void:
	GameManager.pause_game()
	AudioManager.play_click()

func _on_end_pressed() -> void:
	GameManager.end_game()
	AudioManager.play_click()

func _on_game_paused() -> void:
	if pause_menu:
		pause_menu.visible = true
	get_tree().paused = true

func _on_game_resumed() -> void:
	if pause_menu:
		pause_menu.visible = false
	get_tree().paused = false

func _on_game_ended(p_result: Dictionary) -> void:
	_show_game_over(p_result)

func _show_game_over(p_result: Dictionary) -> void:
	if game_over_panel:
		game_over_panel.visible = true

		var stats_grid = game_over_panel.get_node_or_null("GameOverContainer/GameOverVBox/StatsGrid")
	var time_label = game_over_panel.get_node_or_null("GameOverContainer/GameOverVBox/StatsGrid/TimeLabel")
	var score_label = game_over_panel.get_node_or_null("GameOverContainer/GameOverVBox/StatsGrid/ScoreLabel")
	var completed_label = game_over_panel.get_node_or_null("GameOverContainer/GameOverVBox/StatsGrid/CompletedLabel")
	var failed_label = game_over_panel.get_node_or_null("GameOverContainer/GameOverVBox/StatsGrid/FailedLabel")
	var repair_label = game_over_panel.get_node_or_null("GameOverContainer/GameOverVBox/StatsGrid/RepairLabel")
	var repair_rate_label = game_over_panel.get_node_or_null("GameOverContainer/GameOverVBox/StatsGrid/RepairRateLabel")
	var earnings_label = game_over_panel.get_node_or_null("GameOverContainer/GameOverVBox/StatsGrid/EarningsLabel")
	var time_rank_label = game_over_panel.get_node_or_null("GameOverContainer/GameOverVBox/TimeRankLabel")
	var repair_rank_label = game_over_panel.get_node_or_null("GameOverContainer/GameOverVBox/RepairRankLabel")

		if time_label:
			time_label.text = LeaderboardManager.format_time(p_result.get("total_time", 0.0))
		if score_label:
			score_label.text = str(p_result.get("total_score", 0))
		if completed_label:
			completed_label.text = str(p_result.get("completed_orders", 0))
		if failed_label:
			failed_label.text = str(p_result.get("failed_orders", 0))
		if repair_label:
			repair_label.text = str(p_result.get("repair_orders", 0))
		if repair_rate_label:
			repair_rate_label.text = LeaderboardManager.format_repair_rate(p_result.get("repair_rate", 0.0))
		if earnings_label:
			earnings_label.text = "¥%.2f" % p_result.get("total_earnings", 0.0)

		var is_training = p_result.get("is_training_mode", false)
		var level_id = p_result.get("level_id", 0)
		var time_rank = LeaderboardManager.get_time_rank(p_result.get("total_time", 0.0), is_training, level_id)
		var repair_rank = LeaderboardManager.get_repair_rank(p_result.get("repair_rate", 0.0), is_training, level_id)

		if time_rank_label:
			time_rank_label.text = "#%d (最快完成榜)" % time_rank
		if repair_rank_label:
			repair_rank_label.text = "#%d (最低返修榜)" % repair_rank

		get_tree().paused = true

func _on_resume_pressed() -> void:
	GameManager.resume_game()
	AudioManager.play_click()

func _on_quit_pressed() -> void:
	get_tree().paused = false
	GameManager.go_to_main_menu()
	AudioManager.play_click()

func _on_play_again_pressed() -> void:
	get_tree().paused = false
	GameManager.start_game(GameManager.game_mode, GameManager.current_level)
	get_tree().reload_current_scene()
	AudioManager.play_click()

func _on_main_menu_pressed() -> void:
	get_tree().paused = false
	GameManager.go_to_main_menu()
	AudioManager.play_click()

func _on_parts_tab_pressed() -> void:
	parts_panel.visible = true
	quote_panel.visible = false
	parts_tab_button.disabled = true
	quote_tab_button.disabled = false
	AudioManager.play_click()
	TutorialManager.check_step_completion("view_parts", {})

func _on_quote_tab_pressed() -> void:
	parts_panel.visible = false
	quote_panel.visible = true
	parts_tab_button.disabled = false
	quote_tab_button.disabled = true
	AudioManager.play_click()

func _switch_to_parts_tab() -> void:
	_on_parts_tab_pressed()

func _switch_to_quote_tab() -> void:
	_on_quote_tab_pressed()

func _on_tutorial_completed() -> void:
	pass
