# Procedural World Generation

## 1. Overview

The project is a procedural world-generation editor based on a visual node graph.

Users construct computational graphs that describe how a world is generated and how its properties evolve through simulation.

The graph is compiled to WGSL and executed through GPU compute shaders.

The system is designed around a few central concepts:

- **Configuration** defines the world and its resources.
- **Graphs** describe computations.
- **Fields** describe spatially distributed values.
- **Maps** store spatial data.
- **References** connect computations to fields and resources.
- **Simulation state** stores persistent data that evolves over iterations.
- **Subgraphs** encapsulate reusable computations.
- **The execution system** compiles, schedules, and executes computations on the GPU.

The project focuses entirely on world-generation data and simulation. Rendering, meshes, materials, colors, and other presentation concerns are outside its scope.

## 2. Architecture

The architecture is divided into separate responsibilities.

### Configuration

Configuration defines the environment in which computations execute.

It includes:

- World representation.
- World dimensions and bounds.
- World size and center.
- Chunk dimensions and layout.
- Map resources and their properties.
- Simulation settings.
- Execution settings.

Configuration is managed separately from the node graph.

Nodes must not create or configure worlds, chunks, maps, or simulations. They consume the configuration supplied by the execution system.

### Graph

The graph describes computations.

It consists of nodes connected through typed input and output ports.

The graph is responsible for describing what should be calculated, not how resources are allocated or how the computation is dispatched.

Ordinary graphs are acyclic.

Feedback is handled through the simulation state mechanism rather than arbitrary graph cycles.

### Fields

Fields describe values distributed throughout space.

A field can represent any spatial property, including:

- Elevation.
- Temperature.
- Moisture.
- Density.
- Pressure.
- Velocity.
- Water depth.
- Sediment.
- Geological composition.
- Plate identity.

Fields are computations, not necessarily allocated storage.

### Maps

Maps are allocated resources that store spatial data.

They allow computations to share data and provide persistent storage for simulation state.

Map configuration and allocation are managed outside the graph.

### Simulation

Simulation provides persistent state and controlled feedback between iterations.

Processes read the current state and produce updates that become available at defined commit boundaries.

### Execution

The execution system compiles graphs to WGSL, manages GPU resources, determines execution order, and dispatches compute shaders.

## 3. Core Types

The type system describes the data passed between nodes.

### Scalar types

- `F16`
- `F32`
- `I32`
- `U32`
- `Bool`

### Vector types

- `Vec2`
- `Vec3`
- `Vec4`

### Matrix types

- `Mat2`
- `Mat3`
- `Mat4`

World-generation concepts such as positions, directions, elevation, and moisture use these existing types.

They do not require dedicated types.

For example:

- A position is represented by `Vec3`.
- A direction is represented by `Vec3`.
- Elevation is represented by `F32`.
- Moisture is represented by `F32`.
- Plate velocity is represented by `Vec3`.

The type system describes the underlying data representation. Domain-specific meaning comes from how values are used in the graph.

## 4. Configuration

Configuration is separate from the graph.

The project configuration defines the resources and context available to computations.

### World configuration

Defines the world in which computations operate.

Properties include:

- Representation: Flat, Circular, Periodic, or Spherical.
- Dimensions.
- Size.
- Center.
- Bounds.

The world representation determines the coordinate system and spatial behavior used by applicable operations.

Boundary checks, coordinate wrapping, and other domain-specific behavior are implemented through subgraphs or reusable computations.

### Chunk configuration

Defines how the world is partitioned.

Properties include:

- Chunk dimensions.
- Chunk resolution.
- Chunk layout.

Chunk configuration is independent of the world representation.

### Map configuration

Defines the spatial resources available to computations.

Properties include:

- Resource identity.
- Resolution.
- Dimensions.
- Data format.
- Storage configuration.

Maps can store scalar or vector fields.

### Simulation configuration

Defines how a simulation is executed.

Properties include:

- Iteration count.
- Execution stages.
- Initial state.
- State resources.
- Update and commit policies.

Simulation configuration does not belong inside the graph.

## 5. Graph Nodes

The node library is intentionally kept small.

Related operations are grouped into configurable nodes. Higher-level functionality is implemented through subgraphs.

Nodes perform computations and access configuration or resources through defined execution interfaces.

### Value

Provides a constant value of a selected type.

Supported values:

- Scalar.
- Boolean.
- Integer.
- Vector.
- Matrix.

The selected type determines the available value controls and output type.

### Math

Provides scalar mathematical operations.

Operations:

- Add.
- Subtract.
- Multiply.
- Divide.
- Modulo.
- Minimum.
- Maximum.
- Clamp.
- Lerp.
- Remap.
- Absolute.
- Negate.
- Power.
- Square Root.
- Exponential.
- Logarithm.
- Sine.
- Cosine.
- Floor.
- Ceil.
- Round.
- Fraction.
- Sign.
- Step.
- Smoothstep.

### Vector Math

Provides vector operations.

Operations:

- Add.
- Subtract.
- Multiply.
- Divide.
- Dot Product.
- Cross Product.
- Normalize.
- Length.
- Distance.
- Direction.
- Reflect.

### Vector Components

Provides vector construction and component access.

Operations:

- Combine components into a vector.
- Split a vector into components.

The vector dimension determines the available components.

### Matrix Math

Provides matrix operations.

Operations:

- Matrix multiplication.
- Matrix addition.
- Matrix subtraction.
- Matrix transpose.
- Matrix inverse.
- Matrix determinant.
- Matrix-vector multiplication.

### Spherical Coordinates

Converts between spherical coordinates and Cartesian coordinates.

Inputs:

- Longitude.
- Latitude.
- Altitude.

Outputs:

- Cartesian position.
- Longitude.
- Latitude.
- Altitude.

The conversion follows the active spherical world configuration.

### Chunk Coordinates

Provides conversions and indexing between world positions and chunks.

Operations:

- World position to chunk coordinate.
- Chunk coordinate to world position.
- Calculate local chunk coordinates.
- Calculate local chunk index.

Chunk dimensions and layout are obtained from project configuration.

### Spatial Transform

Applies spatial transformations.

Operations:

- Translation.
- Rotation.
- Scale.
- Transform composition.
- Inverse transform.

### Neighborhood

Generates positions around an input position for local spatial evaluation.

Configuration:

- Neighborhood dimensions.
- Neighborhood shape.
- Sampling distance.

Inputs:

- Center position.

Outputs:

- Sample positions.

The neighborhood can operate in world or chunk coordinates.

### Field Input

References an existing field or map resource.

It allows computations to consume spatial data without knowing how that resource is allocated or stored.

### Field Output

Exposes a computed field as an output of a graph or subgraph.

It does not automatically allocate map storage.

### Sample Field

Samples a field at a position.

Inputs:

- Field reference.
- Position.

Outputs:

- Sampled value.

### Store Field

Evaluates a field and writes its values into a configured map resource.

Inputs:

- Field.
- Destination map.

Storage allocation and map configuration are managed by the execution system.

### Combine Fields

Combines multiple fields.

Operations:

- Add.
- Subtract.
- Multiply.
- Divide.
- Minimum.
- Maximum.
- Blend.

### Transform Field

Transforms field values.

Operations:

- Scale.
- Offset.
- Clamp.
- Remap.
- Normalize.

### Field Analysis

Provides analytical operations on fields.

Operations:

- Gradient.
- Minimum and maximum range.

### State Input

Reads a value from the current simulation state.

Inputs:

- State resource.
- Position or index, where applicable.

Outputs:

- Current state value.

### State Output

Produces an updated value for a simulation state resource.

Inputs:

- Updated value.
- Position or index, where applicable.

State updates are committed according to the simulation's execution stages and update policy.

## 6. Fields

Fields represent spatially distributed values.

A field describes a computation that produces a value for a given position.

For example, an elevation field could be defined as:

\[
E(p) = B(p) + M(p)
\]

Where:

- \(E(p)\) is the resulting elevation.
- \(B(p)\) is the base elevation.
- \(M(p)\) is the mountain contribution.
- \(p\) is a world position.

Fields can be composed from other fields and ordinary graph operations.

### Field computation

A field computation describes how values are calculated.

For example:

```text
Position
   |
   v
Base Elevation
   |
   +------ Mountain Height
   |              |
   v              v
   +---- Add -----+
          |
          v
    Elevation Field
```

A field computation does not inherently require allocated storage.

It can be evaluated directly, used by another computation, or materialized into a map.

### Field evaluation

A field can be evaluated at a particular position.

For example:

```text
Field + Position
       |
       v
  Sample Field
       |
       v
   Scalar Value
```

This allows computations to use spatial data without requiring every intermediate result to be stored.

### Field composition

Fields can reference other fields.

This allows complex spatial computations to be built from smaller reusable definitions.

For example:

```text
Base Elevation
      |
      +---- Mountain Field
      |
      +---- River Erosion Field
      |
      v
  Combine Fields
      |
      v
 Final Elevation
```

### Field materialization

A field can be evaluated over a configured spatial domain and stored in a map.

This process is called materialization.

Materialization is useful when:

- A field is reused by multiple processes.
- A field is needed by simulation state.
- Random access to spatial values is required.
- Recomputing the field would be expensive.
- A computation requires neighboring spatial values.

Not every field needs to be materialized.

The execution system should determine whether a field can be evaluated directly or should be stored, based on its usage and execution requirements.

## 7. Maps and Resource References

Maps provide allocated storage for spatial data.

They are configured and allocated outside the graph.

A map has a resource identity that allows multiple graphs and processes to reference the same data.

### Map properties

A map is defined by:

- Resource identity.
- Data type.
- Resolution.
- Dimensions.
- Storage configuration.

Examples:

| Map | Type | Example resolution |
|---|---|---|
| Elevation | F32 | 2048 × 1024 |
| Plate ID | U32 | 2048 × 1024 |
| Plate Velocity | Vec3 | 2048 × 1024 |
| Water Depth | F32 | 2048 × 1024 |
| Sediment | F32 | 2048 × 1024 |

The dimensions and resolution are examples, not fixed requirements.

### Resource references

Nodes reference maps through resource identities.

A resource reference identifies which data a computation should access.

For example:

```text
Field Input: Elevation
       |
       v
   Sample Field
       |
       v
  Elevation Value
```

The graph does not need to know how the map is allocated, which GPU buffer backs it, or how memory is managed.

Those responsibilities belong to the execution system.

### Field versus map

A field and a map are not the same thing.

| Property | Field | Map |
|---|---|---|
| Describes a spatial computation | Yes | No |
| Stores spatial values | Not necessarily | Yes |
| Requires allocated storage | No | Yes |
| Can be sampled | Yes | Yes |
| Can be composed with other fields | Yes | No, it is a resource |
| Can persist between iterations | Not inherently | Yes |
| Can represent simulation state | Not by itself | Yes |

A field can be evaluated directly or materialized into a map.

A map can be referenced by multiple computations.

A map can also be used as persistent simulation state.

## 8. Simulation and Persistent State

Simulation allows computations to evolve over multiple iterations.

Unlike ordinary intermediate values, simulation state persists between iterations.

A simulation can contain multiple state resources, such as:

- Elevation.
- Plate identity.
- Plate position.
- Plate velocity.
- Crust thickness.
- Water depth.
- Sediment distribution.

These resources are backed by maps.

Simulation state uses the same underlying map resource system, but has additional lifecycle and iteration semantics.

### State reads

Processes read the current simulation state.

For example:

```text
State Input: Elevation
State Input: Plate ID
State Input: Plate Velocity
State Input: Water Depth
```

All reads within a synchronous execution stage observe the same state snapshot.

### State updates

Processes calculate updated values and produce state updates.

For example:

```text
Current Elevation
       |
       v
 Hydraulic Erosion
       |
       v
Updated Elevation
       |
       v
 State Output
```

State outputs do not immediately modify the current state.

They produce updates that are committed at a defined boundary.

### State commits

At a commit boundary:

1. All required updates are completed.
2. Updates are written into the next state.
3. The next state becomes the current state.
4. The next execution stage or iteration begins.

This prevents computations from reading partially updated state.

### Feedback iterations

Ordinary graphs remain acyclic.

Feedback occurs across simulation iterations.

Conceptually:

```text
Simulation State (n)
        |
        v
    Processes
        |
        v
   State Updates
        |
        v
   Commit State
        |
        v
Simulation State (n + 1)
        |
        +------ Next iteration
```

This allows processes to influence one another over time without introducing arbitrary cyclic dependencies into ordinary graphs.

## 9. Coupled Simulations

The simulation system must support multiple processes that influence shared state.

For example, tectonic movement, elevation changes, and hydraulics are coupled.

A change in one process can affect the input of another process, which can then influence the original process in a later iteration.

### Example: Continental plates

A tectonic simulation could maintain:

- Plate identity.
- Plate position.
- Plate velocity.
- Plate shape.
- Crust thickness.
- Elevation.

The tectonic process reads the current plate and terrain state.

It calculates plate forces, deformation, and movement, then produces state updates.

### Example: Hydraulics

A hydraulic process could maintain:

- Water depth.
- Water velocity.
- Sediment distribution.
- Erosion.
- Deposition.

It reads elevation and water state.

It calculates flow, erosion, and sediment transport, then produces state updates.

### Example: Coupled execution

A combined simulation could execute the following stages:

```text
Current Simulation State
          |
          v
   Tectonic Processes
          |
          v
   Plate State Updates
          |
          v
      Commit Stage
          |
          v
    Hydraulic Processes
          |
          v
 Elevation and Water Updates
          |
          v
      Commit Stage
          |
          v
  Plate Deformation Processes
          |
          v
   Plate Shape Updates
          |
          v
      Commit Stage
          |
          v
    Next Simulation State
```

This is an illustrative execution order. The actual stages and dependencies are defined by simulation configuration.

The important requirement is that processes can influence one another through shared state.

For example:

1. Tectonic movement changes plate positions.
2. Plate movement changes elevation.
3. Hydraulics reacts to the new elevation.
4. Erosion changes the terrain.
5. The changed terrain influences plate deformation.
6. The next iteration uses the resulting state.

This creates feedback between geological and hydraulic processes.

## 10. Simulation Execution Model

I recommend synchronous state updates as the default.

Every process in an execution stage reads the same state snapshot.

Updates are committed together at the stage boundary.

For processes that depend on the output of earlier processes, explicit execution stages define their order.

This provides two execution modes:

### Parallel processes

Processes in the same stage can execute independently.

They read the same current state and produce separate updates.

### Ordered processes

Processes in different stages execute in a defined order.

A later stage can read state committed by an earlier stage.

This gives us predictable feedback while allowing parallel GPU execution where dependencies permit it.

### GPU state storage

Simulation state can use ping-pong buffers.

- Read from the current state buffers.
- Write updates into the next state buffers.
- Swap them at the commit boundary.

This avoids reading partially updated data and supports parallel compute dispatches.

The exact resource strategy can be optimized by the execution system.

## 11. Subgraphs

Subgraphs allow users to encapsulate and reuse computations.

A subgraph has defined inputs and outputs but otherwise behaves like any other graph.

Subgraphs can contain other subgraphs.

They are the primary mechanism for building higher-level world-generation functionality.

Examples include:

### Spatial subgraphs

- World boundary checks.
- Circular boundary checks.
- Periodic coordinate wrapping.
- Distance to a circle.
- Distance to a box.
- Smooth boundary falloff.
- Neighborhood calculations.

### Terrain subgraphs

- Mountain generation.
- Terrain masks.
- Terrain blending.
- River networks.
- Terrain erosion.
- Sediment transport.

### Geological subgraphs

- Plate generation.
- Plate movement.
- Plate deformation.
- Crust thickness.
- Continental collision.
- Subduction.

### Climate subgraphs

- Temperature calculations.
- Moisture distribution.
- Atmospheric processes.
- Precipitation.

### Other world-generation subgraphs

- Vegetation distribution.
- Biome calculations.
- Geological composition.

These are user-defined computations built from the available node library.

They should not become individual built-in nodes unless a reusable primitive is required by many different computations.

## 12. Execution Pipeline

The graph is compiled to WGSL and executed through GPU compute shaders.

The execution system is responsible for turning the graph and its resource references into an executable GPU workload.

The conceptual pipeline is:

```text
Project Configuration
        |
        v
 Resource Resolution
        |
        v
  Graph Compilation
        |
        v
 Dependency Analysis
        |
        v
 Resource Allocation
        |
        v
 Execution Scheduling
        |
        v
   WGSL Generation
        |
        v
 GPU Compute Dispatch
        |
        v
  State Commit / Output
```

### Compilation

The compiler translates graph computations into WGSL.

It determines the required operations, types, and dependencies.

### Resource resolution

Resource references are resolved against project configuration.

This includes maps and simulation state resources.

### Dependency analysis

The execution system determines which computations depend on others.

It also identifies independent computations that can execute in parallel.

### Resource allocation

The execution system allocates the GPU resources required by the computation.

This includes map storage, temporary resources, and simulation state buffers.

### Scheduling

The execution system determines the order of operations and compute dispatches.

Simulation stages and state commit boundaries are respected.

### GPU execution

Compute shaders execute the compiled computations.

Intermediate computations should remain GPU-side wherever possible.

## 13. Architectural Principles

The architecture follows these principles:

1. **Configuration is separate from computation.** World, chunk, map, and simulation settings do not belong inside nodes.
2. **Nodes describe operations.** They do not manage resource allocation or execution lifecycle.
3. **Types describe data representation.** Domain concepts do not require dedicated types unless their representation genuinely differs.
4. **Fields describe spatial computations.** They do not inherently require allocated storage.
5. **Maps store spatial data.** They are configured and allocated outside the graph.
6. **Resources are referenced by identity.** Graphs do not own the resources they consume.
7. **Simulation state is persistent.** It is backed by map resources and evolves through controlled updates.
8. **Feedback occurs across iterations.** Ordinary graphs remain acyclic.
9. **State updates have explicit commit boundaries.** Processes do not observe partially updated state.
10. **Subgraphs provide higher-level functionality.** Specialized world-generation algorithms are built from reusable primitives.
11. **Execution is GPU-oriented.** Compilation, resource management, scheduling, and dispatch are handled by the execution system.
12. **World generation is the scope.** Rendering and presentation-specific concerns are excluded.

## 14. Open Architectural Decisions

The following details still need to be settled during implementation and design.

### Field evaluation and materialization

The execution system needs to decide when a field is evaluated directly and when it should be materialized into a map.

This can depend on reuse, computational cost, random access, and simulation requirements.

### Resource identity and references

The resource reference system needs a stable way to identify configured maps and simulation state resources.

It should also validate type and dimensional compatibility.

### Field dependencies

The compiler needs to determine how field references are expanded, shared, cached, or materialized.

### Simulation update policies

The exact commit boundaries and update policies need to support both parallel processes and explicitly ordered stages.

### Spatial resolution

The relationship between world dimensions, chunk layout, map resolution, and field sampling needs to be defined precisely.

### GPU resource management

The execution system needs to determine how maps, temporary resources, and simulation state are allocated, reused, and released.

---

## 15. Summary

The system is built around a separation of configuration, computation, storage, and execution.

- Configuration defines the world and its resources.
- Graphs describe computations.
- Fields describe spatial values and how they are calculated.
- Maps store spatial values.
- References connect computations to resources.
- Simulation state provides persistent data across iterations.
- Subgraphs encapsulate reusable algorithms.
- The execution system compiles and schedules GPU computations.

This architecture allows users to construct complex procedural worlds and coupled simulations while keeping the underlying graph system relatively small, composable, and predictable.