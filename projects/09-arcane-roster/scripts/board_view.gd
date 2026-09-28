extends Node3D
class_name BoardView
## 棋盘的表现层：格子、阵营分区、单位摆放。
##
## **这一层不许有任何战斗逻辑**。它只做三件事：
##   1. 把 sim 的 (row, col) 变成世界坐标（Board.cell_to_world 是唯一口径）
##   2. 收发单位视图（谁上板、谁站哪格）
##   3. 高亮（可上阵 / 悬停 / 选中）
##
## 棋盘格子用**薄板 + 描边材质**而不是 64 个 CollisionShape3D：
## 本作没有物理交互（自走棋不需要推挤与碰撞），省掉 64 个碰撞体既是性能也是可读性。

const CELL := Board.CELL

@onready var _cells_root: Node3D = $Cells
@onready var _units_root: Node3D = $Units
@onready var _markers_root: Node3D = $Markers

var _cell_nodes: Dictionary = {}      # Vector2i -> MeshInstance3D
var _unit_views: Dictionary = {}      # board index -> UnitView
var _hover: Vector2i = Vector2i(-1, -1)
var _selected_bench: int = -1
var _selected_cell: Vector2i = Vector2i(-1, -1)   # 手动摆位：当前选中的场上格子


func build() -> void:
	for cell in Board.all_cells():
		_cell_nodes[cell] = _make_cell(cell)
	_refresh_tints()


func _make_cell(cell: Vector2i) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(CELL * 0.94, 0.06, CELL * 0.94)
	mi.mesh = box
	mi.position = Board.cell_to_world(cell)
	mi.name = "Cell_%d_%d" % [cell.x, cell.y]
	_cells_root.add_child(mi)
	return mi


## 阵营底色：我方暖色、敌方冷色，备战阶段最亮，战斗阶段压暗
func _refresh_tints() -> void:
	for cell in Board.all_cells():
		var mi: MeshInstance3D = _cell_nodes[cell]
		var mat := StandardMaterial3D.new()
		mat.albedo_color = _tint_for(cell)
		mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		mi.material_override = mat


func _tint_for(cell: Vector2i) -> Color:
	var base := Color(0.42, 0.36, 0.30, 0.35) if Board.ALLY_ROWS.has(cell.y) else Color(0.26, 0.32, 0.42, 0.35)
	# 手动摆位的三层高亮，亮度递增：可落区 < 悬停 < 已选中
	if cell == _selected_cell:
		return Color(0.95, 0.85, 0.45, 0.65)
	if _hover == cell and Board.ALLY_ROWS.has(cell.y):
		return Color(0.95, 0.85, 0.45, 0.45)
	if _selected_bench >= 0 and Board.ALLY_ROWS.has(cell.y):
		return Color(0.55, 0.70, 0.45, 0.42)
	return base


func set_hover(cell: Vector2i) -> void:
	if _hover == cell:
		return
	_hover = cell
	_refresh_tints()


## 手动摆位：选中场上单位所在格（移动模式的起点）
func set_selected_cell(cell: Vector2i) -> void:
	if _selected_cell == cell:
		return
	_selected_cell = cell
	_refresh_tints()


func set_selected_bench(index: int) -> void:
	_selected_bench = index
	_refresh_tints()


func world_to_cell(world: Vector3) -> Vector2i:
	return Board.world_to_cell(world)


## 上板。返回 UnitView 供上层拿引用
func place_unit(index: int, unit: Dictionary) -> UnitView:
	var view := UnitView.new()
	view.setup(String(unit["id"]), int(unit["star"]), bool(unit["is_ally"]))
	view.position = Board.cell_to_world(unit["cell"])
	_units_root.add_child(view)
	_unit_views[index] = view
	return view


func move_unit(index: int, cell: Vector2i) -> void:
	if not _unit_views.has(index):
		return
	var view: UnitView = _unit_views[index]
	var tw := create_tween()
	tw.tween_property(view, "position", Board.cell_to_world(cell), 0.18)


func get_view(index: int) -> UnitView:
	if _unit_views.has(index):
		return _unit_views[index]
	return null


func clear_units() -> void:
	for key in _unit_views:
		var v: UnitView = _unit_views[key]
		if is_instance_valid(v):
			v.queue_free()
	_unit_views.clear()


## 血条/星级变化时刷新
func refresh_all() -> void:
	for key in _unit_views:
		var v: UnitView = _unit_views[key]
		if is_instance_valid(v):
			v.refresh()
