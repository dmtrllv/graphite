# Graph Architecture

The editor is a general-purpose visual computation system for creating procedural worlds. Everything is represented as a graph, which is compiled to WGSL and executed on the GPU.

## Graphs

Graphs are directed acyclic graphs (DAGs). Nodes consume inputs and produce outputs, defining the dependencies and execution order of a computation.

Graphs can contain subgraphs recursively. A subgraph is simply a reusable graph with defined inputs and outputs. It uses the same node kinds and capabilities as any other graph.

## Node Kinds

Built-in nodes define the computational vocabulary of the editor. They provide generic operations that can be combined to create more complex functionality.

Initial node kinds:

- **Value** constant values.
- **Math** scalar mathematical operations.
- **Vector Math** vector operations.

Additional value types, such as vectors and colors, can be added as needed.

Domain-specific functionality (mountains, rivers, forests, etc.) should be built from these primitives and encapsulated in reusable subgraphs rather than implemented as built-in nodes.

## Simulations

Simulations introduce controlled feedback and persistent state into the graph system.

A simulation owns its state variables, defines their initial values, and recalculates them on every iteration. Its body is an ordinary graph using the same node kinds and subgraph capabilities.

Each iteration reads the current state and produces the next state.

State can contain multiple maps or resources, such as elevation, plate positions, velocities, water distribution, and sediment distribution. Intermediate values are temporary unless explicitly included in the persistent state.

State updates are committed at iteration boundaries. Computations can also be organized into explicit stages when one calculation must consume the intermediate results of another.

This allows coupled processes, such as tectonic movement and hydraulic erosion, to influence one another without introducing cyclic dependencies into ordinary graphs.

## Execution

The complete graph is compiled to WGSL and executed through GPU compute shaders.

Simulation state is stored in GPU resources and updated between iterations. The compiler is responsible for scheduling computations and managing resource dependencies.

The system operates on data rather than requiring geometry or mesh rendering.

## Principles

- All graphs share the same computational capabilities.
- Subgraphs are reusable computations and can be nested recursively.
- Built-in nodes provide generic operations, not domain-specific functionality.
- Ordinary graph dependencies are always acyclic.
- Simulations explicitly own and update persistent state.
- Feedback is only possible inside simulation boundaries.
- GPU execution is the compilation target, not the basis of the graph architecture.