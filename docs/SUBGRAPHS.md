# Subgraphs

## Overview

Subgraphs encapsulate reusable computations.

A subgraph behaves like a function with explicitly defined inputs and outputs.

It contains an internal graph that is independent of the graph referencing it.

Subgraphs are the primary mechanism for implementing higher-level functionality without continuously expanding the built-in node library.

They can represent ordinary computations, spatial fields and simulation processes.

## Structure

A subgraph consists of:

- Input interface.
- Internal graph.
- Output interface.

The internal graph defines the computation.

The interfaces define how the subgraph interacts with its parent graph.

A subgraph can be instantiated multiple times and can contain other subgraphs.

## Inputs and Outputs

Subgraphs expose their functionality through typed inputs and outputs.

The interface can contain any supported graph value, including:

- Scalars.
- Booleans.
- Vectors.
- Matrices.
- Map references.
- Other supported resource references.

Inputs provide values to the internal graph.

Outputs expose values produced by the internal graph.

Internal nodes and connections are not directly exposed.

## Function Semantics

A subgraph behaves like a function.

Conceptually:

```text
Subgraph(Input A, Input B)
              |
              v
       Internal Graph
              |
              v
       Output A, Output B
```

A subgraph instance receives its own input values and produces outputs according to its internal graph.

Subgraph instantiation does not implicitly copy referenced resources.

Multiple instances can reference the same immutable map.

Subgraphs do not implicitly own resources.

## Reusability

A subgraph can be instantiated multiple times.

Each instance uses the same graph definition but receives its own inputs.

Subgraphs can be nested to construct increasingly complex computations.

A subgraph can be reused across different parent graphs.

Resource references can cross any number of subgraph boundaries through explicit inputs and outputs.

This allows computations to share data without requiring global resource lookup.

## Resource References

Subgraphs can receive and return resource references.

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

Inside the subgraph:

```text
Erosion Subgraph
+------------------------------+
| Input: Elevation Map         |
|             |                |
|             v                |
|       Erosion Graph          |
|             |                |
|             v                |
| Output: Eroded Elevation Map |
+------------------------------+
```

The subgraph does not need to know where the input map was created.

It only receives a reference to the resource.

Returning a resource reference does not create a copy of its underlying data.

Subgraphs do not implicitly extend resource lifetime. The execution system determines lifetime from actual dependencies and persistence requirements.

## Fields and Subgraphs

A spatial field can be represented by a subgraph with a position input and a value output.

Conceptually:

```text
Elevation Field
+------------------------------+
| Input                        |
|  Position: Vec2              |
|                              |
|  Noise                       |
|    |                         |
|    v                         |
|  Mountain Function           |
|    |                         |
|    v                         |
|  Combine                     |
|                              |
| Output                       |
|  Elevation: F32              |
+------------------------------+
```

Its interface describes a spatial computation:

\[
F(Position) \rightarrow Value
\]

The output can be composed with other fields or connected to a map output operation.

The execution system can inline the subgraph into map generation when appropriate.

Shared computations can be reused or materialized according to the field execution strategy.

A field does not inherently require a separately allocated map.

## Simulation Loops

Simulation loops can use subgraphs as their loop bodies.

The subgraph defines the computations performed during one tick.

The loop defines the feedback semantics:

- Initial inputs.
- Corresponding outputs.
- Maximum tick count.
- Snapshot boundaries.

Conceptually:

```text
Simulation Loop
+------------------------------+
| Inputs                       |
|  Elevation₀                  |
|  Water₀                      |
|                              |
| Internal Subgraph            |
|                              |
|  Tectonics                   |
|  Hydraulics                  |
|  Erosion                     |
|                              |
| Outputs                      |
|  Elevation₁                  |
|  Water₁                      |
+------------------------------+
```

The loop connects its outputs to its inputs for the next tick.

Every tick receives an immutable input snapshot.

The internal graph remains acyclic, and independent computations can execute in parallel.

The loop controls repeated execution and feedback.

## Example Subgraphs

### Spatial

- World boundary checks.
- Circular boundary checks.
- Periodic coordinate wrapping.
- Distance to a circle.
- Distance to a box.
- Smooth boundary falloff.
- Neighborhood calculations.

### Terrain

- Mountain generation.
- Terrain masks.
- Terrain blending.
- River networks.
- Terrain erosion.
- Sediment transport.

### Geological

- Plate generation.
- Plate movement.
- Plate deformation.
- Crust thickness.
- Continental collision.
- Subduction.

### Climate

- Temperature calculations.
- Moisture distribution.
- Atmospheric processes.
- Precipitation.

### Other

- Vegetation distribution.
- Biome calculations.
- Geological composition.

These are examples of user-defined computations, not necessarily built-in nodes.

## Subgraph Execution

Subgraphs are part of graph compilation and execution.

The execution system resolves their dependencies and compiles their computations.

Subgraphs can be expanded into their parent graph during compilation or compiled as reusable execution units.

The compilation strategy must preserve:

- Input and output semantics.
- Resource identity.
- Resource dependencies.
- Execution ordering.
- Simulation loop boundaries.

Subgraph boundaries do not necessarily require separate GPU dispatches.

## Design Principles

1. Subgraphs encapsulate reusable computations.
2. Subgraphs behave like functions.
3. Subgraphs expose explicit typed interfaces.
4. Subgraphs can contain other subgraphs.
5. Subgraphs can represent spatial fields.
6. Subgraphs can implement simulation processes.
7. Simulation loops can execute subgraphs as their loop bodies.
8. Resource references can cross subgraph boundaries.
9. Passing a resource reference does not copy its data.
10. Subgraphs do not implicitly own resources.
11. Resource lifetime belongs to the execution system.
12. Higher-level functionality should use subgraphs rather than unnecessarily expanding the built-in node library.