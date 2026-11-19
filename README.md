# Graphite

Graphite is a procedural world-generation editor built around visual computation graphs and GPU-driven simulation.

The architecture separates spatial configuration, computation, spatial data, simulation configuration, compilation, and resource management. Graphs describe what should be computed, simulations configure how iterative computations execute, the compiler translates computations into GPU-executable definitions, and the runtime manages and executes everything on the GPU.

The CPU is responsible for managing definitions, compilation, resources, and GPU command submission. The GPU performs the actual computation and simulation.

## Architecture

The system consists of the following main concepts:

- **World** — Defines the spatial domain, coordinate system, dimensions, and chunk layout.
- **WorldGraph** — Defines the top-level world computation.
- **Subgraph** — Encapsulates reusable computations behind explicit interfaces.
- **SimulationGraph** — Defines the computational logic of an iterative simulation.
- **Simulation** — Configures and executes a SimulationGraph, including its iteration count and initial state.
- **Maps** — Represent logical spatial datasets composed of chunk-based buffers.
- **Compiler** — Translates graphs into reusable GPU-executable definitions.
- **Runtime** — Owns maps and GPU resources, manages dependencies and caches, and executes computations and simulations.

Each concept has a distinct responsibility. Graphs describe computation, simulations configure iterative execution, the compiler produces execution definitions, and the runtime manages physical resources and GPU execution.

## World

The world defines the spatial domain in which computations take place.

World configuration determines properties such as:

- World dimensions and bounds.
- Coordinate system and world representation.
- Chunk dimensions.
- Spatial resolution.
- Chunk layout.

The world provides the spatial context for graph computation.

The fundamental spatial execution operation is:

`Generate(chunk)`

A computation is evaluated for a particular chunk in the context of the world. Chunk coordinates, world positions, local positions, dimensions, and other relevant spatial information propagate throughout the compiled computation.

Nodes do not need to manually forward this context through graph connections.

World configuration defines the spatial organization, but it does not define individual maps or their physical storage.

## Graphs

Graphs describe computation through nodes, connections, values, operations, and data dependencies.

Graphite has three graph types:

- **WorldGraph** — The top-level graph that defines world computation. It can reference subgraphs and simulation results.
- **Subgraph** — A reusable computation with an explicit input and output interface. Subgraphs can be referenced by other graphs.
- **SimulationGraph** — A specialized graph that defines the computational logic and state transitions of a simulation.

Each graph type has a distinct purpose, but they share the same underlying graph infrastructure.

### WorldGraph

The WorldGraph is the top-level computation graph of a project.

It defines how world data is produced and how different computations relate to one another. It can reference reusable subgraphs and outputs produced by simulations.

The WorldGraph does not define simulation iteration counts or contain simulation execution state.

### Subgraphs

Subgraphs encapsulate reusable computations behind explicit interfaces.

They allow complex computations to be organized into smaller, reusable units without exposing their internal implementation.

Subgraphs can be used inside the WorldGraph and SimulationGraphs.

### SimulationGraph

A SimulationGraph defines the computational structure of an iterative simulation.

It contains ordinary computation nodes and dedicated simulation boundary nodes:

- **Simulation Input** — Exposes initial or persistent simulation data to the computation.
- **Simulation Output** — Defines the results and updated state produced by an iteration.

For example, an erosion SimulationGraph could contain:

```text
SimulationGraph: Erosion
│
├── Simulation Input
│   ├── Terrain
│   └── Water
│
├── Calculate Flow
│
├── Calculate Erosion
│
├── Update Terrain
│
└── Simulation Output
    ├── Terrain
    └── Water
```

The graph describes what happens during one iteration. Its outputs define the results and state that become available after that iteration.

SimulationGraphs remain acyclic. Iteration feedback is provided by the simulation execution model rather than by connecting graph outputs back to inputs.

A SimulationGraph is not an ordinary Subgraph and cannot be referenced as one. Its iteration and state semantics require execution through a Simulation definition.

## Maps

A map is a logical spatial dataset covering the world's spatial domain.

Maps are divided into chunks, and each chunk is backed by one or more physical buffers managed by the runtime.

A map is therefore not a single GPU buffer. It is a logical resource that organizes spatial data across the world's chunks.

For example:

```text
Continental Map
├── Chunk (0, 0)
│   └── GPU buffer(s)
├── Chunk (1, 0)
│   └── GPU buffer(s)
├── Chunk (0, 1)
│   └── GPU buffer(s)
└── ...
```

Maps are declared and produced through graph computation. Other computations can reference and consume them.

A map has a logical identity independent of its physical GPU allocations. The runtime can reallocate or reuse buffers without changing the map's identity.

The value type describes what each spatial cell stores. A map can contain scalar values, vectors, or other supported data types while remaining a two-dimensional spatial dataset.

### Map generation and caching

When a map or chunk is requested, the runtime determines whether its contents are already available and valid.

- If valid data exists in the cache, the runtime reuses the existing buffers.
- If data is missing or invalid, the runtime resolves the required computation and its dependencies.
- If the required compiled definition is unavailable or invalid, the runtime invokes the compiler.
- The runtime allocates or reuses the necessary buffers and generates the data on the GPU.

The compiler does not know whether a map is cached or whether its buffers already exist. It only describes the computation and its resource requirements.

Maps can depend on other maps. The runtime tracks these dependencies to determine generation order, cache validity, and invalidation when upstream data changes.

## Simulations

A Simulation is a project-level definition that configures and executes a SimulationGraph.

The SimulationGraph contains the computational logic. The Simulation definition determines how that computation is executed.

A simulation definition contains information such as:

- Reference to a SimulationGraph.
- Iteration count.
- Initial state and input configuration.
- Execution configuration.

For example:

```text
Simulation: Terrain Erosion
│
├── Graph: Erosion
├── Iterations: 500
├── Initial State
│   ├── Terrain: Terrain Map
│   └── Water: Water Map
└── Execution Configuration
```

This separation allows the same SimulationGraph to potentially be reused with different initial states, configurations, or iteration counts.

### Iteration and state

A SimulationGraph describes one iteration of computation.

The Simulation definition specifies how many times that computation executes. The output of one iteration becomes the input state of the next.

Conceptually:

```text
Initial State
     │
     ▼
Iteration 0
     │
     ▼
Iteration 1
     │
     ▼
    ...
     │
     ▼
Iteration 499
     │
     ▼
Final State
```

Simulation Input exposes the data available at the beginning of an iteration. Simulation Output defines the results and updated state produced by that iteration.

The runtime manages persistent state buffers. For stateful computations, it can use ping-pong buffers to alternate between reading the current state and writing the next state.

For example:

```text
Iteration 0: A → B
Iteration 1: B → A
Iteration 2: A → B
Iteration 3: B → A
```

This avoids conflicting reads and writes.

Iteration counts and feedback are explicit. They are not inferred from graph cycles or implemented as implicit delta-based updates.

The CPU does not individually execute each iteration. The runtime prepares and submits the required GPU workloads.

## Compiler

The compiler translates graph computations into reusable GPU-executable definitions.

It understands:

- Graph structure and node semantics.
- Graph types and their execution semantics.
- Types and type conversions.
- Subgraph interfaces and dependencies.
- Simulation inputs, outputs, and state requirements.
- Map declarations and references.
- Spatial execution context.
- Computation dependencies.
- Buffer and binding requirements.
- GPU dispatch requirements.

The compiler produces definitions describing the computation required for GPU execution, including:

- WGSL shader definitions.
- Buffer requirements and layouts.
- Resource bindings.
- Compute pipeline requirements.
- Dispatch requirements.
- Dependencies between computations.
- Simulation iteration and state requirements.

A SimulationGraph is compiled into an execution definition that describes its computation, state transitions, and required GPU workloads.

The compiled definition describes what is required to execute the simulation. It does not own the simulation's physical resources or execution lifetime.

Compiled definitions describe requirements, not physical GPU resources.

For example, a compiled definition can specify that a computation requires a storage buffer containing F32 values. It does not allocate or own the corresponding `GPUBuffer`.

The compiler is independent of runtime resource ownership. It does not manage maps, allocate buffers, maintain caches, schedule simulation lifetimes, or submit GPU commands.

This separation allows compiled definitions to be reused across chunks and runtime resource instances whenever their compilation inputs remain equivalent.

## Runtime

The runtime is the GPU execution and resource management system.

It owns all maps, chunk storage, physical GPU buffers, pipelines, caches, and simulation execution state.

The runtime is responsible for:

- Map ownership and lifecycle.
- Chunk buffer allocation and management.
- GPU resource allocation and reuse.
- Map and compiled definition caching.
- Dependency resolution and invalidation.
- Compilation requests.
- Simulation execution and iteration management.
- Persistent simulation state.
- GPU command encoding and submission.
- Resource synchronization and lifetime.

The runtime determines when a map or chunk needs to be generated and when an existing result can be reused.

When a required compiled definition is missing or invalid, the runtime invokes the compiler. It then fulfills the compiled resource requirements using existing or newly allocated GPU resources.

For simulations, the runtime resolves the initial state, prepares the required buffers, and executes the compiled SimulationGraph for the configured number of iterations.

The compiler describes what is needed. The runtime decides how and when those requirements are fulfilled.

## GPU Execution

The actual computation and simulation happen on the GPU.

The runtime prepares the necessary resources, resolves dependencies, and encodes the required GPU commands.

Simulation state and intermediate data should remain GPU-resident whenever possible.

The CPU should not read intermediate results between simulation iterations. Instead, the runtime can encode multiple dependent compute dispatches and submit them together.

For example, a simulation with 1000 iterations can be submitted as a sequence of GPU dispatches:

```text
GPU Workload
├── Iteration 0
├── Iteration 1
├── Iteration 2
├── ...
└── Iteration 999
```

The GPU performs the computations and state updates without requiring CPU intervention between iterations.

GPU workgroups can synchronize internally, but general synchronization across all workgroups requires dispatch boundaries. When one computation depends on the completed results of another, the runtime encodes separate ordered dispatches.

These dispatches can still be submitted together without CPU readback between them.

CPU readback is reserved for operations that genuinely require CPU access, such as debugging, inspection, visualization, export, or external integration.

## Execution Flow

A typical world generation or simulation request follows this sequence:

```text
WorldGraph / Simulation Request
             │
             ▼
           Runtime
             │
             ├── Resolve computation dependencies
             │
             ├── Resolve required maps and chunks
             │
             ├── Check cache and resource validity
             │
             ├── Request compilation if necessary
             │       │
             │       ▼
             │    Compiler
             │       │
             │       ▼
             │    Compiled Definitions
             │
             ├── Allocate or reuse GPU resources
             │
             ├── Prepare simulation state if required
             │
             ├── Encode GPU workload
             │
             ▼
        GPU Submission
             │
             ▼
        GPU Execution
             │
             ├── Generate map chunks
             ├── Execute graph computations
             ├── Run simulation iterations
             └── Update map buffers
             │
             ▼
         Updated Maps
```

The runtime manages the lifecycle, while the GPU performs the actual computation.

## Design Principles

1. World configuration defines the spatial domain and chunk layout.
2. The WorldGraph defines top-level world computation.
3. Subgraphs provide reusable computational abstractions.
4. SimulationGraphs define iterative computational logic.
5. Simulations configure and execute SimulationGraphs.
6. Simulation inputs and outputs explicitly define iteration state.
7. Simulation iteration counts and execution configuration are defined outside graphs.
8. Maps are logical spatial datasets composed of chunk-based buffers.
9. Maps are declared and produced through graph computation.
10. The runtime owns all maps and physical GPU resources.
11. The compiler translates graphs into reusable GPU-executable definitions.
12. Compiled definitions describe requirements, not allocated resources.
13. The runtime decides when compilation and generation are required.
14. The runtime manages caching, resource validity, simulation state, and execution.
15. The GPU performs the actual computation and simulation iterations.
16. Simulation state and intermediate data remain GPU-resident whenever possible.
17. CPU involvement during simulation execution is minimized.