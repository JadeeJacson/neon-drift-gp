extends RigidBody3D
var world: Node3D
var piloting := false
var third_person := false
var test_lift := false
var mouse_command := Vector2.ZERO
var cockpit: Camera3D
var chase: Camera3D

func material(color: Color) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = color
	m.roughness = 0.8
	return m

func add_mesh(shape: Mesh, at: Vector3, color: Color) -> MeshInstance3D:
	var m := MeshInstance3D.new()
	m.mesh = shape
	m.material_override = material(color)
	m.position = at
	add_child(m)
	return m

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_PAUSABLE
	custom_integrator = true
	gravity_scale = 0
	mass = 1500
	can_sleep = false
	continuous_cd = true
	linear_damp_mode = RigidBody3D.DAMP_MODE_REPLACE
	linear_damp = 0
	angular_damp_mode = RigidBody3D.DAMP_MODE_REPLACE
	angular_damp = 0
	var contact := PhysicsMaterial.new()
	contact.friction = 0.7
	contact.bounce = 0.05
	physics_material_override = contact
	var collision := CollisionShape3D.new()
	var hull := SphereShape3D.new()
	hull.radius = 2.6
	collision.shape = hull
	add_child(collision)
	var body := SphereMesh.new()
	body.radius = 2.25
	body.height = 4.5
	body.radial_segments = 16
	body.rings = 8
	add_mesh(body, Vector3.ZERO, Color("d2c9a7"))
	var glass := SphereMesh.new()
	glass.radius = 1.65
	glass.height = 3.3
	var nose := add_mesh(glass, Vector3(0, 0.5, -1.25), Color("4e8995"))
	nose.scale = Vector3(1, 0.8, 0.7)
	for side in [-1, 1]:
		var tank := CylinderMesh.new()
		tank.top_radius = 0.65
		tank.bottom_radius = 0.65
		tank.height = 3.5
		var t := add_mesh(tank, Vector3(side * 2.6, -0.2, 0.3), Color("d0ad64"))
		t.rotation.x = PI / 2
	for x in [-1, 1]:
		for z in [-1, 1]:
			var leg := CylinderMesh.new()
			leg.top_radius = 0.1
			leg.bottom_radius = 0.13
			leg.height = 1.8
			add_mesh(leg, Vector3(x*1.7,-1.65,z*1.5),Color("52636a"))
			var pad := CylinderMesh.new()
			pad.top_radius = 0.45
			pad.bottom_radius = 0.5
			pad.height = 0.12
			add_mesh(pad, Vector3(x*1.7,-2.55,z*1.5),Color("2d404b"))
	cockpit = Camera3D.new()
	cockpit.position = Vector3(0, 0.7, -1.6)
	cockpit.near = 0.06
	cockpit.far = 20000
	cockpit.fov = 76
	add_child(cockpit)
	chase = Camera3D.new()
	chase.position = Vector3(0, 5.5, 16)
	chase.rotation.x = -0.25
	chase.far = 20000
	add_child(chase)

func _unhandled_input(event: InputEvent) -> void:
	if not piloting or get_tree().paused:
		return
	if event is InputEventMouseMotion and Input.mouse_mode == Input.MOUSE_MODE_CAPTURED:
		mouse_command += event.relative * 0.002

func _integrate_forces(state: PhysicsDirectBodyState3D) -> void:
	var dt := state.step
	var acceleration: Vector3 = world.gravity_at(state.transform.origin)
	if piloting:
		var thrust := Vector3(
			float(Input.is_action_pressed("right")) - float(Input.is_action_pressed("left")),
			float(Input.is_action_pressed("up") or test_lift) - float(Input.is_action_pressed("down")),
			float(Input.is_action_pressed("back")) - float(Input.is_action_pressed("forward")))
		acceleration += state.transform.basis * (thrust * Vector3(12, 20, 18))
		if Input.is_action_pressed("brake"):
			acceleration += -state.linear_velocity.normalized() * minf(6, state.linear_velocity.length() / dt)
		var roll := float(Input.is_action_pressed("roll_left")) - float(Input.is_action_pressed("roll_right"))
		var cmd := Vector3(-mouse_command.y / dt, -mouse_command.x / dt, roll * 1.2)
		state.angular_velocity = state.angular_velocity.lerp(state.transform.basis * cmd, 0.55)
		mouse_command = Vector2.ZERO
	else:
		state.angular_velocity *= exp(-2 * dt)
	state.linear_velocity += acceleration * dt
	# Gentle surface alignment, only while nearly stopped and touching ground.
	var p: Dictionary = world.nearest_planet(state.transform.origin)
	var n: Vector3 = (state.transform.origin - p.center).normalized()
	var altitude: float = state.transform.origin.distance_to(p.center) - p.radius
	if altitude < 2.85 and state.linear_velocity.length() < 4:
		var forward: Vector3 = (-state.transform.basis.z).slide(n).normalized()
		if forward.length_squared() > 0.1:
			var right := forward.cross(n).normalized()
			var ideal := Basis(right, n, right.cross(n))
			var t := state.transform
			t.basis = t.basis.slerp(ideal, 1.0 - exp(-dt * 2)).orthonormalized()
			state.transform = t

func switch_view() -> void:
	third_person = not third_person
	(chase if third_person else cockpit).make_current()
