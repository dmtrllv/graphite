# Execution

## Overview

The execution system turns graphs into executable GPU workloads.

Graphs describe computations, dependencies and resource connections.

The execution system analyzes these graphs, determines how computations should be evaluated, generates executable workloads and dispatches them through GPU compute shaders.

Nodes describe individual computations.

Subgraphs encapsulate reusable computations.

Simulation loops introduce explicitly defined feedback between graph executions.

The execution system is responsible for:

- Graph compilation.
- Type validation.
- Subgraph resolution and compilation.
- Dependency analysis.
- Evaluation strategy selection.
- Field evaluation planning.
- Resource resolution.
- Resource allocation.
- Execution scheduling.
- WGSL generation.
- GPU dispatch.
- Simulation loop execution.
- Resource lifetime management.

## Execution Pipeline

The conceptual pipeline is:

```text
Project Configuration
        |
        v
 Graph Validation
        |
        v
 Subgraph Resolution
        |
        v
 Resource Resolution
        |
        v
 Dependency Analysis
        |
        v
 Evaluation Planning
        |
        v
 Resource Planning
        |
        v
 Execution Scheduling
        |
        v
 WGSL Generation
        |
        v
 GPU Compute Dispatch
        |
        v
 Resource Outputs
```

Simulation loops control repeated execution of their loop bodies.

Each tick executes the same graph structure with a new set of input values.

## Graph Compilation

The compiler translates graph computations into executable GPU workloads.

It determines:

- Required operations.
- Input and output types.
- Dependencies.
- Subgraph computations.
- Field computations.
- Resource accesses.
- Required execution boundaries.
- Suitable evaluation strategies.

Ordinary graphs are acyclic and can be compiled using dependency ordering.

Simulation loops are handled through explicit execution boundaries.

The loop body remains an ordinary acyclic graph.

### Compiler-Determined Evaluation

Graph semantics describe what a computation produces and how it depends on other computations. They do not prescribe when or how the computation must be evaluated.

The compiler determines the evaluation strategy based on the graph structure, dependencies, resource requirements and expected execution cost.

Possible strategies include:

- Inlining computations into their consumers.
- Evaluating computations as separate execution units.
- Reusing shared computations.
- Deferring computations until their results are required.
- Materializing computations into explicitly created maps.
- Introducing temporary resources when necessary.

These are compiler decisions, not semantic properties of nodes, fields or subgraphs.

The compiler must preserve the observable behavior of the graph regardless of the selected strategy.

In particular:

- A computation must produce the same result regardless of how it is evaluated.
- Shared computations can be reused when their inputs and semantics permit it.
- Inlining must not change resource identity or dependency semantics.
- Evaluation must respect explicit resource creation boundaries.
- Simulation loop boundaries and snapshot semantics must remain intact.

The compiler can optimize execution without changing the meaning of the graph.

## Type Validation

The compiler validates graph connections and operations.

Validation includes:

- Input and output compatibility.
- Supported conversions.
- Operation requirements.
- Field value types.
- Map value types.
- Subgraph interfaces.
- Loop input and output compatibility.

Invalid graphs must be detected before GPU execution.

## Subgraph Compilation

Subgraphs encapsulate reusable computations.

Their interfaces define the values and resources passed into and out of them.

The execution system resolves subgraph dependencies and compiles their internal computations.

Subgraphs can be expanded into their parent graph or compiled as reusable execution units.

The compiler determines how subgraph computations should be evaluated. A subgraph does not inherently require eager evaluation, lazy evaluation or a separate execution unit.

Depending on its usage, the compiler can:

- Inline its computations into a consuming graph.
- Compile it as a separate execution unit.
- Reuse computations shared by multiple consumers.
- Defer computations until their results are required.

The chosen strategy must preserve:

- Input and output semantics.
- Resource identity.
- Resource dependencies.
- Execution ordering.
- Simulation loop boundaries.

Subgraph instantiation does not implicitly duplicate referenced map resources.

## Resource Resolution

Resource references are resolved through explicit graph connections and interfaces.

The execution system determines:

- Which resources are required.
- Where resources are produced.
- Which computations consume them.
- Which resources are external inputs.
- Which resources must be retained.

Maps are not globally addressable by default.

Resource access must be declared through graph connections, subgraph interfaces or explicit external graph inputs.

The execution system resolves these references to runtime resources.

## Dependency Analysis

The execution system constructs a dependency graph from computational and resource dependencies.

It identifies:

- Required execution ordering.
- Independent computations.
- Shared computations.
- Resource producers and consumers.
- Subgraph dependencies.
- Simulation loop boundaries.

Independent computations can be scheduled in parallel.

Dependencies must be respected regardless of whether computations belong to the same graph or nested subgraphs.

Dependency analysis provides the information required for the compiler to select suitable evaluation strategies.

## Evaluation Planning

The compiler determines how graph computations should be evaluated.

This applies uniformly to:

- Ordinary node computations.
- Fields.
- Subgraphs.
- Intermediate computations.
- Shared computations.

The compiler can choose between inlining, separate evaluation, reuse, deferred evaluation and materialization where appropriate.

The decision can depend on:

- Number of consumers.
- Computational cost.
- Sampling requirements.
- Neighborhood operations.
- Reuse opportunities.
- Storage requirements.
- Resource dependencies.
- Execution boundaries.

For example, a computation used by only one consumer can be inlined into that consumer. A computation shared by multiple consumers can be evaluated once and reused when that is more efficient.

The compiler is not required to use the same strategy for every instance of a computation. Different graph contexts can justify different strategies.

Evaluation planning must preserve graph semantics and explicit resource boundaries.

## Field Evaluation

Fields are logical spatial computations.

The compiler determines how field computations should be evaluated as part of the overall evaluation plan.

Possible strategies include:

- Direct evaluation.
- Inlining into map generation.
- Reusing shared computations.
- Materializing into explicitly created maps.
- Introducing temporary resources when necessary.

Single-use calculations can be inlined into their consuming map generation.

Shared calculations can be evaluated once and reused where appropriate.

Explicit map creation establishes a resource boundary.

Field evaluation strategy is determined by the compiler based on:

- Number of consumers.
- Computational cost.
- Sampling requirements.
- Neighborhood operations.
- Reuse opportunities.
- Storage requirements.

The selected strategy must preserve field semantics.

Fields do not inherently require eager evaluation, lazy evaluation or materialization.

## Resource Planning

The execution system plans the resources required by the computation.

This includes:

- Explicitly created maps.
- External map inputs.
- Temporary resources.
- Intermediate computation resources.
- Simulation loop buffers.

Map dimensions, resolution and storage requirements come from project configuration.

Graph operations declare resource creation and computational dependencies.

The execution system determines physical GPU allocation.

The compiler can introduce temporary resources as part of its evaluation strategy. These resources do not change graph semantics or create new persistent maps.

## Resource Lifetime

Resource lifetime follows computational dependencies and explicit persistence requirements.

The execution system tracks:

- Resource creation.
- Resource consumers.
- Subgraph boundaries.
- Simulation tick boundaries.
- Retained outputs.
- Resource release.

A resource can be released when no remaining computation or retained output requires it.

Physical GPU storage can be reused when its previous logical resource is no longer needed.

Storage reuse must preserve logical resource identity and immutable snapshot semantics.

## Execution Scheduling

The execution system schedules computations according to their dependencies and the evaluation plan produced by the compiler.

Scheduling considers:

- Graph dependencies.
- Resource dependencies.
- Subgraph execution.
- Field evaluation requirements.
- Map access.
- Simulation loop boundaries.
- GPU dispatch requirements.

Independent computations can execute in parallel.

The scheduler must not introduce dependencies that are absent from the graph semantics.

## WGSL Generation

The compiler generates WGSL for supported computations.

Generated shaders operate on resolved resources and follow the execution plan.

The compiler is responsible for translating supported node operations into valid WGSL.

Subgraph boundaries do not necessarily require separate shader dispatches.

Multiple computations can be combined into a single shader when their dependencies and resource requirements allow it.

The generated WGSL must preserve the semantics of the original graph, regardless of whether computations were inlined, reused or compiled separately.

## GPU Dispatch

The execution system dispatches compute shaders.

Dispatch configuration depends on the computation and its spatial domain.

Workgroup configuration and dispatch dimensions are execution concerns, not node configuration.

Intermediate computations and resources should remain GPU-side wherever possible.

## Simulation Execution

Simulation loops introduce explicit feedback between graph executions.

A loop defines:

- Initial inputs.
- A loop body.
- Corresponding outputs.
- Maximum tick count.

Loop inputs and outputs can represent any supported graph value, including map references.

The loop body is an ordinary acyclic graph.

Each tick executes using an immutable snapshot of the current inputs.

The execution system handles:

1. Providing the current loop inputs.
2. Executing the loop body according to its compiled execution plan.
3. Scheduling independent computations in parallel.
4. Evaluating loop outputs.
5. Making those outputs the inputs for the next tick.
6. Repeating until the maximum tick count is reached.

Only explicitly connected loop outputs persist across ticks.

Values and maps produced inside a tick are intermediate unless they are exposed through loop outputs or otherwise retained.

### Snapshot Semantics

All computations in a tick observe the same loop input snapshot.

Ordinary graph dependencies can introduce ordering within the tick.

Independent computations do not need to wait for one another.

The next tick cannot begin until all required loop outputs have been produced.

Compiler optimizations must preserve these snapshot semantics.

### GPU Storage

Simulation loops can use ping-pong buffers for resources carried between ticks.

- Read from the current snapshot.
- Write new results into separate storage.
- Complete the tick.
- Swap the logical current and next resources.

The execution system can reuse physical storage without changing logical map versions.

See [Simulation](SIMULATION.md).

## Error Handling

The execution system must detect invalid execution requirements before dispatch.

Examples include:

- Invalid graph connections.
- Unsupported node operations.
- Invalid subgraph interfaces.
- Invalid resource references.
- Incompatible resource types.
- Invalid map configuration.
- Unsupported field operations.
- Invalid loop interfaces.
- Invalid loop dependencies.
- Unsupported GPU operations.

Errors should identify the affected graph, node, resource or simulation loop.

## Execution Design Principles

1. Graphs describe computations and dependencies.
2. The compiler translates computations into executable GPU workloads.
3. The compiler determines how computations are evaluated.
4. Nodes, fields and subgraphs do not prescribe eager or lazy evaluation.
5. Subgraphs provide reusable computation boundaries.
6. Resource references are resolved through explicit graph interfaces.
7. Maps are explicitly declared by graph operations.
8. Map configuration is separate from graph computation.
9. Evaluation strategies can include inlining, reuse, separate evaluation and materialization.
10. Explicit resource creation establishes logical resource boundaries.
11. Dependencies determine execution order.
12. Independent computations can execute in parallel.
13. Simulation feedback occurs through explicit bounded loops.
14. Every loop tick reads an immutable input snapshot.
15. Loop outputs explicitly define values carried into the next tick.
16. Physical GPU storage can be reused without changing logical resource identity.
17. Intermediate computations should remain GPU-side wherever possible.
18. Resource allocation and lifetime belong to the execution system.
19. Compiler optimizations must preserve graph semantics.