# Fields

## Overview

Fields represent values distributed throughout a spatial domain.

A field describes a spatial computation that produces a value for a given position.

Conceptually, a field is a function:

\[
F: Position \rightarrow Value
\]

The position is represented using the existing vector types. The resulting value can be any supported graph type.

Fields are used to represent spatial properties such as:

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

A field is a logical computation. It does not inherently allocate storage.

Fields can be evaluated directly, composed with other fields, or materialized into maps.

## Field Definition

A field definition describes how spatial values are calculated.

For example, an elevation field could be defined as:

\[
E(p) = B(p) + M(p)
\]

Where:

- \(E(p)\) is the resulting elevation.
- \(B(p)\) is the base elevation.
- \(M(p)\) is the mountain contribution.
- \(p\) is a position.

Field definitions are constructed from ordinary graph operations and other field definitions.

## Field Types

A field has an underlying value type.

Examples:

| Field | Value type |
|---|---|
| Elevation | F32 |
| Temperature | F32 |
| Moisture | F32 |
| Plate ID | U32 |
| Plate Velocity | Vec3 |
| Water Velocity | Vec3 |
| Geological Properties | Vec4 |

Fields do not introduce new scalar or vector types.

They describe how existing types are distributed throughout space.

The value type is independent of the spatial representation.

For example, a Vec3 field is still a spatial function over a two-dimensional map domain. Each sampled position produces a three-dimensional vector.

## Field Composition

Fields can reference other fields.

This allows complex spatial computations to be constructed from smaller reusable definitions.

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

A field can also use ordinary graph operations and values as part of its computation.

## Field Evaluation

A field can be evaluated at an individual position.

Conceptually:

```text
Field + Position
       |
       v
  Sample Field
       |
       v
    Value
```

The result has the underlying value type of the field.

Field evaluation uses the active world and coordinate configuration where applicable.

The field itself does not define world geometry or projection.

## Field Materialization

A field can be evaluated over a configured spatial domain and stored in a map.

This process is called materialization.

Map creation is explicit in the graph.

A map output operation connects a field computation to a configured map resource.

For example:

```text
Noise
  |
  v
Warp
  |
  v
Elevation Field
  |
  v
Map Output
  |
  v
Elevation Map
```

The map resource is declared explicitly. Its dimensions, resolution, storage and other configuration are managed separately from the graph.

Once created, the map is immutable and can be referenced by other computations.

## Field and Map Relationship

A field and a map are different concepts.

A field describes how spatial values are calculated.

A map stores sampled spatial values.

A field can be evaluated directly or materialized into a map.

A map can be referenced by multiple computations and graphs.

A map can also be used as the input to another field computation.

For example:

```text
Elevation Map
      |
      v
 Sample Elevation
      |
      v
 Erosion Computation
      |
      v
Updated Elevation Field
      |
      v
Map Output
      |
      v
Updated Elevation Map
```

The original map remains unchanged.

The resulting map represents a new generation result.

See [Maps](MAPS.md).

## Field References

Fields can reference:

- Other field definitions.
- Existing map resources.
- Map resources produced by simulation loops.

References allow computations to reuse data without depending on the internal implementation of other graphs.

## Field Analysis

Fields can be analyzed to derive additional spatial information.

Examples:

- Gradient.
- Minimum value.
- Maximum value.
- Range.
- Average.
- Direction.
- Local variation.

Some analyses require evaluating a field across a spatial domain.

Global operations such as minimum and maximum may require GPU reductions rather than ordinary point sampling.

## Field Execution

Field evaluation uses a hybrid execution strategy.

The execution system determines how computations should be evaluated based on their usage and execution requirements.

Possible strategies include:

- Direct evaluation.
- Inlining into a map generation computation.
- Reusing a shared computation.
- Materializing into a map.

A calculation used by only one map can be inlined into that map's generation.

Shared calculations can be evaluated once and reused where appropriate.

Explicitly created maps provide persistent, reusable resource boundaries.

The execution system may introduce temporary resources as optimization details, but these do not change the logical graph or create additional persistent maps.

The execution strategy can consider:

- Number of consumers.
- Computational cost.
- Sampling requirements.
- Neighborhood operations.
- Resource reuse.
- Storage requirements.

## Field Design Principles

1. Fields describe spatial computations.
2. Fields use existing graph value types.
3. Fields represent functions of spatial positions.
4. Fields can reference other fields.
5. Fields do not inherently require allocated storage.
6. Fields can be evaluated at individual positions.
7. Maps are explicitly created through graph operations.
8. Created maps are immutable resources.
9. Maps can be referenced by multiple computations and graphs.
10. Field evaluation uses a hybrid execution strategy.
11. Single-use calculations can be inlined into map generation.
12. Shared calculations can be reused or materialized.
13. Field evaluation is managed by the execution system.