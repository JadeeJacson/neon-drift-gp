extends RefCounted
class_name EnemyTable
## 敌型数值表（纯数据层）。不引用场景树、不引用物理 API，因此可在 --headless 下逐帧断言。
## 数值口径：伤害 = HP 点；距离 = 米（Godot 单位）；时间 = 秒。
## 尺寸/缩放见 assets/ASSET_MANIFEST.md（Poly Pizza 模型尺度不统一，数值表只管玩法不管理变换）。

const TYPES := {
	"drone": {
		"display": "蜂群无人机",
		"hp": 45.0,
		"speed": 9.0,
		"attack_range": 1.6,
		"attack_damage": 9.0,
		"attack_interval": 0.8,
		"preferred_distance": 0.0,
		"armor": 0.0,
		"threat": 6.0,
		"reward_ammo": 2.0,
		"reward_health": 0.0,
		"anim": "glb",
	},
	"charger": {
		"display": "冲锋四足",
		"hp": 90.0,
		"speed": 12.0,
		"attack_range": 2.4,
		"attack_damage": 19.0,
		"attack_interval": 1.1,
		"preferred_distance": 0.0,
		"armor": 0.10,
		"threat": 12.0,
		"reward_ammo": 3.0,
		"reward_health": 4.0,
		"anim": "procedural",
	},
	"trooper": {
		"display": "机兵射手",
		"hp": 160.0,
		"speed": 5.5,
		"attack_range": 34.0,
		"attack_damage": 13.0,
		"attack_interval": 1.4,
		"preferred_distance": 22.0,
		"armor": 0.0,
		"threat": 18.0,
		"reward_ammo": 5.0,
		"reward_health": 8.0,
		"anim": "glb",
	},
	"heavy": {
		"display": "重装机甲",
		"hp": 640.0,
		"speed": 3.2,
		"attack_range": 46.0,
		"attack_damage": 34.0,
		"attack_interval": 2.2,
		"preferred_distance": 30.0,
		"armor": 0.25,
		"threat": 60.0,
		"reward_ammo": 22.0,
		"reward_health": 20.0,
		"anim": "procedural",
	},
}

static func has_type(type: String) -> bool:
	return TYPES.has(type)


static func display(type: String) -> String:
	assert(TYPES.has(type), "未知敌型: " + type)
	return String(TYPES[type]["display"])


static func field(type: String, key: String) -> float:
	assert(TYPES.has(type), "未知敌型: " + type)
	assert(TYPES[type].has(key), "未知字段: %s.%s" % [type, key])
	return float(TYPES[type][key])


static func hp(type: String) -> float:
	return field(type, "hp")


static func threat(type: String) -> float:
	return field(type, "threat")


## 护甲与命中倍率合成后的等效伤害。护甲为百分比减免，爆头在护甲之前结算。
static func effective_damage(type: String, raw_damage: float, headshot: bool, head_mult: float) -> float:
	var dmg := raw_damage * (head_mult if headshot else 1.0)
	return dmg * (1.0 - field(type, "armor"))


static func shots_to_kill(type: String, per_shot_damage: float, headshot: bool = false, head_mult: float = 1.0) -> int:
	var eff := effective_damage(type, per_shot_damage, headshot, head_mult)
	assert(eff > 0.0, "单发等效伤害必须为正")
	return ceili(hp(type) / eff)


static func all_types() -> Array:
	return TYPES.keys()
