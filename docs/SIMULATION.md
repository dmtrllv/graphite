# Simulation

## Overview

Simulation allows graph computations to evolve over multiple iterations through explicitly defined feedback loops.

A simulation loop executes a graph body repeatedly. Each iteration, or tick, receives the values produced by the previous tick.

Feedback is explicitly defined by connecting loop outputs to corresponding loop inputs. Ordinary graph execution remains acyclic.

Simulation loops are generic. They can carry any supported graph value between iterations, including scalars, vectors, matrices, and map references.

The loop itself defines the feedback semantics. There is no separate simulation-state system or special-purpose state update mechanism.

## Simulation Loop

A simulation loop consists of:

- Loop inputs.
- A loop body.
- Loop outputs.
- A maximum tick count.

The loop body is an ordinary graph that executes once per tick.

Conceptually:

```text
             Loop Inputs
                  |
                  v
          +---------------+
          |               |
          |   Loop Body   |
          |               |
          +---------------+
                  |
                  v
             Loop Outputs
                  |
                  +--------+
                  |        |
                  +--------+
                  Next Tick
```

Each loop output corresponds to a loop input. Its value becomes the corresponding input value for the next tick.

The loop terminates after reaching its configured maximum tick count.

## Loop Inputs and Outputs

Loop inputs and outputs are dynamically defined.

They are not restricted to particular types or resource categories.

Examples include:

| Value | Type | Meaning |
|---|---|---|
| Elevation | Map<F32> | Current elevation map |
| Plate Positions | Map<Vec3> | Current plate positions |
| Plate Velocity | Map<Vec3> | Current plate velocities |
| Temperature | Map<F32> | Current temperature distribution |
| Wind Direction | Vec3 | Global wind direction |
| Simulation Time | F32 | Current simulation time |
| Iteration | U32 | Current iteration number |

These are examples, not predefined simulation resources.

A loop input provides its initial value.

Its corresponding loop output provides the value for the next tick.

Values that are not connected through loop outputs do not persist automatically.

The final loop outputs expose the values produced by the last tick.

## Tick Execution

Every tick operates on an immutable snapshot of its inputs.

All computations in the loop body read the same initial snapshot unless they depend on another computation within the same tick.

For example:

```text
                 Current State
                       |
          +------------+------------+
          |            |            |
          v            v            v
      Tectonics    Hydraulics    Thermal
          |            |            |
          v            v            v
      Plate Map    Water Map    Temperature
          |            |            |
          +------------+------------+
                       |
                       v
                  Next State
```

Independent computations can execute in parallel.

Dependencies within the loop body are represented by ordinary graph connections.

A dependent computation executes after its required inputs are available.

## Tick Boundary

The tick boundary separates one iteration from the next.

At the boundary:

1. All required computations have completed.
2. Loop outputs have been evaluated.
3. Output values become the inputs of the next tick.
4. The next tick begins.

No computation in the current tick can observe partially produced values from the next tick.

This provides deterministic snapshot semantics while allowing parallel execution.

## Immutable Values and Maps

Loop inputs are immutable during a tick.

Computations produce new values rather than modifying their inputs.

Maps follow the same rule.

For example:

```text
Tick 0: Elevation Initial
          |
          v
Tick 1: Elevation Updated
          |
          v
Tick 2: Elevation Updated Again
          |
          v
Tick 3: Final Elevation
```

Each map represents a distinct generation result.

The execution system may reuse physical storage between ticks when previous snapshots are no longer required.

Such reuse does not change the logical immutability of map resources.

## Intermediate Values

The loop body can produce intermediate values and maps.

Intermediate results are available to dependent computations within the same tick.

They do not automatically become loop state.

Only values explicitly connected to loop outputs cross the tick boundary.

The execution system can optimize intermediate storage, including inlining calculations and reusing temporary resources.

## Coupled Simulations

Simulation loops support multiple interacting processes.

Processes can influence each other through values carried between ticks or through ordinary dependencies within a tick.

For example, tectonics, hydraulics, and erosion can evolve together.

```text
Initial Maps
     |
     v
+--------------------------------+
| Simulation Loop                |
|                                |
| Current Maps                   |
|      |                         |
|      +---- Tectonics           |
|      |         |               |
|      |         v               |
|      |    Plate Movement       |
|      |                         |
|      +---- Hydraulics          |
|      |         |               |
|      |         v               |
|      |    Water Movement       |
|      |                         |
|      +---- Erosion             |
|                |               |
|                v               |
|           Terrain Changes      |
|                |               |
|           Next Maps            |
|                                |
+--------------------------------+
     |
     v
Final Maps
```

For example:

1. Tectonic movement changes plate positions.
2. Plate movement influences elevation.
3. Hydraulics reacts to the current elevation.
4. Erosion changes the terrain.
5. The resulting terrain influences tectonic deformation during the next tick.

The exact dependencies are defined by the loop body.

## Execution and Parallelism

The loop body is an ordinary directed acyclic graph.

The execution system determines dependencies between computations and schedules independent computations in parallel.

The loop introduces feedback only at the tick boundary.

This keeps graph compilation and scheduling independent of simulation-specific domain logic.

## GPU Execution

Simulation loops can use ping-pong buffers for map resources.

- Read from the current snapshot.
- Write new results into separate storage.
- Complete the tick.
- Swap the logical current and next resources.

The execution system manages physical resource allocation and reuse.

The logical map versions remain immutable regardless of the underlying storage strategy.

## Simulation Configuration

Simulation configuration is separate from the graph.

It defines:

- Maximum tick count.
- Initial loop input values.
- Resource and storage configuration where applicable.
- Execution settings.

The graph defines:

- Loop inputs and outputs.
- Loop body computations.
- Dependencies between computations.
- Values carried between ticks.

## Simulation Design Principles

1. Simulation feedback is explicitly defined through loops.
2. Every loop has a maximum tick count.
3. Loop inputs and outputs support any compatible graph value.
4. Loop outputs explicitly define values carried into the next tick.
5. The loop body is an ordinary acyclic graph.
6. Every tick reads an immutable input snapshot.
7. Independent computations execute in parallel.
8. Dependencies within a tick use ordinary graph connections.
9. Maps and values are immutable logical results.
10. Only explicitly connected outputs persist across ticks.
11. Simulation execution and resource management belong to the execution system.