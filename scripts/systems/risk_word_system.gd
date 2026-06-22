class_name RiskWordSystem
extends Node

signal risk_word_hit(word_id: String, severity: int, category: String)
signal risk_word_missed(word_id: String)
signal all_risk_words_identified
signal risk_scan_complete(identified_count: int, total_count: int)

var available_risk_words: Array[Dictionary] = []
var identified_words: Dictionary = {}
var scan_active: bool = false


func load_risk_words(words: Array[Dictionary]) -> void:
	available_risk_words.clear()
	identified_words.clear()
	scan_active = false
	for word_data in words:
		available_risk_words.append(word_data)
		var wid: String = word_data.get("word_id", "")
		identified_words[wid] = false


func start_scan() -> void:
	if available_risk_words.is_empty():
		return
	scan_active = true


func attempt_identify(word_id: String) -> Dictionary:
	if not scan_active:
		return {"hit": false, "severity": 0, "category": "", "description": "", "hint": ""}

	if identified_words.has(word_id) and identified_words[word_id]:
		return {"hit": false, "severity": 0, "category": "", "description": "已识别", "hint": ""}

	var found: bool = false
	var result: Dictionary = {"hit": false, "severity": 0, "category": "", "description": "", "hint": ""}

	for word_data in available_risk_words:
		if word_data.get("word_id", "") == word_id:
			found = true
			identified_words[word_id] = true
			result = {
				"hit": true,
				"severity": word_data.get("severity", 1),
				"category": word_data.get("category", ""),
				"description": word_data.get("description", ""),
				"hint": word_data.get("hint", ""),
			}
			risk_word_hit.emit(word_id, result["severity"], result["category"])

			var all_found: bool = true
			for wid in identified_words:
				if not identified_words[wid]:
					all_found = false
					break
			if all_found:
				all_risk_words_identified.emit()
			break

	if not found:
		risk_word_missed.emit(word_id)

	return result


func get_hint_for_word(word_id: String) -> String:
	for word_data in available_risk_words:
		if word_data.get("word_id", "") == word_id:
			return word_data.get("hint", "")
	return ""


func get_remaining_words() -> Array[Dictionary]:
	var remaining: Array[Dictionary] = []
	for word_data in available_risk_words:
		var wid: String = word_data.get("word_id", "")
		if identified_words.has(wid) and not identified_words[wid]:
			remaining.append(word_data)
	return remaining


func get_identified_words() -> Array[Dictionary]:
	var identified: Array[Dictionary] = []
	for word_data in available_risk_words:
		var wid: String = word_data.get("word_id", "")
		if identified_words.has(wid) and identified_words[wid]:
			identified.append(word_data)
	return identified


func get_missed_words() -> Array[Dictionary]:
	var missed: Array[Dictionary] = []
	for word_data in available_risk_words:
		var wid: String = word_data.get("word_id", "")
		if identified_words.has(wid) and not identified_words[wid]:
			missed.append(word_data)
	return missed


func complete_scan() -> Dictionary:
	scan_active = false
	var identified_count: int = 0
	var total_count: int = available_risk_words.size()
	var identified_list: Array[Dictionary] = []
	var missed_list: Array[Dictionary] = []

	for word_data in available_risk_words:
		var wid: String = word_data.get("word_id", "")
		if identified_words.get(wid, false):
			identified_count += 1
			identified_list.append(word_data)
		else:
			missed_list.append(word_data)

	risk_scan_complete.emit(identified_count, total_count)

	return {
		"identified_count": identified_count,
		"total_count": total_count,
		"identified_words": identified_list,
		"missed_words": missed_list,
		"completion_ratio": float(identified_count) / float(max(total_count, 1)),
	}


func is_word_identified(word_id: String) -> bool:
	return identified_words.get(word_id, false)


func reset() -> void:
	available_risk_words.clear()
	identified_words.clear()
	scan_active = false
