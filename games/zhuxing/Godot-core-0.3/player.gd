extends CharacterBody3D
var world: Node3D
var camera: Camera3D
var pitch := 0.0
var piloting := false
var test_walk := false
var previous_up := Vector3.UP

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_PAUSABLE
	floor_snap_length = 0.3
	floor_max_angle = deg_to_rad(55)
	var collider := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.4
	capsule.height = 1.75
	collider.shape = capsule
	collider.position.y = 0.9
	add_child(collider)
	camera = Camera3D.new()
	camera.position.y = 1.65
	camera.near = 0.06
	camera.far = 20000
	camera.fov = 76
	add_child(camera)

func _unhandled_input(event: InputEvent) -> void:
	if piloting or get_tree().paused:
		return
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		rotate_object_local(Vector3.UP, -event.relative.x * 0.002)
		pitch = clampf(pitch - event.relative.y * 0.002, -1.45, 1.45)
		camera.rotation.x = pitch

func _physics_process(delta: float) -> void:
	if piloting:
		return
	var planet: Dictionary = world.nearest_planet(global_position)
	var n: Vector3 = (global_position - planet.center).normalized()
	# Rebuild from the tangent frame. Tiny arc quaternions can round to identity
	# at 120 Hz and accumulate a fixed world-up orientation near the equator.
	var forward := (-global_basis.z).slide(n).normalized()
	if forward.length_squared() < 0.001:
		forward = global_basis.x.cross(n).normalized()
	var right := forward.cross(n).normalized()
	global_basis = Basis(right, n, right.cross(n)).orthonormalized()
	previous_up = n
	up_direction = n
	var input := Input.get_vector("left", "right", "forward", "back")
	if test_walk:
		input = Vector2(0, -1)
	var wish := (global_basis.x * input.x + global_basis.z * input.y).slide(n).normalized()
	var radial := n * velocity.dot(n)
	var tangent := velocity - radial
	var speed := 8.0 if Input.is_action_pressed("sprint") else 5.0
	if is_on_floor():
		tangent = tangent.lerp(wish * speed, 1.0 - exp(-16.0 * delta))
		velocity = radial + tangent
		if Input.is_action_just_pressed("up"):
			velocity += n * 5.5
	else:
		velocity += wish * 2.5 * delta
		if Input.is_action_pressed("up"):
			velocity += n * 12.0 * delta
	velocity += world.gravity_at(global_position) * delta
	move_and_slide()

func set_piloting(value: bool) -> void:
	piloting = value
	collision_layer = 0 if value else 1
	collision_mask = 0 if value else 1
