# Types

## Overview

The type system describes the data passed between nodes.

Types define the underlying representation of values and determine which operations can be performed on them.

The type system is intentionally small.

Domain-specific concepts such as positions, directions, elevation, moisture, and temperature use existing types.

## Scalar Types

### F16

16-bit floating-point value.

### F32

32-bit floating-point value.

### I32

32-bit signed integer.

### U32

32-bit unsigned integer.

### Bool

Boolean value.

## Vector Types

### Vec2

Two-component vector.

Components:

- X
- Y

### Vec3

Three-component vector.

Components:

- X
- Y
- Z

### Vec4

Four-component vector.

Components:

- X
- Y
- Z
- W

Vectors are used for positions, directions, velocities, and other multidimensional values.

## Matrix Types

### Mat2

2 × 2 matrix.

### Mat3

3 × 3 matrix.

### Mat4

4 × 4 matrix.

Matrices are used for transformations and other linear algebra operations.

## Domain Concepts

Domain concepts do not require dedicated types when their underlying representation is identical.

Examples:

| Concept | Type |
|---|---|
| Position | Vec3 |
| Direction | Vec3 |
| Velocity | Vec3 |
| Elevation | F32 |
| Temperature | F32 |
| Moisture | F32 |
| Density | F32 |
| Plate ID | U32 |
| Boolean mask | Bool |

The graph determines semantic meaning through how values are connected and used.

## Type Compatibility

Connections between nodes must respect type compatibility.

A connection is valid when the output type can be consumed by the input type.

Supported conversions should be explicit and predictable.

Potential conversions include:

- Numeric scalar conversions.
- Scalar extension to vectors.
- Vector dimension extension.
- Vector dimension reduction.

Conversions must not silently change the semantic meaning of data.

## Fields and Types

A field has an underlying value type.

For example:

- Elevation field: F32.
- Temperature field: F32.
- Plate velocity field: Vec3.
- Plate ID field: U32.

A field is not a separate scalar or vector type. It represents a spatial computation producing values of an existing type.

## Maps and Types

Maps store values of an underlying type.

For example:

- Elevation map: F32.
- Plate ID map: U32.
- Plate velocity map: Vec3.

The map's data type must be compatible with the field or simulation state using it.

## Type System Principles

1. Keep the core type system small.
2. Avoid creating types for domain-specific labels.
3. Use scalar, vector, and matrix types consistently.
4. Validate type compatibility at graph connections.
5. Make conversions explicit and predictable.
6. Use the same underlying types for fields and maps.