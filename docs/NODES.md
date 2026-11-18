# Nodes

## Overview

Nodes implement computational operations used in world generation.

They are connected through typed input and output ports to form graphs.

Nodes do not configure worlds, chunks, maps, or simulations.

Configuration and resource allocation belong to the project and execution systems.

The node library is intentionally kept small. Related operations are grouped into configurable nodes, and higher-level functionality is implemented through reusable subgraphs.

## Value

Provides a constant value of a selected type.

Supported values:

- Scalar.
- Boolean.
- Integer.
- Vector.
- Matrix.

The selected type determines the available value controls and output type.

## Math

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

## Vector Math

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

## Vector Components

Provides vector construction and component access.

Operations:

- Combine components into a vector.
- Split a vector into components.

The vector dimension determines the available components.

## Matrix Math

Provides matrix operations.

Operations:

- Matrix multiplication.
- Matrix addition.
- Matrix subtraction.
- Matrix transpose.
- Matrix inverse.
- Matrix determinant.
- Matrix-vector multiplication.

## Spherical Coordinates

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

## Chunk Coordinates

Provides conversions and indexing between world positions and chunks.

Operations:

- World position to chunk coordinate.
- Chunk coordinate to world position.
- Calculate local chunk coordinates.
- Calculate local chunk index.

Chunk dimensions and layout are obtained from project configuration.

## Spatial Transform

Applies spatial transformations.

Operations:

- Translation.
- Rotation.
- Scale.
- Transform composition.
- Inverse transform.

## Neighborhood

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

## Field Input

References an existing field or map resource.

It allows computations to consume spatial data without knowing how that resource is allocated or stored.

## Field Output

Exposes a computed field as an output of a graph or subgraph.

It does not automatically allocate map storage.

## Sample Field

Samples a field at a position.

Inputs:

- Field reference.
- Position.

Outputs:

- Sampled value.

## Store Field

Evaluates a field and writes its values into a configured map resource.

Inputs:

- Field.
- Destination map.

Storage allocation and map configuration are managed by the execution system.

## Combine Fields

Combines multiple fields.

Operations:

- Add.
- Subtract.
- Multiply.
- Divide.
- Minimum.
- Maximum.
- Blend.

## Transform Field

Transforms field values.

Operations:

- Scale.
- Offset.
- Clamp.
- Remap.
- Normalize.

## Field Analysis

Provides analytical operations on fields.

Operations:

- Gradient.
- Minimum and maximum range.

## State Input

Reads a value from the current simulation state.

Inputs:

- State resource.
- Position or index, where applicable.

Outputs:

- Current state value.

## State Output

Produces an updated value for a simulation state resource.

Inputs:

- Updated value.
- Position or index, where applicable.

State updates are committed according to the simulation's execution stages and update policy.

## Node Design Principles

1. Nodes perform computations.
2. Nodes do not configure project resources.
3. Nodes do not allocate maps.
4. Nodes do not control simulation lifecycle.
5. Related operations are grouped into configurable nodes.
6. Higher-level algorithms are implemented as subgraphs.
7. Nodes use the shared type system.
8. Nodes expose their dependencies through graph interfaces.

See [Fields](FIELDS.md), [Maps](MAPS.md), and [Simulation](SIMULATION.md) for the resource and state concepts used by these nodes.