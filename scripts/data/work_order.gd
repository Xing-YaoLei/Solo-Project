class_name WorkOrder
extends RefCounted

enum Priority { LOW, MEDIUM, HIGH, URGENT }
enum Status { PENDING, IN_PROGRESS, COMPLETED, FAILED }

var id: String
var vehicle_plate: String
var vehicle_model: String
var customer_name: String
var description: String
var required_services: Array[String]
var required_parts: Array[String]
var priority: Priority
var status: Status
var time_limit: float
var time_spent: float
var is_repair: bool
var repair_count: int
var reward: int
var penalty: int
var created_at: float
var deadline: float

func _init(p_id: String, p_plate: String, p_model: String, p_customer: String, p_desc: String, p_services: Array, p_parts: Array, p_priority: Priority = Priority.MEDIUM, p_time_limit: float = 300.0, p_is_repair: bool = false, p_reward: int = 100, p_penalty: int = 50):
	id = p_id
	vehicle_plate = p_plate
	vehicle_model = p_model
	customer_name = p_customer
	description = p_desc
	required_services = p_services
	required_parts = p_parts
	priority = p_priority
	status = Status.PENDING
	time_limit = p_time_limit
	time_spent = 0.0
	is_repair = p_is_repair
	repair_count = 0
	reward = p_reward
	penalty = p_penalty
	created_at = Time.get_unix_time_from_system()
	deadline = created_at + p_time_limit

func get_priority_color() -> Color:
	match priority:
		Priority.LOW:
			return Color(0.3, 0.8, 0.3)
		Priority.MEDIUM:
			return Color(1.0, 0.8, 0.2)
		Priority.HIGH:
			return Color(1.0, 0.5, 0.2)
		Priority.URGENT:
			return Color(1.0, 0.2, 0.2)
		_:
			return Color.WHITE

func get_priority_text() -> String:
	match priority:
		Priority.LOW:
			return "低"
		Priority.MEDIUM:
			return "中"
		Priority.HIGH:
			return "高"
		Priority.URGENT:
			return "紧急"
		_:
			return "未知"

func get_status_text() -> String:
	match status:
		Status.PENDING:
			return "待处理"
		Status.IN_PROGRESS:
			return "处理中"
		Status.COMPLETED:
			return "已完成"
		Status.FAILED:
			return "已失败"
		_:
			return "未知"

func get_remaining_time() -> float:
	return deadline - Time.get_unix_time_from_system()

func is_overdue() -> bool:
	return get_remaining_time() <= 0

func get_time_percentage() -> float:
	var remaining = get_remaining_time()
	return clamp(remaining / time_limit, 0.0, 1.0)
