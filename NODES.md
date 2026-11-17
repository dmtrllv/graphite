# Nodes

## 1. World

The world defines the spatial model in which all world-generation computations operate.

A world is not necessarily a flat plane. Different representations have different coordinate systems, boundaries and spatial rules.

Initial world representations:

- **Flat**: a planar world with optional boundaries.
- **Circular**: a planar world bounded by a circle.
- **Periodic**: a flat world where crossing one boundary wraps around to the opposite side.
- **Spherical**: a spherical world with longitude and latitude.

The world representation determines which spatial operations are available and how they behave.

Chunking is independent of world representation. It is a partitioning mechanism that can be used by different world types.

### World nodes

- `World Context`: provides the active world configuration.
- `World Bounds`: returns the world boundaries.
- `World Dimensions`: returns the world dimensions.
- `World Center`: returns the world center.
- `World Size`: returns the world size.
- `World Boundary`: checks whether a position is inside the world.

## 2. Coordinates and Positions

Coordinates describe locations within the world. They should not be treated as ordinary vectors because their meaning depends on the world representation.

### General position nodes

- `World Position`: represents a position in world coordinates.
- `World Position Split`: separates a position into components.
- `World Position Combine`: constructs a position from components.
- `World Distance`: calculates the distance between two positions.
- `World Direction`: calculates the direction between two positions.
- `World Normalize Position`: converts a position into normalized world coordinates.

### Representation-specific position nodes

**Flat / Periodic / Circular**

- `World XY`: extracts planar coordinates.
- `World Position From XY`: constructs a planar position.

**Spherical**

- `Longitude`: extracts longitude.
- `Latitude`: extracts latitude.
- `Altitude`: extracts altitude.
- `Spherical Position`: constructs a position from longitude, latitude and altitude.

## 3. Chunks

Chunks divide a world into smaller spatial regions. They allow the system to process, store and update parts of a world independently.

Chunk operations should work with the world's coordinate system rather than assuming a particular world representation.

- `Chunk Position`: represents a chunk coordinate.
- `Chunk Size`: returns the dimensions of a chunk.
- `Chunk Bounds`: returns the world-space bounds of a chunk.
- `World To Chunk`: converts a world position into a chunk coordinate.
- `Chunk To World`: converts a chunk coordinate into a world position.
- `Chunk Index`: calculates a local index within a chunk.
- `Chunk Neighbors`: returns neighboring chunks.
- `Chunk Data`: accesses data associated with a chunk.

For periodic worlds, neighbor lookup must wrap around world boundaries. For bounded worlds, it must respect the world boundary.

## 4. Values and Mathematics

These nodes provide the general-purpose operations used throughout the graph.

### Values

- `Value`: constant scalar value.
- `Vector`: constant vector.
- `Color`: constant color.
- `Boolean`: constant boolean.
- `Integer`: constant integer.

### Math

- `Add`
- `Subtract`
- `Multiply`
- `Divide`
- `Modulo`
- `Minimum`
- `Maximum`
- `Clamp`
- `Lerp`
- `Remap`
- `Absolute`
- `Power`
- `Square Root`
- `Sine`
- `Cosine`

### Vector Math

- `Vector Add`
- `Vector Subtract`
- `Vector Multiply`
- `Vector Divide`
- `Dot Product`
- `Cross Product`
- `Normalize`
- `Length`
- `Distance`
- `Direction`
- `Reflect`

## 5. Spatial Operations

These nodes operate on positions and spatial relationships.

- `Sample Position`: samples a map or field at a world position.
- `Position Offset`: offsets a position by a vector.
- `Position Transform`: transforms a position.
- `Distance Field`: calculates distance to a defined shape or field.
- `Gradient`: calculates the spatial gradient of a field.
- `Neighborhood`: evaluates nearby positions.
- `Coordinate Transform`: converts between supported coordinate systems.

Spatial operations must respect the active world representation. For example, distance calculations in a periodic world must account for wrapping.

## 6. Fields and Maps

Fields represent values distributed throughout space. Maps are stored representations of those fields, potentially divided into chunks.

A field can represent elevation, temperature, moisture, density or any other spatial property.

- `Create Field`: defines a spatial field.
- `Sample Field`: samples a field at a position.
- `Combine Fields`: combines multiple fields.
- `Transform Field`: transforms field values.
- `Field Gradient`: calculates the gradient of a field.
- `Field Range`: returns the minimum and maximum values.
- `Map Input`: accesses an existing map.
- `Map Output`: produces a map.
- `Map Resolution`: defines the spatial resolution of a map.

Fields describe spatial data independently of how that data is stored. Maps provide a concrete representation that can be allocated and processed on the GPU.

## 7. Simulations

Simulations introduce persistent state and controlled feedback.

A simulation owns its state variables and recalculates them on every iteration.

### Simulation nodes

- `Simulation`: defines a simulation and its iteration count.
- `Initial State`: defines initial state values.
- `State Input`: reads the current state.
- `State Output`: defines the next state.
- `Iteration`: exposes the current iteration.
- `Progress`: exposes normalized simulation progress.

State can contain multiple maps or resources, such as elevation, plate positions, velocities, water distribution and sediment distribution.

Intermediate values are temporary unless explicitly included in the persistent state.

### Feedback and execution

Ordinary graphs remain acyclic. Feedback is only possible inside a simulation.

State updates are committed at iteration boundaries. This prevents computations from reading partially updated state.

When processes depend on one another within an iteration, the simulation can define explicit stages or nested iterations.

For example:

1. Tectonic movement updates plate positions.
2. The resulting changes affect elevation.
3. Hydrology calculates water flow and erosion.
4. Erosion updates elevation.
5. The resulting state becomes the input for the next iteration.

This allows coupled processes to influence one another without introducing cyclic dependencies into ordinary graphs.

## 8. Subgraphs

Subgraphs allow users to encapsulate and reuse computations.

A subgraph has defined inputs and outputs but otherwise behaves like any other graph.

Users should be able to create subgraphs for concepts such as:

- Mountain generation
- River networks
- Terrain erosion
- Climate calculations
- Vegetation distribution
- Plate movement

These are not built-in node types. They are user-defined computations built from the available node library.

Subgraphs can contain other subgraphs recursively, allowing users to build increasingly complex systems.

## 9. Execution

The complete graph is compiled to WGSL and executed through GPU compute shaders.

The graph describes the computation. The compiler determines execution order, resource allocation and dispatch scheduling.

Simulations maintain their state in GPU resources and update it between iterations.

The system operates on spatial data and maps without requiring geometry or mesh rendering.