# Documentation

This directory contains the architectural and technical documentation for the procedural world-generation editor.

The documentation is divided into separate topics to keep responsibilities clear and avoid duplicating definitions.

## Architecture

- [Architecture](ARCHITECTURE.md) — Overall system architecture and separation of responsibilities.
- [Configuration](CONFIGURATION.md) — World, chunk, map, and simulation configuration.
- [Types](TYPES.md) — The data types used throughout the graph system.

## Graph System

- [Nodes](NODES.md) — Built-in computational nodes and their operations.
- [Fields](FIELDS.md) — Spatial field definitions, composition, evaluation, and materialization.
- [Subgraphs](SUBGRAPHS.md) — Reusable computations and higher-level world-generation algorithms.

## Resources and Simulation

- [Maps](MAPS.md) — Spatial storage resources, resource identities, and references.
- [Simulation](SIMULATION.md) — Persistent state, feedback iterations, execution stages, and state updates.

## Execution

- [Execution](EXECUTION.md) — Graph compilation, WGSL generation, resource management, scheduling, and GPU execution.

## Architectural Principles

The system follows these principles:

1. Configuration is separate from computation.
2. Nodes describe operations, not resource configuration.
3. Fields describe spatial computations.
4. Maps store spatial data.
5. Resources are referenced by identity.
6. Simulation state persists between iterations.
7. Feedback occurs through controlled state updates.
8. Ordinary graphs remain acyclic.
9. Subgraphs provide reusable higher-level functionality.
10. Computations are compiled and executed on the GPU.

For the overall system design, start with [Architecture](ARCHITECTURE.md).