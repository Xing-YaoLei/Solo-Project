extends Control

const MAX_SLOTS: int = 3
const ANOMALY_CHECK_INTERVAL: float = 15.0
const GAME_DURATION: float = 180.0
const TARGET_PROJECTS: int = 10

var game_timer: float = 0.0
var customer_spawn_timer: float = 0.0
var anomaly_check_timer: float = 0.0
var is_running: bool = false

var active_projects: Array = []
var project_slots: Array = []
var customer_nodes: Dictionary = {}
var recharge_nodes: Array = []

var warning_visible: bool = false
var warning_timer: float = 0.0
var warning_flash_timer: float = 0.0
var current_warning_supply: String = ""

var active_buffs: Dictionary = {}

var dragged_recharge: Dictionary = {}
var is_dragging_recharge: bool = false
var drag_start_pos: Vector2 = Vector2.ZERO
var drag_original_parent: Node = null

var anomaly_handler_count: int = 0

@onready var timer_label: Label = $TopBar/HBoxContainer/TimerLabel
@onready var score_label: Label = $TopBar/HBoxContainer/ScoreLabel
@onready var combo_label: Label = $TopBar/HBoxContainer/ComboLabel
@onready var level_label: Label = $TopBar/HBoxContainer/LevelLabel
@onready var pause_button: Button = $TopBar/HBoxContainer/PauseButton

@onready var customer_container: VBoxContainer = $LeftPanel/LeftVBox/CustomerList/CustomerContainer
@onready var recharge_container: VBoxContainer = $RightPanel/RightVBox/RechargeList/RechargeContainer

@onready var project_slot1: PanelContainer = $CenterArea/ProjectSlots/Slot1
@onready var project_slot2: PanelContainer = $CenterArea/ProjectSlots/Slot2
@onready var project_slot3: PanelContainer = $CenterArea/ProjectSlots/Slot3

@onready var review_tags_container: HBoxContainer = $CenterArea/ReviewArea/ReviewVBox/ReviewTagsContainer

@onready var shampoo_bar: ProgressBar = $RightPanel/RightVBox/SupplyList/ShampooRow/ShampooBar
@onready var conditioner_bar: ProgressBar = $RightPanel/RightVBox/SupplyList/ConditionerRow/ConditionerBar
@onready var hair_color_bar: ProgressBar = $RightPanel/RightVBox/SupplyList/HairColorRow/HairColorBar
@onready var perm_bar: ProgressBar = $RightPanel/RightVBox/SupplyList/PermRow/PermBar

@onready var item_speed_boost: Button = $RightPanel/RightVBox/ItemsContainer/ItemSpeedBoost
@onready var item_supply_refill: Button = $RightPanel/RightVBox/ItemsContainer/ItemSupplyRefill
@onready var item_charm: Button = $RightPanel/RightVBox/ItemsContainer/ItemCharm
@onready var item_time_freeze: Button = $RightPanel/RightVBox/ItemsContainer/ItemTimeFreeze

@onready var warning_overlay: CanvasLayer = $WarningOverlay
@onready var warning_flash: ColorRect = $WarningOverlay/WarningFlash
@onready var warning_label: Label = $WarningOverlay/WarningLabel

@onready var pause_panel: PanelContainer = $PausePanel
@onready var resume_button: Button = $PausePanel/PauseVBox/ResumeButton
@onready var quit_button: Button = $PausePanel/PauseVBox/QuitButton

func _ready() -> void:
	_setup_signals()
	_setup_slots()
	_init_game()

func _setup_signals() -> void:
	pause_button.pressed.connect(_on_pause_pressed)
	resume_button.pressed.connect(_on_resume_pressed)
	quit_button.pressed.connect(_on_quit_pressed)
	
	item_speed_boost.pressed.connect(func (): _use_item("speed_boost"))
	item_supply_refill.pressed.connect(func (): _use_item("supply_refill"))
	item_charm.pressed.connect(func (): _use_item("charm"))
	item_time_freeze.pressed.connect(func (): _use_item("time_freeze"))
	
	EventBus.supply_anomaly_warning.connect(_on_supply_anomaly_warning)
	EventBus.supply_anomaly_triggered.connect(_on_supply_anomaly_triggered)
	EventBus.game_ended.connect(_on_game_ended)

func _setup_slots() -> void:
	project_slots = [project_slot1, project_slot2, project_slot3]
	for i in range(MAX_SLOTS):
		project_slots[i].set_meta("slot_index", i)

func _init_game() -> void:
	is_running = true
	game_timer = 0.0
	customer_spawn_timer = 2.0
	anomaly_check_timer = ANOMALY_CHECK_INTERVAL
	active_projects.clear()
	active_buffs.clear()
	anomaly_handler_count = 0
	
	GameState.start_game(GameState.current_difficulty)
	_spawn_initial_customers()
	_spawn_initial_recharges()
	_update_ui()

func _spawn_initial_customers() -> void:
	for i in range(2):
		_spawn_customer()

func _spawn_initial_recharges() -> void:
	for i in range(3):
		_add_recharge_card()

func _process(delta: float) -> void:
	if not is_running or GameState.current_state != GameState.State.PLAYING:
		return
	
	var time_scale = 1.0
	if active_buffs.get("time_freeze", 0) > 0:
		time_scale = 0.3
	if active_buffs.get("speed_boost", 0) > 0:
		time_scale *= 1.5
	
	var adjusted_delta = delta * time_scale
	
	game_timer += adjusted_delta
	GameState.elapsed_time = game_timer
	
	_update_timer()
	_update_customer_spawn(adjusted_delta)
	_update_anomaly_check(adjusted_delta)
	_update_projects(adjusted_delta)
	_update_customers(adjusted_delta)
	_update_buffs(delta)
	_update_item_cooldowns(delta)
	_update_warning(delta)
	_check_game_end()

func _update_timer() -> void:
	var remaining = max(0, GAME_DURATION - game_timer)
	var minutes = int(remaining) / 60
	var seconds = int(remaining) % 60
	var target = TARGET_PROJECTS
	var completed = GameState.projects_completed
	timer_label.text = "⏱ %02d:%02d  项目:%d/%d" % [minutes, seconds, completed, target]

func _update_customer_spawn(delta: float) -> void:
	customer_spawn_timer -= delta
	if customer_spawn_timer <= 0:
		_spawn_customer()
		var interval = DifficultyConfig.get_customer_spawn_interval()
		customer_spawn_timer = interval + randf_range(-1.0, 1.0)

func _spawn_customer() -> void:
	if GameState.customer_queue.size() >= 8:
		return
	
	var customer_types = _get_available_customer_types()
	var type = customer_types[randi() % customer_types.size()]
	var customer = CustomerData.new(type)
	customer.patience *= DifficultyConfig.get_project_time_multiplier()
	customer.max_patience = customer.patience
	
	GameState.add_customer(customer.to_dict())
	_create_customer_node(customer)
	ReplayManager.record_customer_action("spawn", customer.to_dict())

func _get_available_customer_types() -> Array:
	var level_data = DifficultyConfig.get_level_data(GameState.current_level)
	return level_data.get("customer_types", ["wash_cut"])

func _create_customer_node(customer: CustomerData) -> void:
	var panel = PanelContainer.new()
	panel.custom_minimum_size = Vector2(280, 70)
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	
	var hbox = HBoxContainer.new()
	hbox.theme_override_constants.separation = 10
	hbox.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	var avatar_label = Label.new()
	avatar_label.text = customer.avatar
	avatar_label.theme_override_font_sizes.font_size = 28
	avatar_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	var info_vbox = VBoxContainer.new()
	info_vbox.size_flags_horizontal = 3
	info_vbox.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	var name_label = Label.new()
	name_label.text = customer.name
	name_label.theme_override_colors.font_color = Color(0.3, 0.25, 0.2, 1)
	name_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	var project_label = Label.new()
	project_label.text = customer.wanted_projects[0] if customer.wanted_projects.size() > 0 else ""
	project_label.theme_override_colors.font_color = Color(0.5, 0.4, 0.35, 1)
	project_label.theme_override_font_sizes.font_size = 12
	project_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	var patience_bar = ProgressBar.new()
	patience_bar.value = customer.get_patience_percent() * 100
	patience_bar.custom_minimum_size = Vector2(0, 8)
	patience_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	info_vbox.add_child(name_label)
	info_vbox.add_child(project_label)
	info_vbox.add_child(patience_bar)
	
	hbox.add_child(avatar_label)
	hbox.add_child(info_vbox)
	panel.add_child(hbox)
	
	panel.set_meta("customer_id", customer.id)
	panel.set_meta("customer_data", customer.to_dict())
	panel.gui_input.connect(func (event): _on_customer_gui_input(event, customer.id))
	
	customer_container.add_child(panel)
	customer_nodes[customer.id] = {
		"panel": panel,
		"patience_bar": patience_bar,
		"customer": customer
	}

func _on_customer_gui_input(event: InputEvent, customer_id: String) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if is_dragging_recharge:
			_apply_recharge_to_customer(customer_id)
		else:
			_start_project_for_customer(customer_id)
		GameState.register_action()
		ReplayManager.record_customer_action("click", {"id": customer_id})

func _apply_recharge_to_customer(customer_id: String) -> void:
	if customer_id in customer_nodes and not dragged_recharge.is_empty():
		var customer_data = customer_nodes[customer_id]
		var customer: CustomerData = customer_data["customer"]
		var amount = dragged_recharge.get("amount", 0)
		customer.add_recharge(amount)
		customer.patience = min(customer.max_patience, customer.patience + 20)
		customer.satisfaction = min(100, customer.satisfaction + 15)
		
		GameState.add_score(int(amount * 0.1))
		_update_customer_display(customer_id)
		
		EventBus.emit_recharge_completed(dragged_recharge)
		ReplayManager.record_recharge_action("used", {
			"recharge": dragged_recharge,
			"customer_id": customer_id
		})
		
		_remove_dragged_recharge()
		is_dragging_recharge = false
		dragged_recharge = {}

func _update_customer_display(customer_id: String) -> void:
	if customer_id in customer_nodes:
		var data = customer_nodes[customer_id]
		var customer: CustomerData = data["customer"]
		var patience_bar: ProgressBar = data["patience_bar"]
		patience_bar.value = customer.get_patience_percent() * 100

func _start_project_for_customer(customer_id: String) -> void:
	var customer_data = customer_nodes.get(customer_id, {})
	if customer_data.is_empty():
		return
	
	var customer = customer_data["customer"]
	var slot_index = _find_empty_slot()
	if slot_index < 0:
		return
	
	var project_type = customer.wanted_projects[0] if customer.wanted_projects.size() > 0 else "洗剪吹"
	var project = ProjectCard.new(project_type, project_type)
	project.customer_id = customer_id
	project.start()
	
	if not project.check_supplies():
		project.fail("耗材不足")
		GameState.reset_combo()
		ReplayManager.set_failed_project(project.to_dict(), "耗材不足")
		return
	
	project.consume_supplies()
	active_projects.append(project)
	_setup_project_in_slot(project, slot_index)
	
	EventBus.emit_project_started(project.to_dict())
	ReplayManager.record_project_action("start", project.to_dict())
	
	_remove_customer(customer_id)
	GameState.remove_customer(customer_id)
	GameState.customers_served += 1

func _find_empty_slot() -> int:
	for i in range(MAX_SLOTS):
		var has_project = false
		for project in active_projects:
			if project.get_meta("slot_index", -1) == i:
				has_project = true
				break
		if not has_project:
			return i
	return -1

func _setup_project_in_slot(project: ProjectCard, slot_index: int) -> void:
	project.set_meta("slot_index", slot_index)
	var slot = project_slots[slot_index]
	
	for child in slot.get_children():
		if child.name != "SlotContent":
			child.queue_free()
	
	var vbox = VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER
	vbox.theme_override_constants.separation = 6
	
	var name_label = Label.new()
	name_label.text = project.name
	name_label.theme_override_colors.font_color = Color(0.3, 0.25, 0.2, 1)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	
	var progress_bar = ProgressBar.new()
	progress_bar.value = 0
	progress_bar.custom_minimum_size = Vector2(140, 12)
	
	var time_label = Label.new()
	time_label.text = "%.1fs" % project.remaining_time
	time_label.theme_override_font_sizes.font_size = 12
	time_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	
	vbox.add_child(name_label)
	vbox.add_child(progress_bar)
	vbox.add_child(time_label)
	
	var slot_content = slot.get_node_or_null("SlotContent")
	if slot_content:
		slot_content.visible = false
	slot.add_child(vbox)
	
	project.set_meta("progress_bar", progress_bar)
	project.set_meta("time_label", time_label)
	project.set_meta("vbox", vbox)

func _update_projects(delta: float) -> void:
	var to_remove = []
	
	for project in active_projects:
		project.update(delta)
		
		var progress_bar = project.get_meta("progress_bar", null)
		var time_label = project.get_meta("time_label", null)
		
		if progress_bar:
			progress_bar.value = project.progress * 100
		if time_label:
			time_label.text = "%.1fs" % max(0, project.remaining_time)
		
		if project.is_completed:
			_on_project_completed(project)
			to_remove.append(project)
		elif project.is_failed:
			_on_project_failed(project)
			to_remove.append(project)
	
	for project in to_remove:
		active_projects.erase(project)
		_clear_project_slot(project)

func _on_project_completed(project: ProjectCard) -> void:
	var score = project.get_score_with_combo(GameState.combo)
	GameState.add_score(score)
	GameState.add_combo()
	GameState.projects_completed += 1
	
	_update_review_tags(project.customer_id)
	_check_achievements()
	_update_ui()
	ReplayManager.record_project_action("complete", {"id": project.id, "score": score})
	
	if GameState.projects_completed >= TARGET_PROJECTS:
		_end_game(true)

func _on_project_failed(project: ProjectCard) -> void:
	GameState.reset_combo()
	GameState.projects_failed += 1
	ReplayManager.set_failed_project(project.to_dict(), project.fail_reason)
	ReplayManager.record_project_action("fail", {"id": project.id, "reason": project.fail_reason})
	_update_ui()

func _clear_project_slot(project: ProjectCard) -> void:
	var slot_index = project.get_meta("slot_index", -1)
	if slot_index >= 0 and slot_index < project_slots.size():
		var slot = project_slots[slot_index]
		var vbox = project.get_meta("vbox", null)
		if vbox and vbox.is_inside_tree():
			vbox.queue_free()
		var slot_content = slot.get_node_or_null("SlotContent")
		if slot_content:
			slot_content.visible = true

func _update_customers(delta: float) -> void:
	var to_remove = []
	
	for customer_id in customer_nodes.keys():
		var data = customer_nodes[customer_id]
		var customer: CustomerData = data["customer"]
		var patience_bar: ProgressBar = data["patience_bar"]
		
		customer.update_patience(delta)
		patience_bar.value = customer.get_patience_percent() * 100
		
		if customer.get_patience_percent() < 0.3:
			patience_bar.modulate = Color(1, 0.5, 0.5, 1)
		elif customer.get_patience_percent() < 0.6:
			patience_bar.modulate = Color(1, 1, 0.5, 1)
		else:
			patience_bar.modulate = Color(1, 1, 1, 1)
		
		if not customer.is_patient():
			to_remove.append(customer_id)
			GameState.reset_combo()
			GameState.projects_failed += 1
			ReplayManager.record_customer_action("leave", {"id": customer_id, "reason": "patience"})
	
	for customer_id in to_remove:
		_remove_customer(customer_id)
		GameState.remove_customer(customer_id)

func _remove_customer(customer_id: String) -> void:
	if customer_id in customer_nodes:
		var panel = customer_nodes[customer_id]["panel"]
		if panel and panel.is_inside_tree():
			panel.queue_free()
		customer_nodes.erase(customer_id)

func _update_review_tags(customer_id: String) -> void:
	var tags = ["满意", "开心", "专业", "效率高", "服务好", "技术棒", "环境好"]
	var selected_tags = []
	var num_tags = randi_range(1, 3)
	for i in range(num_tags):
		var tag = tags[randi() % tags.size()]
		if not tag in selected_tags:
			selected_tags.append(tag)
	
	if customer_id in GameState.review_tags:
		GameState.review_tags[customer_id].append_array(selected_tags)
	else:
		GameState.review_tags[customer_id] = selected_tags
	
	EventBus.review_updated.emit(customer_id, selected_tags)
	_refresh_review_tags_display(selected_tags)

func _refresh_review_tags_display(tags: Array) -> void:
	for child in review_tags_container.get_children():
		child.queue_free()
	
	for tag in tags:
		var tag_label = Label.new()
		tag_label.text = tag
		tag_label.add_theme_stylebox_override("normal", _create_tag_stylebox())
		tag_label.theme_override_colors.font_color = Color(0.9, 0.5, 0.3, 1)
		tag_label.theme_override_font_sizes.font_size = 12
		review_tags_container.add_child(tag_label)

func _create_tag_stylebox() -> StyleBoxFlat:
	var stylebox = StyleBoxFlat.new()
	stylebox.bg_color = Color(1, 0.95, 0.85, 1)
	stylebox.corner_radius_top_left = 8
	stylebox.corner_radius_top_right = 8
	stylebox.corner_radius_bottom_left = 8
	stylebox.corner_radius_bottom_right = 8
	stylebox.content_margin_left = 8
	stylebox.content_margin_right = 8
	stylebox.content_margin_top = 4
	stylebox.content_margin_bottom = 4
	return stylebox

func _add_recharge_card() -> void:
	var recharge = RechargeRecord.generate_random()
	
	var panel = PanelContainer.new()
	panel.custom_minimum_size = Vector2(260, 50)
	panel.mouse_filter = Control.MOUSE_FILTER_STOP
	
	var hbox = HBoxContainer.new()
	hbox.theme_override_constants.separation = 8
	hbox.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	var icon_label = Label.new()
	icon_label.text = "💳"
	icon_label.theme_override_font_sizes.font_size = 20
	icon_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	var info_vbox = VBoxContainer.new()
	info_vbox.size_flags_horizontal = 3
	info_vbox.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	var name_label = Label.new()
	name_label.text = recharge.customer_name
	name_label.theme_override_colors.font_color = Color(0.3, 0.25, 0.2, 1)
	name_label.theme_override_font_sizes.font_size = 12
	name_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	var amount_label = Label.new()
	amount_label.text = "¥%.0f (+%.0f)" % [recharge.amount, recharge.get_bonus_amount()]
	amount_label.theme_override_colors.font_color = Color(0.8, 0.4, 0.2, 1)
	amount_label.theme_override_font_sizes.font_size = 11
	amount_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	
	info_vbox.add_child(name_label)
	info_vbox.add_child(amount_label)
	
	hbox.add_child(icon_label)
	hbox.add_child(info_vbox)
	panel.add_child(hbox)
	
	panel.set_meta("recharge_data", recharge.to_dict())
	panel.set_meta("is_recharge_card", true)
	panel.set_meta("original_recharge", recharge)
	panel.gui_input.connect(func (event): _on_recharge_gui_input(event, panel))
	
	recharge_container.add_child(panel)
	recharge_nodes.append(panel)

func _on_recharge_gui_input(event: InputEvent, panel: PanelContainer) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		is_dragging_recharge = true
		dragged_recharge = panel.get_meta("recharge_data", {})
		drag_start_pos = panel.position
		drag_original_parent = panel.get_parent()
		panel.modulate = Color(1, 1, 1, 0.7)
		GameState.register_action()
		
		var mouse_pos = get_global_mouse_position()
		panel.reparent(self)
		panel.global_position = mouse_pos - panel.size / 2
		
	elif event is InputEventMouseButton and not event.pressed and event.button_index == MOUSE_BUTTON_LEFT and is_dragging_recharge:
		is_dragging_recharge = false
		panel.modulate = Color(1, 1, 1, 1)
		_check_recharge_drop(panel)
		
	elif event is InputEventMouseMotion and is_dragging_recharge:
		var mouse_pos = get_global_mouse_position()
		panel.global_position = mouse_pos - panel.size / 2

func _check_recharge_drop(panel: PanelContainer) -> void:
	var mouse_pos = get_global_mouse_position()
	var dropped_on_customer = false
	
	for customer_id in customer_nodes.keys():
		var data = customer_nodes[customer_id]
		var customer_panel: PanelContainer = data["panel"]
		var rect = Rect2(customer_panel.global_position, customer_panel.size)
		if rect.has_point(mouse_pos):
			_apply_recharge_to_customer(customer_id)
			_remove_recharge_panel(panel)
			dropped_on_customer = true
			break
	
	if not dropped_on_customer:
		panel.reparent(recharge_container)
		panel.position = drag_start_pos

func _remove_recharge_panel(panel: PanelContainer) -> void:
	if panel in recharge_nodes:
		recharge_nodes.erase(panel)
	if panel and panel.is_inside_tree():
		panel.queue_free()
	
	if recharge_nodes.size() < 3:
		call_deferred("_add_recharge_card")

func _remove_dragged_recharge() -> void:
	for panel in recharge_nodes:
		var data = panel.get_meta("recharge_data", {})
		if data.get("id", "") == dragged_recharge.get("id", ""):
			_remove_recharge_panel(panel)
			break

func _update_anomaly_check(delta: float) -> void:
	anomaly_check_timer -= delta
	if anomaly_check_timer <= 0:
		anomaly_check_timer = ANOMALY_CHECK_INTERVAL
		if not warning_visible and randf() < DifficultyConfig.get_anomaly_chance():
			_trigger_supply_anomaly_warning()

func _trigger_supply_anomaly_warning() -> void:
	var supply_types = ["shampoo", "conditioner", "hair_color", "perm_solution"]
	var supply_type = supply_types[randi() % supply_types.size()]
	current_warning_supply = supply_type
	var warning_time = DifficultyConfig.get_anomaly_warning_time()
	
	GameState.supply_warnings[supply_type] = warning_time
	EventBus.emit_supply_anomaly_warning(supply_type, warning_time)
	_show_warning(supply_type, warning_time)

func _show_warning(supply_type: String, duration: float) -> void:
	warning_visible = true
	warning_timer = duration
	warning_flash_timer = 0.5
	warning_overlay.visible = true
	
	var supply_names = {
		"shampoo": "洗发水",
		"conditioner": "护发素",
		"hair_color": "染发剂",
		"perm_solution": "烫发液"
	}
	var name = supply_names.get(supply_type, "耗材")
	warning_label.text = "⚠️ %s即将异常！%.0f秒内点击警告解除！" % [name, duration]

func _update_warning(delta: float) -> void:
	if not warning_visible:
		return
	
	warning_timer -= delta
	if warning_timer <= 0:
		_trigger_anomaly()
		return
	
	warning_flash_timer -= delta
	if warning_flash_timer <= 0:
		warning_flash_timer = 0.5
		warning_flash.visible = not warning_flash.visible
	
	var supply_names = {
		"shampoo": "洗发水",
		"conditioner": "护发素",
		"hair_color": "染发剂",
		"perm_solution": "烫发液"
	}
	var name = supply_names.get(current_warning_supply, "耗材")
	warning_label.text = "⚠️ %s即将异常！%.0f秒内点击警告解除！" % [name, warning_timer]

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT and warning_visible:
		_resolve_warning_manual()

func _resolve_warning_manual() -> void:
	if not warning_visible:
		return
	
	warning_visible = false
	warning_overlay.visible = false
	GameState.supply_warnings.erase(current_warning_supply)
	
	anomaly_handler_count += 1
	GameState.add_score(50)
	if anomaly_handler_count >= 5:
		GameState.unlock_achievement("anomaly_handler")
	
	EventBus.supply_anomaly_resolved.emit(current_warning_supply)
	ReplayManager.record_step("anomaly", {"type": current_warning_supply, "action": "resolved_manual"})
	current_warning_supply = ""
	_update_ui()

func _trigger_anomaly() -> void:
	warning_visible = false
	warning_overlay.visible = false
	
	var supply_type = current_warning_supply
	GameState.supply_warnings.erase(supply_type)
	
	var impact = {"stock_loss": 25, "duration": 10}
	GameState.consume_supply(supply_type, 25)
	GameState.active_anomalies.append(supply_type)
	
	EventBus.emit_supply_anomaly_triggered(supply_type, impact)
	ReplayManager.record_step("anomaly", {"type": supply_type, "action": "triggered"})
	current_warning_supply = ""
	_update_supply_bars()
	GameState.reset_combo()

func _on_supply_anomaly_warning(supply_type: String, time_left: float) -> void:
	pass

func _on_supply_anomaly_triggered(supply_type: String, impact: Dictionary) -> void:
	_update_supply_bars()

func _use_item(item_id: String) -> void:
	if not GameState.can_use_item(item_id):
		return
	
	if GameState.use_item(item_id):
		_apply_item_effect(item_id)
		ReplayManager.record_item_usage(item_id)
		GameState.register_action()

func _apply_item_effect(item_id: String) -> void:
	var item = GameState.items.get(item_id, {})
	match item_id:
		"speed_boost":
			active_buffs["speed_boost"] = item.get("duration", 10)
		"supply_refill":
			for supply_type in GameState.supplies.keys():
				GameState.refill_supply(supply_type, item.get("amount", 30))
			_update_supply_bars()
		"charm":
			active_buffs["charm"] = item.get("duration", 15)
			for customer_id in customer_nodes.keys():
				var data = customer_nodes[customer_id]
				var customer: CustomerData = data["customer"]
				customer.patience = min(customer.max_patience, customer.patience + 15)
		"time_freeze":
			active_buffs["time_freeze"] = item.get("duration", 5)

func _update_buffs(delta: float) -> void:
	var to_remove = []
	for buff_id in active_buffs.keys():
		active_buffs[buff_id] -= delta
		if active_buffs[buff_id] <= 0:
			to_remove.append(buff_id)
	for buff_id in to_remove:
		active_buffs.erase(buff_id)

func _update_item_cooldowns(delta: float) -> void:
	GameState.update_item_cooldowns(delta)
	_update_item_buttons()

func _update_item_buttons() -> void:
	_update_single_item_button(item_speed_boost, "speed_boost")
	_update_single_item_button(item_supply_refill, "supply_refill")
	_update_single_item_button(item_charm, "charm")
	_update_single_item_button(item_time_freeze, "time_freeze")

func _update_single_item_button(button: Button, item_id: String) -> void:
	var cooldown = GameState.item_cooldowns.get(item_id, 0)
	var item = GameState.items.get(item_id, {})
	if cooldown > 0:
		button.disabled = true
		button.text = "%s %.0fs" % [item.get("icon", ""), cooldown]
	else:
		button.disabled = false
		button.text = "%s %s" % [item.get("icon", ""), item.get("name", "")]

func _update_ui() -> void:
	score_label.text = "💰 " + str(GameState.score)
	combo_label.text = "🔥 x" + str(GameState.combo)
	level_label.text = "第" + str(GameState.current_level) + "关"
	_update_supply_bars()
	_update_item_buttons()

func _update_supply_bars() -> void:
	shampoo_bar.value = GameState.get_supply_stock("shampoo") / GameState.supplies["shampoo"]["max_stock"] * 100
	conditioner_bar.value = GameState.get_supply_stock("conditioner") / GameState.supplies["conditioner"]["max_stock"] * 100
	hair_color_bar.value = GameState.get_supply_stock("hair_color") / GameState.supplies["hair_color"]["max_stock"] * 100
	perm_bar.value = GameState.get_supply_stock("perm_solution") / GameState.supplies["perm_solution"]["max_stock"] * 100

func _check_achievements() -> void:
	if GameState.customers_served == 1:
		GameState.unlock_achievement("first_customer")
	
	if GameState.score > 5000:
		GameState.unlock_achievement("high_score")
	
	if GameState.max_combo >= 5:
		GameState.unlock_achievement("combo_5")
	if GameState.max_combo >= 10:
		GameState.unlock_achievement("combo_10")

func _check_game_end() -> void:
	if game_timer >= GAME_DURATION:
		_end_game(GameState.projects_completed >= TARGET_PROJECTS)

func _end_game(success: bool) -> void:
	if not is_running:
		return
	is_running = false
	
	Analytics.save_session_data()
	
	if not success:
		ReplayManager.stop_recording()
		ReplayManager.save_replay()
	
	GameState.end_game(success)

func _on_game_ended(result_data: Dictionary) -> void:
	call_deferred("_goto_result_screen")

func _goto_result_screen() -> void:
	get_tree().change_scene_to_file("res://scenes/result_screen.tscn")

func _on_pause_pressed() -> void:
	GameState.pause_game()
	pause_panel.visible = true

func _on_resume_pressed() -> void:
	GameState.resume_game()
	pause_panel.visible = false

func _on_quit_pressed() -> void:
	GameState.end_game(false)
	ReplayManager.stop_recording()
	ReplayManager.save_replay()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")
