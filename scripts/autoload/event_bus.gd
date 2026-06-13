extends Node

signal customer_added(customer_data)
signal customer_removed(customer_id)
signal customer_served(customer_data, success)

signal recharge_dragged(recharge_data, target_pos)
signal recharge_completed(recharge_data)

signal project_started(project_data)
signal project_completed(project_data, success)
signal project_failed(project_data, reason)

signal review_updated(customer_id, review_tags)
signal review_score_changed(customer_id, score)

signal supply_anomaly_warning(supply_type, time_left)
signal supply_anomaly_triggered(supply_type, impact)
signal supply_anomaly_resolved(supply_type)

signal timer_tick(remaining_time)
signal game_started(difficulty)
signal game_paused()
signal game_resumed()
signal game_ended(result_data)

signal replay_recorded(replay_data)
signal playback_step(step_index, step_data)

signal achievement_unlocked(achievement_id)
signal item_used(item_id, cooldown)

signal analytics_event(event_name, event_data)

func emit_customer_added(customer_data: Dictionary) -> void:
	customer_added.emit(customer_data)
	emit_analytics("customer_added", {"id": customer_data.get("id", ""), "type": customer_data.get("type", "")})

func emit_customer_served(customer_data: Dictionary, success: bool) -> void:
	customer_served.emit(customer_data, success)
	emit_analytics("customer_served", {"id": customer_data.get("id", ""), "success": success})

func emit_project_started(project_data: Dictionary) -> void:
	project_started.emit(project_data)
	emit_analytics("project_started", {"id": project_data.get("id", ""), "name": project_data.get("name", "")})

func emit_project_completed(project_data: Dictionary, success: bool) -> void:
	project_completed.emit(project_data, success)
	emit_analytics("project_completed", {"id": project_data.get("id", ""), "success": success})

func emit_supply_anomaly_warning(supply_type: String, time_left: float) -> void:
	supply_anomaly_warning.emit(supply_type, time_left)
	emit_analytics("supply_anomaly_warning", {"type": supply_type, "time_left": time_left})

func emit_supply_anomaly_triggered(supply_type: String, impact: Dictionary) -> void:
	supply_anomaly_triggered.emit(supply_type, impact)
	emit_analytics("supply_anomaly_triggered", {"type": supply_type})

func emit_game_ended(result_data: Dictionary) -> void:
	game_ended.emit(result_data)
	emit_analytics("game_ended", {"score": result_data.get("score", 0), "success": result_data.get("success", false)})

func emit_analytics(event_name: String, event_data: Dictionary = {}) -> void:
	analytics_event.emit(event_name, event_data)
