class_name LevelData

const LEVELS: Dictionary = {
	"level_01": {
		"title": "排队长龙",
		"description": "游客投诉景区入口排队超2小时，要求快速疏导",
		"tags": ["排队", "拥堵", "入口"],
		"time_limit": 60.0,
		"methods": ["增设临时通道", "引导线上预约", "发放安抚物资"],
		"evidence": [
			{"type": "photo", "title": "排队现场照片", "description": "入口处蛇形通道满员"},
			{"type": "audio", "title": "游客录音投诉", "description": "多位游客情绪激动"},
			{"type": "document", "title": "日客流量报表", "description": "当日客流超承载量150%"},
		],
		"correct_method": "增设临时通道",
	},
	"level_02": {
		"title": "卫生危机",
		"description": "景区卫生间脏乱差，游客拍照曝光投诉",
		"tags": ["卫生", "设施", "投诉"],
		"time_limit": 50.0,
		"methods": ["紧急增派保洁", "临时关闭检修", "设置移动厕所"],
		"evidence": [
			{"type": "photo", "title": "卫生间现场照片", "description": "地面脏污、设施损坏"},
			{"type": "document", "title": "社交媒体截图", "description": "游客发帖获大量转发"},
			{"type": "audio", "title": "投诉电话录音", "description": "游客情绪愤怒要求退款"},
		],
		"correct_method": "紧急增派保洁",
	},
	"level_03": {
		"title": "安全隐患",
		"description": "玻璃栈道出现裂纹，游客恐慌投诉",
		"tags": ["安全", "设施", "紧急"],
		"time_limit": 40.0,
		"methods": ["立即封闭栈道", "加强巡检观察", "限制人流分批"],
		"evidence": [
			{"type": "photo", "title": "栈道裂纹照片", "description": "多处玻璃面板可见裂纹"},
			{"type": "document", "title": "安检记录表", "description": "上次安检为3个月前"},
			{"type": "audio", "title": "游客求救录音", "description": "现场游客恐慌呼救"},
		],
		"correct_method": "立即封闭栈道",
	},
	"level_04": {
		"title": "餐饮乱象",
		"description": "景区内餐厅价格虚高、食品变质，游客联名投诉",
		"tags": ["餐饮", "价格", "质量"],
		"time_limit": 55.0,
		"methods": ["约谈整改商家", "引入平价餐饮", "公示限价清单"],
		"evidence": [
			{"type": "photo", "title": "菜单价格照片", "description": "一碗面条标价88元"},
			{"type": "document", "title": "联名投诉信", "description": "127位游客联合署名"},
			{"type": "photo", "title": "变质食品照片", "description": "展示过期食材"},
		],
		"correct_method": "约谈整改商家",
	},
	"level_05": {
		"title": "导览缺失",
		"description": "景区标识混乱，游客迷路后投诉无法找到出口",
		"tags": ["导览", "标识", "迷路"],
		"time_limit": 45.0,
		"methods": ["增设临时指引", "广播循环提示", "安排人员引导"],
		"evidence": [
			{"type": "photo", "title": "标识混乱照片", "description": "多个方向指示自相矛盾"},
			{"type": "audio", "title": "游客求助录音", "description": "老人儿童迷路求助"},
			{"type": "document", "title": "投诉统计表", "description": "本月迷路投诉占比38%"},
		],
		"correct_method": "安排人员引导",
	},
}

static func get_level(id: String) -> Dictionary:
	return LEVELS.get(id, {})

static func get_all_level_ids() -> Array:
	return LEVELS.keys()
