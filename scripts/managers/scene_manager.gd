extends Node

signal scene_loaded(scene: PackedScene)
signal load_progress(ratio: float)

var _current_scene: Node = null
var _loading := false
var _target_path: String = ""

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	var root := get_tree().root
	_current_scene = root.get_child(root.get_child_count() - 1)

func _process(_delta: float) -> void:
	if not _loading:
		return
	var progress := []
	var status := ResourceLoader.load_threaded_get_status(_target_path, progress)
	match status:
		ResourceLoader.THREAD_LOAD_IN_PROGRESS:
			var ratio := progress[0] if progress.size() > 0 else 0.0
			load_progress.emit(ratio)
		ResourceLoader.THREAD_LOAD_LOADED:
			_loading = false
			var scene_res := ResourceLoader.load_threaded_get(_target_path)
			if scene_res:
				_replace_current(scene_res)
				scene_loaded.emit(scene_res)
		ResourceLoader.THREAD_LOAD_FAILED:
			_loading = false
			push_error("SceneManager: failed to load %s" % _target_path)

func goto_scene(path: String) -> void:
	if _loading:
		return
	_target_path = path
	ResourceLoader.load_threaded_request(path)
	_loading = true

func goto_scene_sync(path: String) -> void:
	var scene_res := load(path)
	if scene_res:
		_replace_current(scene_res)

func _replace_current(scene_res: PackedScene) -> void:
	if _current_scene != null:
		_current_scene.queue_free()
	_current_scene = scene_res.instantiate()
	get_tree().root.add_child(_current_scene)
	get_tree().current_scene = _current_scene
