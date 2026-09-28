extends Node3D
class_name UnitView
## 一个单位的 3D 表现：模型 + 动画 + 血条 + 星级 + 受击反馈。
##
## **必须显式处理武器节点**（KayKit 素材的实测结论，见 assets/SOURCES.md §8）：
## Adventures 角色的 GLB 里 `1H_Sword` / `2H_Sword` / 三面盾**都带网格**，
## 直接实例化会让骑士同时挂 5 把武器。所以进场先把 WEAPON_NODES 全隐藏，
## 再按单位开对应的那一个。
##
## 骨骼挂点：Skeletons 包的角色**完全不含武器**，武器是独立 GLB，
## 用 BoneAttachment3D 挂到 `hand.r`。朝向/缩放必须实测（tools/verify_assets.gd），
## 这里给的偏移是首版值，**属于人验待调项**（docs/09-立项 §7 第 3 项）。

const MODEL_DIR := "res://assets/models/units/"
const WEAPON_DIR := "res://assets/models/weapons/"

## GLB 里带网格的武器节点（全部先隐藏）
const WEAPON_NODES := [
	"1H_Sword", "2H_Sword", "1H_Sword_Offhand",
	"Round_Shield", "Rectangle_Shield", "Badge_Shield", "Spike_Shield",
]

## 单位 → 露出的武器节点 + 骨骼武器
const EQUIP := {
	"knight": {"node": "Round_Shield", "bone_weapon": ""},
	"barbarian": {"node": "2H_Sword", "bone_weapon": ""},
	"rogue": {"node": "1H_Sword", "bone_weapon": ""},
	"mage": {"node": "1H_Sword", "bone_weapon": ""},
	"hooded": {"node": "1H_Sword_Offhand", "bone_weapon": ""},
	"sk_warrior": {"node": "", "bone_weapon": "Skeleton_Blade"},
	"sk_rogue": {"node": "", "bone_weapon": "Skeleton_Blade"},
	"sk_mage": {"node": "", "bone_weapon": "Skeleton_Staff"},
	"sk_minion": {"node": "", "bone_weapon": "Skeleton_Axe"},
}

## 敌方 id → 用玩家表的哪一行做外观（敌方复用同一批模型）
const ENEMY_APPEARANCE := {
	"e_bone": "sk_warrior", "e_archer": "sk_rogue", "e_adept": "sk_mage",
	"e_reaver": "rogue", "e_titan": "barbarian", "e_knight": "knight",
	"e_swarm": "sk_minion", "e_blade": "hooded",
	"b_sking": "sk_warrior", "b_lord": "mage",
}

const ANIM_IDLE := "Idle"
const ANIM_WALK := "Walking_A"   # 实测：KayKit 里没有 Walk/Run，真实名字是 Walking_A / Running_A
const ANIM_RUN := "Running_A"
const ANIM_DEATH := "Death_A"
const ANIM_HIT := "Hit_A"
const ANIM_ATTACK_1H := "1H_Melee_Attack_Slice_Horizontal"
const ANIM_ATTACK_2H := "2H_Melee_Attack_Chop"
const ANIM_RANGED := "1H_Ranged_Shoot"
const ANIM_CAST := "2H_Ranged_Shoot"
## KayKit 角色高 2.17-3.44 m、棋盘格 2.2 m，缩到 0.62 让相邻单位不穿插
const BASE_SCALE := 0.62

var unit_id: String = ""
var star: int = 1
var is_ally: bool = true
var display_name: String = ""

var _model: Node3D = null
var _anim: AnimationPlayer = null
var _hp_fill: MeshInstance3D = null
var _hp_back: MeshInstance3D = null
var _stars: Node3D = null
var _flash: StandardMaterial3D = null
var _hp: float = 1.0
var _hp_ratio: float = 1.0
var _dying: bool = false


func setup(id: String, star_i: int, ally: bool) -> void:
	unit_id = id
	star = star_i
	is_ally = ally
	display_name = UnitTable.display(id) if UnitTable.has_id(id) else EnemyTable.display(id)
	name = "Unit_%s_%d" % [id, star_i]
	# 先摆血条与星级，再放模型：模型要把 Y 抬到格子上方
	_build_hp_bar()
	_build_stars()
	_build_model()


func _appearance_id() -> String:
	if UnitTable.has_id(unit_id):
		return unit_id
	if ENEMY_APPEARANCE.has(unit_id):
		return String(ENEMY_APPEARANCE[unit_id])
	return "knight"


func _build_model() -> void:
	var app := _appearance_id()
	var path := MODEL_DIR + UnitTable.model(app) + ".glb"
	if not ResourceLoader.exists(path):
		push_warning("缺少单位模型: " + path)
		return
	var packed: PackedScene = load(path)
	if packed == null:
		push_warning("模型加载失败: " + path)
		return
	_model = packed.instantiate()
	# KayKit 角色高 2.17–3.44 m、宽 1.94 m，棋盘格 2.2 m。缩到 0.62 让相邻单位不穿插
	_model.scale = Vector3.ONE * BASE_SCALE * UnitTable.scale_for(star)
	_model.position = Vector3.ZERO
	add_child(_model)
	_apply_weapon(app)
	_anim = _find_anim(_model)
	if _anim != null and _anim.has_animation(ANIM_IDLE):
		_anim.play(ANIM_IDLE)


func _find_anim(node: Node) -> AnimationPlayer:
	if node == null:
		return null
	if node is AnimationPlayer:
		return node
	for c in node.get_children():
		var r := _find_anim(c)
		if r != null:
			return r
	return null


## 隐藏全部武器节点，只露出该单位的那一个；骷髅走骨骼挂点
func _apply_weapon(app: String) -> void:
	for n in WEAPON_NODES:
		var node := _find_node(_model, n)
		if node is Node3D:
			(node as Node3D).visible = false
	var cfg: Dictionary = EQUIP.get(app, {})
	var want_node := String(cfg.get("node", ""))
	if want_node != "":
		var w := _find_node(_model, want_node)
		if w is Node3D:
			(w as Node3D).visible = true
			return
	var bone_weapon := String(cfg.get("bone_weapon", ""))
	if bone_weapon == "":
		return
	var hand := _find_node(_model, "hand.r")
	if hand == null or not (hand is Node3D):
		return
	var wpath := WEAPON_DIR + bone_weapon + ".gltf"
	if not ResourceLoader.exists(wpath):
		return
	var wp: PackedScene = load(wpath)
	if wp == null:
		return
	var attach := BoneAttachment3D.new()
	attach.name = "WeaponAttach"
	(hand as Node3D).add_child(attach)
	var w2 := wp.instantiate()
	# KayKit 武器与角色的尺度/朝向都不一致，这里是首版校准值（人验待调）
	w2.scale = Vector3.ONE * 0.62
	w2.rotation_degrees = Vector3(-90.0, 0.0, 0.0)
	attach.add_child(w2)


func _find_node(root: Node, n: String) -> Node:
	if root == null:
		return null
	if root.name == n:
		return root
	for c in root.get_children():
		var r := _find_node(c, n)
		if r != null:
			return r
	return null


func _build_hp_bar() -> void:
	var bar := Node3D.new()
	bar.name = "HpBar"
	bar.position = Vector3(0.0, 1.65, 0.0)
	add_child(bar)
	_hp_back = _make_quad(0.86, Color(0.08, 0.06, 0.06, 0.85))
	_hp_back.position = Vector3.ZERO
	bar.add_child(_hp_back)
	_hp_fill = _make_quad(0.82, Color(0.35, 0.85, 0.35, 0.95) if is_ally else Color(0.9, 0.35, 0.3, 0.95))
	_hp_fill.position = Vector3(0.0, 0.0, 0.01)
	bar.add_child(_hp_fill)


func _make_quad(w: float, col: Color) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var q := QuadMesh.new()
	q.size = Vector2(w, 0.11)
	mi.mesh = q
	var mat := StandardMaterial3D.new()
	mat.albedo_color = col
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.billboard_mode = BaseMaterial3D.BILLBOARD_ENABLED
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.no_depth_test = true
	mat.render_priority = 2
	mi.material_override = mat
	return mi


func _build_stars() -> void:
	_stars = Node3D.new()
	_stars.name = "Stars"
	_stars.position = Vector3(0.0, 1.82, 0.0)
	add_child(_stars)
	for i in range(star):
		var pip := _make_quad(0.12, Color(1.0, 0.85, 0.25, 0.95))
		pip.position = Vector3((float(i) - float(star - 1) * 0.5) * 0.14, 0.0, 0.0)
		_stars.add_child(pip)


func refresh() -> void:
	if _dying:
		return
	if _hp_fill != null:
		_hp_fill.scale.x = maxf(0.02, _hp_ratio)
		_hp_fill.position.x = -0.41 * (1.0 - _hp_ratio)


## 由 BattleDirector 每帧灌入 sim 的单位状态
func sync(unit: Dictionary) -> void:
	if _dying or unit == null:
		return
	_hp = float(unit["hp"])
	var max_hp := maxf(1.0, float(unit["max_hp"]))
	_hp_ratio = clampf(_hp / max_hp, 0.0, 1.0)
	if _hp_fill != null:
		_hp_fill.scale.x = maxf(0.02, _hp_ratio)
		_hp_fill.position.x = -0.41 * (1.0 - _hp_ratio)
		_hp_fill.visible = true
	# 敌方 tint 一下，便于一眼分辨敌我（不靠 HUD 标签，3D 场景里标签会被遮挡）
	if _model != null:
		_tint(Color(1, 1, 1) if is_ally else Color(1.0, 0.82, 0.78))


func _tint(c: Color) -> void:
	if _flash == null:
		_flash = StandardMaterial3D.new()
		_flash.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		_flash.albedo_color = c
	for n in _find_all(_model, "MeshInstance3D"):
		var mi: MeshInstance3D = n
		mi.material_overlay = null if c == Color(1, 1, 1) else _flash


func _find_all(root: Node, cls: String) -> Array:
	var out: Array = []
	if root == null:
		return out
	if root.is_class(cls):
		out.append(root)
	for c in root.get_children():
		out.append_array(_find_all(c, cls))
	return out


func play(anim: String) -> void:
	if _anim == null or _dying:
		return
	if not _anim.has_animation(anim):
		return
	if _anim.current_animation == anim:
		return
	_anim.play(anim)


func play_idle() -> void:
	play(ANIM_IDLE)


func play_move() -> void:
	for n in [ANIM_WALK, ANIM_RUN]:
		if _anim != null and _anim.has_animation(n):
			play(n)
			return
	play_idle()


func play_attack(ranged: bool, two_handed: bool = false) -> void:
	if ranged:
		play(ANIM_RANGED if _anim != null and _anim.has_animation(ANIM_RANGED) else ANIM_CAST)
	elif two_handed:
		play(ANIM_ATTACK_2H)
	else:
		play(ANIM_ATTACK_1H)


func play_hit() -> void:
	play(ANIM_HIT)
	if _model != null:
		var tw := create_tween()
		_tint(Color(1.0, 0.45, 0.4))
		tw.tween_interval(0.12)
		tw.tween_callback(func(): _tint(Color(1, 1, 1) if is_ally else Color(1.0, 0.82, 0.78)))


func play_cast() -> void:
	play(ANIM_CAST)


## 受击的「体积冲击」：纯闪红只有正对镜头时才看得见，而缩放脉冲是余光也能捕捉到的。
## 反馈要**叠层**（闪红 + 脉冲 + 伤害数字 + 音效），这是 06 实跑反馈总结出来的方法论。
func punch() -> void:
	var base := BASE_SCALE * UnitTable.scale_for(star)
	var tw := create_tween()
	tw.tween_property(self, "scale", Vector3.ONE * base * 1.18, 0.06)
	tw.tween_property(self, "scale", Vector3.ONE * base, 0.14)


func play_death() -> void:
	if _dying:
		return
	_dying = true
	play(ANIM_DEATH)
	if _hp_back != null:
		_hp_back.visible = false
	if _hp_fill != null:
		_hp_fill.visible = false
	if _stars != null:
		_stars.visible = false
	var tw := create_tween()
	tw.tween_interval(0.55)
	tw.tween_property(self, "scale", Vector3(0.01, 0.01, 0.01), 0.35)
	tw.tween_callback(queue_free)
