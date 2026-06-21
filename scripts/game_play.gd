extends Control

@onready var level_label: Label = $TopBar/HBoxContainer/LevelLabel
@onready var timer_label: Label = $TopBar/HBoxContainer/TimerLabel
@onready var score_label: Label = $TopBar/HBoxContainer/ScoreLabel
@onready var pause_button: Button = $TopBar/HBoxContainer/PauseButton
@onready var submit_button: Button = $TopBar/HBoxContainer/SubmitButton
@onready var back_button: Button = $TopBar/HBoxContainer/BackButton

@onready var order_list: VBoxContainer = $MainSplit/LeftPanel/VBoxContainer/OrderScroll/OrderList
@onready var week_label: Label = $MainSplit/RightPanel/CalendarContainer/VBoxContainer2/WeekLabel
@onready var calendar_grid: GridContainer = $MainSplit/RightPanel/CalendarContainer/VBoxContainer2/CalendarScroll/CalendarGrid
@onready var cleaner_info: VBoxContainer = $MainSplit/RightPanel/CleanerInfo

@onready var conflict_list: VBoxContainer = $BottomPanel/VBoxContainer3/ConflictScroll/ConflictList
@onready var conflict_label: Label = $BottomPanel/VBoxContainer3/ConflictLabel

@onready var order_detail_panel: Panel = $OrderDetailPanel
@onready var detail_apartment: Label = $OrderDetailPanel/VBox/DetailApartment
@onready var detail_type: Label = $OrderDetailPanel/VBox/DetailType
@onready var detail_duration: Label = $OrderDetailPanel/VBox/DetailDuration
@onready var detail_preferred: Label = $OrderDetailPanel/VBox/DetailPreferred
@onready var detail_status: Label = $OrderDetailPanel/VBox/DetailStatus
@onready var detail_conflict: Label = $OrderDetailPanel/VBox/DetailConflict
@onready var assign_button: Button = $OrderDetailPanel/VBox/AssignButton
@onready var unassign_button: Button = $OrderDetailPanel/VBox/UnassignButton
@onready var reschedule_button: Button = $OrderDetailPanel/VBox/RescheduleButton
@onready var close_detail_button: Button = $OrderDetailPanel/VBox/CloseDetailButton

var selected_order_id: int = 0
var selected_cleaner_id: int = 0
var selected_day: int = 0
var selected_hour: int = -1
var is_assign_mode: bool = false
var is_reschedule_mode: bool = false
var current_week_start: int = 0

var day_names: Array = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]

func _ready() -> void:
	_setup_connections()
	_update_ui()
	_build_calendar()
	_build_order_list()
	_build_conflict_list()
	_build_cleaner_info()

func _setup_connections() -> void:
	GameManager.time_updated.connect(_on_time_updated)
	GameManager.game_finished.connect(_on_game_finished)
	DataManager.data_updated.connect(_on_data_updated)
	
	pause_button.pressed.connect(_on_pause_pressed)
	submit_button.pressed.connect(_on_submit_pressed)
	back_button.pressed.connect(_on_back_pressed)
	
	assign_button.pressed.connect(_on_assign_pressed)
	unassign_button.pressed.connect(_on_unassign_pressed)
	reschedule_button.pressed.connect(_on_reschedule_pressed)
	close_detail_button.pressed.connect(_on_close_detail_pressed)

func _update_ui() -> void:
	var level: Dictionary = DataManager.get_current_level()
	level_label.text = level.get("name", "")
	
	if GameManager.get_is_training_mode():
		timer_label.text = "训练模式"
		timer_label.add_theme_color_override("font_color", Color(0.5, 0.4, 0.8))
	else:
		timer_label.text = GameManager.get_time_formatted()
		var progress: float = GameManager.get_progress()
		if progress < 0.3:
			timer_label.add_theme_color_override("font_color", Color(0.9, 0.2, 0.2))
		elif progress < 0.5:
			timer_label.add_theme_color_override("font_color", Color(0.9, 0.7, 0.2))
		else:
			timer_label.add_theme_color_override("font_color", Color(0.2, 0.6, 0.3))
	
	var score_result: Dictionary = DataManager.calculate_score()
	score_label.text = "当前分: %.1f" % score_result.get("score", 0.0)

func _build_calendar() -> void:
	for child in calendar_grid.get_children():
		child.queue_free()
	
	var cleaners: Array = DataManager.get_cleaners_for_level(GameManager.get_current_level_id())
	var num_cols: int = 8
	calendar_grid.columns = num_cols
	
	var header_label: Label = Label.new()
	header_label.text = "时段"
	header_label.horizontal_alignment = 1
	header_label.add_theme_font_size_override("font_size", 12)
	header_label.custom_minimum_size = Vector2(60, 30)
	calendar_grid.add_child(header_label)
	
	for i in range(7):
		var day_idx: int = (current_week_start + i) % 7
		var day_label: Label = Label.new()
		day_label.text = day_names[day_idx]
		day_label.horizontal_alignment = 1
		day_label.add_theme_font_size_override("font_size", 12)
		day_label.custom_minimum_size = Vector2(100, 30)
		if day_idx == 0 or day_idx == 6:
			day_label.add_theme_color_override("font_color", Color(0.8, 0.3, 0.3))
		calendar_grid.add_child(day_label)
	
	for hour in range(8, 18):
		var time_label: Label = Label.new()
		time_label.text = "%02d:00" % hour
		time_label.horizontal_alignment = 1
		time_label.add_theme_font_size_override("font_size", 11)
		time_label.custom_minimum_size = Vector2(60, 50)
		time_label.add_theme_color_override("font_color", Color(0.4, 0.4, 0.4))
		calendar_grid.add_child(time_label)
		
		for i in range(7):
			var day_idx: int = (current_week_start + i) % 7
			var cell: Panel = Panel.new()
			cell.custom_minimum_size = Vector2(100, 50)
			cell.name = "cell_%d_%d" % [day_idx, hour]
			
			var cell_vbox: VBoxContainer = VBoxContainer.new()
			cell_vbox.offset_left = 2
			cell_vbox.offset_top = 2
			cell_vbox.offset_right = -2
			cell_vbox.offset_bottom = -2
			cell_vbox.anchor_right = 1.0
			cell_vbox.anchor_bottom = 1.0
			
			var cell_label: Label = Label.new()
			cell_label.text = ""
			cell_label.add_theme_font_size_override("font_size", 9)
			cell_label.horizontal_alignment = 1
			cell_vbox.add_child(cell_label)
			
			cell.add_child(cell_vbox)
			
			var cell_button: BaseButton = BaseButton.new()
			cell_button.anchor_right = 1.0
			cell_button.anchor_bottom = 1.0
			cell_button.pressed.connect(_on_calendar_cell_pressed.bind(day_idx, hour))
			cell.add_child(cell_button)
			
			calendar_grid.add_child(cell)
	
	_update_calendar_content()

func _update_calendar_content() -> void:
	var orders: Array = DataManager.get_orders()
	var cleaners: Array = DataManager.get_cleaners_for_level(GameManager.get_current_level_id())
	
	for child in calendar_grid.get_children():
		if child.name.begins_with("cell_"):
			var vbox = child.get_child(0)
			if vbox and vbox.get_child_count() > 0:
				var label = vbox.get_child(0)
				if label and label is Label:
					label.text = ""
			
			child.modulate = Color(1, 1, 1, 1)
	
	for order in orders:
		if order.get("status") != "assigned":
			continue
		
		var day: int = order.get("assigned_day", 0)
		var start_hour: int = order.get("assigned_start_hour", 0)
		var cleaner_id: int = order.get("assigned_cleaner", 0)
		var cleaner_name: String = _get_cleaner_name(cleaner_id)
		
		var cell_name: String = "cell_%d_%d" % [day, start_hour]
		var cell = calendar_grid.get_node_or_null(cell_name)
		if cell:
			var vbox = cell.get_child(0)
			if vbox and vbox.get_child_count() > 0:
				var label = vbox.get_child(0)
				if label and label is Label:
					label.text = "%s\n%s" % [order.get("apartment", ""), cleaner_name]
					label.add_theme_color_override("font_color", Color(0.2, 0.4, 0.7))
			
			cell.modulate = Color(0.85, 0.92, 1.0, 1)

func _build_order_list() -> void:
	for child in order_list.get_children():
		child.queue_free()
	
	var orders: Array = DataManager.get_orders()
	var sorted_orders: Array = orders.duplicate()
	sorted_orders.sort_custom(func(a, b): 
		if a.get("status") == b.get("status"):
			return a.get("id", 0) < b.get("id", 0)
		return a.get("status", "") > b.get("status", "")
	)
	
	for order in sorted_orders:
		var order_panel: Panel = Panel.new()
		order_panel.custom_minimum_size = Vector2(0, 70)
		order_panel.name = "order_%d" % order.get("id", 0)
		
		var status: String = order.get("status", "pending")
		if status == "assigned":
			order_panel.modulate = Color(0.9, 0.98, 0.9, 1)
		else:
			order_panel.modulate = Color(1, 0.95, 0.9, 1)
		
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.offset_left = 10
		hbox.offset_top = 8
		hbox.offset_right = -10
		hbox.offset_bottom = -8
		hbox.anchor_right = 1.0
		hbox.anchor_bottom = 1.0
		hbox.add_theme_constant_override("separation", 10)
		
		var status_icon: ColorRect = ColorRect.new()
		status_icon.custom_minimum_size = Vector2(6, 50)
		if status == "assigned":
			status_icon.color = Color(0.3, 0.7, 0.3)
		else:
			status_icon.color = Color(0.9, 0.6, 0.3)
		hbox.add_child(status_icon)
		
		var info_vbox: VBoxContainer = VBoxContainer.new()
		info_vbox.size_flags_horizontal = SIZE_EXPAND_FILL
		
		var apartment_label: Label = Label.new()
		apartment_label.text = order.get("apartment", "")
		apartment_label.add_theme_font_size_override("font_size", 14)
		apartment_label.add_theme_color_override("font_color", Color(0.2, 0.3, 0.5))
		info_vbox.add_child(apartment_label)
		
		var type_label: Label = Label.new()
		type_label.text = "%s · %d分钟" % [order.get("order_type", ""), order.get("duration", 60)]
		type_label.add_theme_font_size_override("font_size", 11)
		type_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		info_vbox.add_child(type_label)
		
		var pref_label: Label = Label.new()
		var pref_day: int = order.get("preferred_day", 0)
		pref_label.text = "期望: %s %02d:00" % [day_names[pref_day], order.get("preferred_start_hour", 9)]
		pref_label.add_theme_font_size_override("font_size", 10)
		pref_label.add_theme_color_override("font_color", Color(0.6, 0.5, 0.4))
		info_vbox.add_child(pref_label)
		
		if order.get("is_rescheduled", false):
			var resched_label: Label = Label.new()
			resched_label.text = "已改约 %d 次" % order.get("reschedule_count", 0)
			resched_label.add_theme_font_size_override("font_size", 10)
			resched_label.add_theme_color_override("font_color", Color(0.8, 0.4, 0.2))
			info_vbox.add_child(resched_label)
		
		hbox.add_child(info_vbox)
		
		var select_button: Button = Button.new()
		select_button.text = "查看"
		select_button.custom_minimum_size = Vector2(60, 30)
		select_button.add_theme_font_size_override("font_size", 11)
		select_button.pressed.connect(_on_select_order.bind(order.get("id", 0)))
		hbox.add_child(select_button)
		
		order_panel.add_child(hbox)
		order_list.add_child(order_panel)

func _build_conflict_list() -> void:
	for child in conflict_list.get_children():
		child.queue_free()
	
	var conflicts: Array = DataManager.check_conflicts()
	conflict_label.text = "冲突检测 (%d 个问题)" % conflicts.size()
	
	if conflicts.is_empty():
		var no_conflict_label: Label = Label.new()
		no_conflict_label.text = "✓ 当前没有检测到冲突"
		no_conflict_label.add_theme_font_size_override("font_size", 14)
		no_conflict_label.add_theme_color_override("font_color", Color(0.3, 0.7, 0.3))
		no_conflict_label.horizontal_alignment = 1
		no_conflict_label.custom_minimum_size = Vector2(0, 40)
		conflict_list.add_child(no_conflict_label)
		return
	
	for conflict in conflicts:
		var conflict_panel: Panel = Panel.new()
		conflict_panel.custom_minimum_size = Vector2(0, 40)
		conflict_panel.modulate = Color(1, 0.92, 0.9, 1)
		
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.offset_left = 10
		hbox.offset_top = 5
		hbox.offset_right = -10
		hbox.offset_bottom = -5
		hbox.anchor_right = 1.0
		hbox.anchor_bottom = 1.0
		
		var type_label: Label = Label.new()
		var conflict_type: String = conflict.get("type", "")
		type_label.text = _get_conflict_type_icon(conflict_type)
		type_label.add_theme_font_size_override("font_size", 18)
		type_label.custom_minimum_size = Vector2(30, 0)
		hbox.add_child(type_label)
		
		var info_label: Label = Label.new()
		var order_id: int = conflict.get("order_id", 0)
		var order: Dictionary = _get_order_by_id(order_id)
		info_label.text = "订单%s - %s: %s" % [
			order_id,
			order.get("apartment", ""),
			conflict.get("reason", "")
		]
		info_label.add_theme_font_size_override("font_size", 12)
		info_label.add_theme_color_override("font_color", Color(0.7, 0.3, 0.2))
		info_label.size_flags_horizontal = SIZE_EXPAND_FILL
		hbox.add_child(info_label)
		
		conflict_panel.add_child(hbox)
		conflict_list.add_child(conflict_panel)

func _build_cleaner_info() -> void:
	for child in cleaner_info.get_children():
		child.queue_free()
	
	var cleaners: Array = DataManager.get_cleaners_for_level(GameManager.get_current_level_id())
	
	var title_label: Label = Label.new()
	title_label.text = "保洁员信息"
	title_label.add_theme_font_size_override("font_size", 14)
	title_label.add_theme_color_override("font_color", Color(0.2, 0.3, 0.5))
	title_label.custom_minimum_size = Vector2(0, 25)
	cleaner_info.add_child(title_label)
	
	for cleaner in cleaners:
		var cleaner_panel: Panel = Panel.new()
		cleaner_panel.custom_minimum_size = Vector2(0, 60)
		cleaner_panel.name = "cleaner_%d" % cleaner.get("id", 0)
		
		var hbox: HBoxContainer = HBoxContainer.new()
		hbox.offset_left = 8
		hbox.offset_top = 5
		hbox.offset_right = -8
		hbox.offset_bottom = -5
		hbox.anchor_right = 1.0
		hbox.anchor_bottom = 1.0
		hbox.add_theme_constant_override("separation", 10)
		
		var avatar: ColorRect = ColorRect.new()
		avatar.custom_minimum_size = Vector2(40, 40)
		avatar.color = _get_cleaner_color(cleaner.get("id", 0))
		hbox.add_child(avatar)
		
		var info_vbox: VBoxContainer = VBoxContainer.new()
		info_vbox.size_flags_horizontal = SIZE_EXPAND_FILL
		
		var name_label: Label = Label.new()
		name_label.text = cleaner.get("name", "")
		name_label.add_theme_font_size_override("font_size", 13)
		name_label.add_theme_color_override("font_color", Color(0.2, 0.3, 0.5))
		info_vbox.add_child(name_label)
		
		var capacity_label: Label = Label.new()
		capacity_label.text = "日容量: %d单  |  技能: %s" % [
			cleaner.get("capacity", 4),
			", ".join(cleaner.get("skills", []))
		]
		capacity_label.add_theme_font_size_override("font_size", 10)
		capacity_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5))
		info_vbox.add_child(capacity_label)
		
		var days_label: Label = Label.new()
		var work_day_names: Array = []
		for d in cleaner.get("work_days", []):
			work_day_names.append(day_names[d])
		days_label.text = "工作日: %s" % ", ".join(work_day_names)
		days_label.add_theme_font_size_override("font_size", 9)
		days_label.add_theme_color_override("font_color", Color(0.6, 0.6, 0.6))
		info_vbox.add_child(days_label)
		
		hbox.add_child(info_vbox)
		
		var select_btn: Button = Button.new()
		select_btn.text = "选择"
		select_btn.custom_minimum_size = Vector2(50, 30)
		select_btn.add_theme_font_size_override("font_size", 10)
		select_btn.pressed.connect(_on_select_cleaner.bind(cleaner.get("id", 0)))
		hbox.add_child(select_btn)
		
		cleaner_panel.add_child(hbox)
		cleaner_info.add_child(cleaner_panel)

func _show_order_detail(order_id: int) -> void:
	selected_order_id = order_id
	var order: Dictionary = _get_order_by_id(order_id)
	if order.is_empty():
		return
	
	detail_apartment.text = order.get("apartment", "")
	detail_type.text = "类型: %s" % order.get("order_type", "")
	detail_duration.text = "时长: %d分钟" % order.get("duration", 60)
	
	var pref_day: int = order.get("preferred_day", 0)
	detail_preferred.text = "期望: %s %02d:00" % [day_names[pref_day], order.get("preferred_start_hour", 9)]
	
	var status: String = order.get("status", "pending")
	if status == "assigned":
		var cleaner_name: String = _get_cleaner_name(order.get("assigned_cleaner", 0))
		var assign_day = order.get("assigned_day", 0)
		detail_status.text = "状态: 已分配给%s (%s %02d:00)" % [
			cleaner_name,
			day_names[assign_day],
			order.get("assigned_start_hour", 0)
		]
		detail_status.add_theme_color_override("font_color", Color(0.3, 0.6, 0.3))
	else:
		detail_status.text = "状态: 待分配"
		detail_status.add_theme_color_override("font_color", Color(0.8, 0.5, 0.2))
	
	var conflict_reason: String = order.get("conflict_reason", "")
	if conflict_reason:
		detail_conflict.text = "冲突: %s" % conflict_reason
		detail_conflict.visible = true
	else:
		detail_conflict.visible = false
	
	unassign_button.visible = (status == "assigned")
	reschedule_button.visible = (status == "assigned")
	assign_button.visible = (status == "pending")
	
	if is_assign_mode or is_reschedule_mode:
		assign_button.text = "请选择时段..."
		assign_button.disabled = true
	else:
		assign_button.text = "分配订单"
		assign_button.disabled = false
	
	order_detail_panel.visible = true

func _hide_order_detail() -> void:
	order_detail_panel.visible = false
	selected_order_id = 0
	is_assign_mode = false
	is_reschedule_mode = false

func _on_select_order(order_id: int) -> void:
	_show_order_detail(order_id)

func _on_select_cleaner(cleaner_id: int) -> void:
	selected_cleaner_id = cleaner_id
	_update_cleaner_selection()

func _update_cleaner_selection() -> void:
	var cleaners: Array = DataManager.get_cleaners_for_level(GameManager.get_current_level_id())
	for cleaner in cleaners:
		var panel_name: String = "cleaner_%d" % cleaner.get("id", 0)
		var panel = cleaner_info.get_node_or_null(panel_name)
		if panel:
			if cleaner.get("id") == selected_cleaner_id:
				panel.modulate = Color(0.85, 0.95, 1.0, 1)
			else:
				panel.modulate = Color(1, 1, 1, 1)

func _on_assign_pressed() -> void:
	if selected_order_id == 0:
		return
	is_assign_mode = true
	is_reschedule_mode = false
	assign_button.text = "点击日历选择时段"

func _on_unassign_pressed() -> void:
	if selected_order_id == 0:
		return
	DataManager.unassign_order(selected_order_id)
	_hide_order_detail()

func _on_reschedule_pressed() -> void:
	if selected_order_id == 0:
		return
	is_reschedule_mode = true
	is_assign_mode = false
	var order: Dictionary = _get_order_by_id(selected_order_id)
	selected_cleaner_id = order.get("assigned_cleaner", 0)
	assign_button.text = "选择新的时段"

func _on_close_detail_pressed() -> void:
	_hide_order_detail()

func _on_calendar_cell_pressed(day: int, hour: int) -> void:
	if not is_assign_mode and not is_reschedule_mode:
		return
	
	if selected_order_id == 0:
		return
	
	if is_reschedule_mode:
		var result: Dictionary = DataManager.reschedule_order(selected_order_id, day, hour)
		if result.get("success", false):
			_hide_order_detail()
		else:
			var order: Dictionary = _get_order_by_id(selected_order_id)
			order["conflict_reason"] = result.get("reason", "")
			detail_conflict.text = "冲突: %s" % result.get("reason", "")
			detail_conflict.visible = true
	else:
		if selected_cleaner_id == 0:
			detail_conflict.text = "请先选择保洁员"
			detail_conflict.visible = true
			return
		
		var result: Dictionary = DataManager.assign_order_to_cleaner(
			selected_order_id, selected_cleaner_id, day, hour
		)
		if result.get("success", false):
			_hide_order_detail()
		else:
			var order: Dictionary = _get_order_by_id(selected_order_id)
			order["conflict_reason"] = result.get("reason", "")
			detail_conflict.text = "冲突: %s" % result.get("reason", "")
			detail_conflict.visible = true

func _on_time_updated(time_left: int) -> void:
	timer_label.text = GameManager.get_time_formatted()
	var progress: float = GameManager.get_progress()
	if progress < 0.3:
		timer_label.add_theme_color_override("font_color", Color(0.9, 0.2, 0.2))
	elif progress < 0.5:
		timer_label.add_theme_color_override("font_color", Color(0.9, 0.7, 0.2))
	else:
		timer_label.add_theme_color_override("font_color", Color(0.2, 0.6, 0.3))

func _on_game_finished() -> void:
	get_tree().change_scene_to_file("res://scenes/result.tscn")

func _on_data_updated() -> void:
	_update_calendar_content()
	_build_order_list()
	_build_conflict_list()
	_update_ui()

func _on_pause_pressed() -> void:
	if GameManager.is_playing():
		GameManager.pause_game()
		pause_button.text = "继续"
	else:
		GameManager.resume_game()
		pause_button.text = "暂停"

func _on_submit_pressed() -> void:
	var confirm_dialog: ConfirmationDialog = ConfirmationDialog.new()
	confirm_dialog.title = "提交确认"
	confirm_dialog.dialog_text = "确定要提交答卷吗？提交后将无法修改。"
	confirm_dialog.get_ok_button().text = "确定提交"
	confirm_dialog.get_cancel_button().text = "取消"
	confirm_dialog.confirmed.connect(_on_submit_confirmed)
	add_child(confirm_dialog)
	confirm_dialog.popup_centered()

func _on_submit_confirmed() -> void:
	GameManager.finish_game()

func _on_back_pressed() -> void:
	var confirm_dialog: ConfirmationDialog = ConfirmationDialog.new()
	confirm_dialog.title = "返回确认"
	confirm_dialog.dialog_text = "确定要返回主菜单吗？当前进度将不会保存。"
	confirm_dialog.get_ok_button().text = "确定返回"
	confirm_dialog.get_cancel_button().text = "取消"
	confirm_dialog.confirmed.connect(_on_back_confirmed)
	add_child(confirm_dialog)
	confirm_dialog.popup_centered()

func _on_back_confirmed() -> void:
	GameManager.go_to_menu()
	get_tree().change_scene_to_file("res://scenes/main_menu.tscn")

func _get_order_by_id(id: int) -> Dictionary:
	var orders: Array = DataManager.get_orders()
	for order in orders:
		if order.get("id") == id:
			return order
	return {}

func _get_cleaner_name(id: int) -> String:
	var cleaners: Array = DataManager.get_cleaners_for_level(GameManager.get_current_level_id())
	for cleaner in cleaners:
		if cleaner.get("id") == id:
			return cleaner.get("name", "")
	return ""

func _get_cleaner_color(id: int) -> Color:
	var colors: Array = [
		Color(0.3, 0.6, 0.8),
		Color(0.8, 0.5, 0.3),
		Color(0.4, 0.7, 0.4),
		Color(0.7, 0.4, 0.7),
		Color(0.8, 0.7, 0.3),
	]
	return colors[(id - 1) % colors.size()]

func _get_conflict_type_icon(type: String) -> String:
	match type:
		"workday":
			return "📅"
		"skill":
			return "🔧"
		"time_overlap":
			return "⏰"
		"capacity":
			return "📊"
		_:
			return "⚠️"
