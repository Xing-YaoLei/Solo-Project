extends Control

@onready var _progress_bar: ProgressBar = $VBoxContainer/ProgressBar
@onready var _status_label: Label = $VBoxContainer/StatusLabel
@onready var _animation_player: AnimationPlayer = $AnimationPlayer

var _target_scene_path: String = ""
var _on_complete: Callable = Callable()
var _loading := false
var _initial_load_done := false

func _ready() -> void:
	_animation_player.play("pulse")
	_status_label.text = "准备中..."
	set_process(true)
	await get_tree().create_timer(0.3).timeout
	start_load("res://scenes/main_menu/main_menu.tscn", _on_initial_load)

func start_load(scene_path: String, on_complete: Callable) -> void:
	ResourceLoader.load_threaded_request(scene_path)
	_target_scene_path = scene_path
	_on_complete = on_complete
	_loading = true
	_status_label.text = "正在加载资源..."

func _process(_delta: float) -> void:
	if not _loading:
		return
	var progress := []
	var status := ResourceLoader.load_threaded_get_status(_target_scene_path, progress)
	match status:
		ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			var ratio := progress[0] if progress.size() > 0 else 0.0
			_progress_bar.value = ratio * 100.0
			_status_label.text = "正在加载... %d%%" % int(ratio * 100.0)
		ResourceLoader.THREAD_LOAD_LOADED:
			_loading = false
			_progress_bar.value = 100.0
			_status_label.text = "加载完成"
			var scene_res := ResourceLoader.load_threaded_get(_target_scene_path)
			if scene_res:
				var instance := scene_res.instantiate()
				_on_complete.call(instance)
			else:
				push_error("LoadingScreen: failed to instantiate %s" % _target_scene_path)
				_status_label.text = "加载失败"
		ResourceLoader.THREAD_LOAD_FAILED:
			_loading = false
			_status_label.text = "加载失败，正在重试..."
			_retry_load()

func _retry_load() -> void:
	await get_tree().create_timer(0.5).timeout
	ResourceLoader.load_threaded_request(_target_scene_path)
	_loading = true

func _on_initial_load(scene: Node) -> void:
	if _initial_load_done:
		scene.queue_free()
		return
	_initial_load_done = true
	get_tree().root.add_child(scene)
	get_tree().current_scene = scene
	queue_free()
