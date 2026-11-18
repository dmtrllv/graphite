# Configuration

## Overview

Configuration defines the environment and resources used by world-generation computations.

It is separate from the node graph.

Nodes consume configuration through the execution context but do not create, configure, or modify project resources.

Configuration is responsible for defining:

- World properties.
- Chunk layout.
- Map resources.
- Simulation settings.
- Execution settings.

## World Configuration

The world configuration defines the spatial domain in which computations operate.

### Properties

- Representation.
- Dimensions.
- Size.
- Center.
- Bounds.

### World Representations

Supported representations:

- Flat.
- Circular.
- Periodic.
- Spherical.

The representation determines the coordinate system and spatial behavior used by applicable operations.

Boundary checks, coordinate wrapping, and other domain-specific behavior are implemented through reusable computations or subgraphs.

### World Dimensions

World dimensions describe the extent of the spatial domain.

The exact interpretation depends on the selected representation.

### World Bounds

World bounds describe the valid spatial extent.

They provide information used by spatial operations, sampling, and execution.

## Chunk Configuration

Chunk configuration defines how the world is partitioned.

### Properties

- Chunk dimensions.
- Chunk resolution.
- Chunk layout.

Chunk configuration is independent of world representation.

Chunks provide a way to partition spatial computations and storage.

The relationship between world dimensions, chunk dimensions, and map resolution is managed by the execution system.

## Map Configuration

Map configuration defines the spatial resources available to computations.

### Properties

- Resource identity.
- Data type.
- Resolution.
- Dimensions.
- Storage configuration.

Maps are allocated resources and are not created by graph nodes.

See [Maps](MAPS.md).

## Simulation Configuration

Simulation configuration defines how a simulation executes.

### Properties

- Iteration count.
- Execution stages.
- Initial state.
- State resources.
- Update policies.
- Commit policies.

Simulation configuration is managed outside the graph.

The graph describes the computations performed during simulation.

See [Simulation](SIMULATION.md).

## Execution Configuration

Execution configuration defines how computations are executed.

It may include:

- Compute dispatch configuration.
- Workgroup configuration.
- Resource allocation policies.
- Execution scheduling.
- Temporary resource policies.

The execution system resolves these settings when compiling and scheduling computations.

## Configuration and Nodes

Configuration must not be implemented as individual nodes.

For example, there should not be separate nodes for:

- World dimensions.
- World bounds.
- Chunk dimensions.
- Map resolution.
- Simulation iteration count.

These properties are available through the execution context and resource interfaces.

Computational nodes can consume these values when required.

## Configuration Ownership

Configuration owns the definitions of project resources.

The execution system owns their runtime allocation and lifecycle.

The graph references resources but does not own them.