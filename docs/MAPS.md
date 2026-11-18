# Maps

## Overview

Maps are immutable resources that store spatial data.

A map represents a two-dimensional spatial domain containing sampled values.

Its semantics remain independent of the geometry or projection of the world.

Maps can store different value types, including scalars, vectors, matrices and other supported graph types.

Maps are explicitly created through graph operations.

Their dimensions, resolution and storage configuration are managed separately from the graph.

The execution system manages physical allocation, resource resolution and lifetime.

## Map Semantics

Every map represents a two-dimensional spatial domain.

A map can be interpreted as a square section of the world.

Its spatial representation does not change depending on how the world is projected or transformed.

World representation and projection are determined by project configuration.

For example, the same map can be projected onto:

- A flat surface.
- A spherical surface.
- A transformed or curved surface.

The map itself retains the same spatial semantics.

A map containing Vec3 values is still a two-dimensional map. Each cell simply stores a three-dimensional vector.

## Map Properties

A map is defined by:

- Resource identity.
- Value type.
- Two-dimensional resolution.
- Spatial domain.
- Storage configuration.

The exact storage representation is managed by the execution system.

Map dimensions and resolution are configuration properties rather than node properties.

## Map Value Types

A map can store any supported graph value type.

Examples:

| Map | Value type | Meaning |
|---|---|---|
| Elevation | F32 | Elevation at each position |
| Plate ID | U32 | Plate occupying each position |
| Plate Velocity | Vec3 | Plate velocity |
| Water Depth | F32 | Water depth |
| Water Velocity | Vec2 | Water velocity |
| Direction | Vec3 | Spatial direction |
| Geological Properties | Vec4 | Geological properties |

The value type describes the contents of each cell, not the dimensionality of the map.

Maps can also be used to store structured or multiple related values where supported by the type system.

## Map Creation

Maps are explicitly declared through graph operations.

A map creation or output operation connects a computation to a configured map resource.

For example:

```text
Elevation Field
      |
      v
  Map Output
      |
      v
 Elevation Map
```

The graph declares the resource and its computational origin.

The map configuration defines its resolution, spatial domain and storage requirements.

The graph does not directly allocate GPU memory.

## Resource Identity

Every created map has a unique resource identity.

Resource identity is independent of the graph or subgraph instance that produces or references the map.

However, maps are not globally addressable by default.

A graph can access a map only through:

- Its own graph connections.
- Explicit subgraph inputs.
- Explicit external graph inputs.

This ensures that resource dependencies remain visible in the graph structure.

A subgraph does not need to know where a map was created.

It only receives a reference to the resource.

## Resource References

Resource references identify existing map resources.

Passing a reference between graph boundaries does not copy the underlying data.

For example:

```text
Parent Graph
      |
      v
 Elevation Map
      |
      v
Erosion Subgraph
      |
      v
Eroded Elevation Map
```

Inside the subgraph, the elevation map is accessed through its input interface.

The resulting map is exposed through its output interface.

References can pass through multiple levels of nested subgraphs.

The execution system resolves references to their corresponding runtime resources.

## Map Immutability

Maps are immutable after creation.

A computation that produces new spatial data creates a new map resource.

It never modifies its input map.

For example:

```text
Elevation Initial
       |
       v
     Erosion
       |
       v
Elevation Eroded
       |
       v
   Hydraulics
       |
       v
Elevation Updated
```

Each map represents a distinct generation result.

Multiple computations can reference the same map without modifying it.

This ensures that computations always operate on well-defined input snapshots.

## Field Materialization

Fields describe spatial computations.

Maps store sampled results of those computations.

A field can be materialized by explicitly connecting it to a map creation or output operation.

For example:

```text
Elevation Field
       |
       v
   Map Output
       |
       v
  Elevation Map
```

The destination map is declared through the graph operation.

Its spatial configuration and storage requirements are defined externally.

Not every field needs to be materialized.

The execution system can inline single-use field computations into map generation.

Shared computations can be reused or materialized when appropriate.

See [Fields](FIELDS.md).

## Map Access

Maps can be referenced by multiple computational processes.

Examples:

- Hydraulics reads elevation.
- Erosion reads elevation and produces a new elevation map.
- Tectonics reads plate identity and velocity.
- Climate calculations read elevation and moisture.
- Vegetation calculations read moisture and temperature.

This allows processes to share immutable data without depending on one another's internal graph structures.

## Maps and Simulation

Simulation loops can carry map references between iterations.

A loop receives maps through its inputs and produces new map versions through its outputs.

For example:

```text
Initial Elevation
       |
       v
 Simulation Loop
       |
       +-- Tick 0: Elevation₀
       |
       +-- Tick 1: Elevation₁
       |
       +-- Tick 2: Elevation₂
       |
       v
 Final Elevation
```

Maps do not require a separate simulation-state type.

The loop defines which map references persist between ticks.

Intermediate maps created within a tick do not automatically persist.

See [Simulation](SIMULATION.md).

## Resource Lifetime

Resource lifetime is managed by the execution system.

A resource remains available while it is required by:

- Pending graph computations.
- Subgraph consumers.
- Simulation loop inputs and outputs.
- Retained generation results.
- Explicit persistence requirements.

Temporary resources can be released when their dependencies have completed.

Persistent resources remain available for subsequent graph execution or external use.

Logical resource lifetime is independent of physical GPU allocation.

The execution system can reuse physical storage when a resource is no longer needed, provided its logical value remains valid for all required consumers.

## Resource Validation

The execution system validates map references before GPU execution.

Validation includes:

- Resource existence.
- Value type compatibility.
- Spatial domain compatibility.
- Resolution compatibility.
- Resource lifetime.
- Valid access through graph interfaces.

Invalid references must be detected before dispatch.

## GPU Storage

Maps are backed by GPU resources.

The execution system manages their allocation, synchronization and lifetime.

The underlying representation may vary depending on:

- Value type.
- Resolution.
- Access patterns.
- GPU requirements.
- Storage requirements.

Maps should remain GPU-side wherever possible.

Physical resource reuse must not change logical map identity or immutability.

## Map Design Principles

1. Maps store sampled spatial data.
2. Every map represents a two-dimensional spatial domain.
3. Map semantics are independent of world projection.
4. Maps can store any supported graph value type.
5. Maps are explicitly declared through graph operations.
6. Map configuration is separate from graph computation.
7. Every created map has a unique resource identity.
8. Maps are accessible through explicit graph interfaces and connections.
9. Passing a map reference does not copy its data.
10. Maps are immutable after creation.
11. New results receive new resource identities.
12. Fields can be materialized into maps.
13. Simulation loops explicitly carry map references between ticks.
14. Resource allocation and lifetime belong to the execution system.