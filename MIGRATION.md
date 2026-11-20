# Graph Architecture Migration

## 1. Purpose

This document defines the migration of Graphite's graph architecture.

The objective is to establish a clear separation between graph definitions, graph editing, graph-specific behavior and the systems that eventually execute graphs.

This migration focuses on the graph architecture. Existing infrastructure must be reused wherever possible.

In particular:

- The existing serialization API must remain unchanged.
- The existing reactive API must remain unchanged.
- The existing editor infrastructure must be preserved where it already provides the required functionality.
- The existing React application must remain a presentation layer.
- The graph model and its related editor systems must live under `/editor`.
- `/app` must contain the React/UI implementation, not the editor's domain or application logic.

We should not introduce new infrastructure merely to replace infrastructure that already works.

The result should be a coherent graph architecture that supports world computation, reusable subgraphs, render passes and GPU simulations.

---

## 2. Project Structure

The project has two primary architectural boundaries.

### `/editor`

This directory contains the complete non-UI implementation of the editor.

It owns the editor's domain model, application logic and underlying systems.

This includes:

- Graph model and graph types.
- GraphManager.
- Graph nodes and edges.
- Graph interfaces and definitions.
- Graph validation and indexing.
- GraphEditor and editor state.
- Selection and interaction.
- Editor actions and history.
- Graph layout and rendering logic.
- Serialization integration.
- Project and project management.
- Compiler.
- Runtime.
- Simulation systems.
- GPU resource management and execution.

The exact internal directory organization can evolve, but these responsibilities belong under `/editor`.

The editor must not depend on React or other UI implementation details.

### `/app`

This directory contains the UI and React application.

It owns:

- React components.
- Application views.
- Panels and dialogs.
- UI-specific hooks.
- React state and component lifecycle integration.
- User-facing controls.
- Application composition.

The UI communicates with the editor through its public APIs.

It must not become the owner of graph definitions, graph invariants, graph execution or editor domain logic.

### Architectural boundary

The dependency direction is:

```text
/app
  |
  v
/editor
```

The editor must be usable independently of the React application.

---

## 3. Target Architecture

The graph architecture consists of four primary concepts:

1. Graph definitions.
2. Graph editing contexts.
3. Graph management.
4. Graph execution systems.

### Graph

A Graph represents a computation definition.

It owns:

- Graph identity.
- Graph name.
- Nodes.
- Edges.
- Graph-specific definitions.
- Graph topology.
- Graph validation.
- Graph indexing.
- Structural invariants.

A Graph does not own:

- Viewport offset.
- Viewport scale.
- Selection.
- Hover state.
- Active tools.
- Interaction state.
- Undo/redo history.
- Rendering caches.
- GPU resources.
- Runtime execution state.

A Graph is a model, not an editor view.

### GraphEditor

A GraphEditor represents an editing context for a Graph.

It owns the state required to interact with and present a graph.

This includes:

- The graph being edited.
- Viewport offset and scale.
- Selection.
- Hover state.
- Active tools.
- Interaction state.
- Editor-specific history.
- Editor-specific layout and presentation state.

GraphEditor must not become the owner of graph definitions or graph topology.

The separation allows the same graph definition to be used independently of a particular editing context.

### GraphManager

GraphManager owns graph definitions within a project.

It is responsible for:

- Creating graphs.
- Registering graphs.
- Removing graphs.
- Looking up graphs by ID.
- Maintaining graph identity.
- Resolving graph references.
- Managing graph relationships.
- Detecting invalid recursive references.
- Providing access to all graph types.

GraphManager must not assume that a project contains only a WorldGraph and Subgraphs.

### Execution systems

Compilation and execution are separate from graph editing.

The compiler consumes graph definitions and produces executable workloads.

The runtime owns execution state and resources.

The runtime may use GPU resources, buffers, maps and other execution-specific structures. These do not belong in the graph model.

---

## 4. Graph Hierarchy

All graph types extend the common Graph base class.

We should use actual inheritance and `instanceof` checks where graph-specific behavior is required.

Do not introduce a redundant `kind` property when the graph's class already establishes its type.

The graph hierarchy consists of:

| Graph type | Purpose |
|---|---|
| `WorldGraph` | Main world computation |
| `Subgraph` | Reusable nested computation |
| `PassGraph` | Defines a render or processing pass |
| `SimulationGraph` | Defines GPU simulation computation |

Each graph type owns its own definitions and invariants.

### WorldGraph

WorldGraph is the main graph of a project.

It defines the world computation and acts as the root of the graph hierarchy.

Invariants:

- A project has one main WorldGraph.
- The WorldGraph has exactly one WorldOutputNode.
- The WorldGraph cannot be referenced as a SubgraphNode.
- Its output defines the final world computation.

### Subgraph

Subgraph represents reusable computation.

It can be referenced by other graphs through SubgraphNode.

Invariants:

- A Subgraph has exactly one GraphOutputNode.
- A Subgraph can contain multiple GraphInputNodes.
- A Subgraph can expose multiple input and output definitions.
- A Subgraph cannot reference itself, directly or indirectly.
- Its interface is defined independently of its visual representation.

### PassGraph

PassGraph defines a render or processing pass.

It describes the computation and the data exposed by that pass. It does not allocate GPU resources.

Invariants:

- A PassGraph has exactly one PassOutputNode.
- A PassGraph owns its output definitions.
- Output definitions have stable IDs.
- Output definitions describe the data type and identity of each output.

The compiler and runtime determine how those definitions map to actual GPU resources.

### SimulationGraph

SimulationGraph defines a GPU simulation computation.

It is a graph definition, not a running simulation.

Invariants:

- A SimulationGraph has exactly one SimulationOutputNode.
- A SimulationGraph can contain multiple SimulationInputNodes.
- Simulation state definitions belong to the graph.
- The graph defines computation, not allocated simulation resources.

A Simulation remains a separate runtime configuration object that references a SimulationGraph.

---

## 5. Graph Output Invariants

Every graph type has one mandatory output node.

The output node is part of the graph's structural definition, not an optional node that the user creates or deletes.

| Graph type | Mandatory output |
|---|---|
| `WorldGraph` | `WorldOutputNode` |
| `Subgraph` | `GraphOutputNode` |
| `PassGraph` | `PassOutputNode` |
| `SimulationGraph` | `SimulationOutputNode` |

The graph model must enforce these invariants.

The editor must not be responsible for maintaining them through UI restrictions alone.

### Output node lifecycle

- Creating a graph creates its mandatory output node.
- Removing a mandatory output node through normal graph operations is prohibited.
- Deserialization must restore the mandatory output node.
- Graph validation must detect missing or duplicate mandatory output nodes.
- Graph-specific output nodes must not be interchangeable between graph types.

### Dynamic outputs

The output node represents the graph's output boundary.

Its ports are derived from the graph's output definitions.

For example, a Subgraph has one GraphOutputNode regardless of how many output definitions it exposes.

The GraphOutputNode has a dynamic input for each output definition.

This replaces the current approach of creating one GraphOutputNode per interface output.

---

## 6. Graph Ownership and Connections

Every node belongs to exactly one graph.

The graph owns its nodes and edges.

A node must not silently move between graphs.

Moving nodes between graphs must be an explicit operation that handles:

- Ownership changes.
- Edge removal or recreation.
- Graph indexing.
- Graph validation.
- Editor history.
- Graph-specific restrictions.

Connections must be validated by the graph model.

Validation includes:

- Source and target ownership.
- Valid source output.
- Valid target input.
- Compatible data types.
- Valid graph boundaries.
- Graph-specific restrictions.

The UI may provide early feedback, but it must not be the authority for connection validity.

---

## 7. Graph Interfaces

Graph interfaces describe how a graph communicates with its parent or consumer.

They are independent of the visual nodes used to represent them.

Interface definitions require stable IDs.

The interface definition owns:

- ID.
- Name.
- Data type.
- Other graph-boundary metadata when required.

### Subgraph inputs

A Subgraph can expose multiple input definitions.

Each input definition is represented inside the graph by a GraphInputNode.

GraphInputNode references its interface definition by ID.

Multiple GraphInputNodes are allowed.

The node's output port is derived from the referenced definition.

### Subgraph outputs

A Subgraph can expose multiple output definitions.

There is exactly one GraphOutputNode.

Its inputs are dynamically generated from the Subgraph's output definitions.

Each input references the corresponding definition by stable ID.

Adding or removing an output definition updates the GraphOutputNode interface.

The graph must not require creating or deleting GraphOutputNodes when changing its output definitions.

### SubgraphNode

SubgraphNode references a Subgraph through GraphManager.

Its interface is derived from the referenced Subgraph's definitions.

It must:

- Resolve the referenced graph.
- Expose its input definitions.
- Expose its output definitions.
- Update when the referenced interface changes.
- Reject invalid graph types.
- Reject recursive graph references.

Graph interface definitions are the source of truth. Node ports are their representation in a particular graph context.

---

## 8. PassGraph Definitions

PassGraph owns its output definitions.

An output definition contains:

- Stable ID.
- Name.
- Data type.

Use a Map keyed by stable ID where appropriate.

PassOutputNode derives its inputs from these definitions.

The graph model only describes the outputs.

It does not:

- Allocate textures.
- Allocate buffers.
- Create GPU bind groups.
- Own render targets.
- Manage resource lifetimes.
- Execute render passes.

Those responsibilities belong to compilation and runtime systems.

---

## 9. SimulationGraph Definitions

SimulationGraph owns its simulation state definitions.

A state definition describes a piece of simulation state and contains the identity and type information required by the compiler and runtime.

Use stable IDs and Maps where appropriate.

### SimulationInputNode

A SimulationGraph can contain multiple SimulationInputNodes.

Each node references a state definition.

Its output represents the corresponding simulation state.

### SimulationOutputNode

There is exactly one SimulationOutputNode.

Its inputs are dynamically generated from the SimulationGraph's state definitions.

Each input references the corresponding state definition by ID.

### Simulation

Simulation remains a separate runtime configuration object.

It references a SimulationGraph and owns runtime configuration such as:

- Iteration count.
- Input bindings.
- Other execution configuration.

SimulationGraph describes what to execute.

Simulation describes how a particular simulation instance is configured.

Runtime execution state and GPU resources belong to the runtime.

---

## 10. Node Architecture

The existing node architecture should be preserved where possible.

The migration must not unnecessarily rewrite node registration, serialization or reactive behavior.

The current decorators and mechanisms remain the starting point:

- `@input`
- `@output`
- `@option`
- `@observable`
- `@serializable`

Node interfaces must continue to support dynamic ports and options.

The graph redesign should make the distinction between the following concepts clear:

- Node definitions.
- Node instances.
- Graph interface definitions.
- Runtime values.

Port identity must remain stable where connections or serialization depend on it.

Node interface changes must correctly update connection validity and graph topology.

### Math and Vector Math

The editor should provide one Math node and one Vector Math node.

Their operator is selected through an option rather than represented by separate nodes.

Math supports scalar operations.

Vector Math supports vector operations.

The selected operator determines the required inputs and outputs.

The node interface must reflect the selected operation.

Examples include:

- Add.
- Subtract.
- Multiply.
- Divide.
- Negate.
- Dot.
- Cross.
- Length.
- Normalize.
- Distance.

The existing `MathOps`, `VectorMathOps` and option-based architecture should be extended rather than replaced without a concrete reason.

---

## 11. Graph Editing and Rendering

GraphEditor owns the editing context.

The graph renderer and layout systems remain editor-side systems under `/editor`.

They must consume GraphEditor state for viewport and presentation information.

They must not read viewport state from Graph.

This includes:

- Viewport offset.
- Viewport scale.
- Selection.
- Hover state.
- Editor layout state.

Graph layout and rendering caches are not serialized as graph definitions.

Rendering must remain independent of graph-specific execution.

The renderer should use the graph model and editor context without introducing graph-specific UI assumptions into the model.

### Editor actions and history

Graph modifications should continue to use the existing action and history architecture.

Actions operate on graph definitions through their model APIs.

Examples include:

- Add node.
- Delete nodes.
- Connect nodes.
- Move nodes.
- Change graph definitions.
- Change graph interfaces.

History belongs to the editing context, not the Graph itself.

Actions must preserve graph invariants when executing and undoing.

---

## 12. Serialization

The existing serialization API is already implemented and working.

**It must not be rewritten, replaced, duplicated or redesigned as part of this migration.**

The graph architecture must use the existing serialization infrastructure.

This includes:

- `Serializable`.
- `@serializable`.
- Existing serializable type registrations.
- Existing collection serialization.
- Existing serialization and deserialization mechanisms.
- Existing initialization lifecycle.

The migration changes the graph model, not the serialization system.

### Graph serialization

Update graph serialization declarations only where the redesigned graph structure requires it.

The graph model must serialize:

- Graph identity.
- Graph name.
- Nodes.
- Edges.
- Graph-specific definitions.
- Persistent graph data.

GraphEditor presentation state must not become part of Graph serialization.

If editor state needs persistence, it should be represented by an appropriate editor-state model using the existing serialization API.

### Restoration

The existing serialization lifecycle remains authoritative.

The redesigned graph model must integrate with it correctly.

After restoration:

- Graph indexes must be valid.
- Node and edge references must resolve.
- Graph-specific definitions must be available.
- Mandatory output nodes must exist.
- Dynamic interfaces must be reconstructed correctly.
- Graph invariants must hold.

Do not introduce a parallel initialization or restoration mechanism.

### Project format migration

Project-format migration is separate from the serialization API.

If the new graph structure is incompatible with existing project data, introduce an explicit project-version migration.

This migration transforms legacy serialized data into the structure expected by the existing serialization API.

It must preserve:

- Graph IDs.
- Node IDs.
- Edge references.
- Interface IDs.
- Existing connections.
- Simulation configuration.
- Other valid project data.

Legacy multiple GraphOutputNodes must be migrated into one GraphOutputNode with the appropriate dynamic inputs.

Legacy SimulationOutputNodes must be migrated into one SimulationOutputNode with the appropriate dynamic inputs.

No valid data should be silently discarded.

---

## 13. Compiler and Runtime Boundary

Compilation and execution are part of the editor's non-UI implementation and therefore live under `/editor`.

They are not part of the graph model.

The intended architecture is:

```text
Graph definitions
       |
       v
    Compiler
       |
       v
Executable workloads
       |
       v
     Runtime
       |
       v
       GPU
```

### Compiler

The compiler consumes graph definitions and produces executable workloads.

It is responsible for:

- Traversing graph topology.
- Resolving graph interfaces.
- Resolving subgraph references.
- Validating executable structures.
- Generating execution representations.
- Producing GPU-compatible workloads.

The compiler must not own runtime resources.

### Runtime

The runtime owns execution state and resources.

This includes:

- GPU buffers.
- Textures.
- Bind groups.
- Resource maps.
- Execution maps.
- Resource lifetimes.
- Runtime state.
- Simulation state.
- Execution scheduling.

The runtime is responsible for executing compiled workloads.

### GPU execution

Simulation and other GPU computation should execute on the GPU.

The architecture must allow computation to be compiled into GPU workloads rather than relying on CPU-side evaluation of individual graph nodes.

The graph model remains independent of the GPU implementation.

The compiler and runtime translate graph definitions into actual execution.

**This migration establishes the boundary; it does not implement the complete GPU compiler or runtime.**

---

## 14. Migration Plan

The migration should be performed in coherent stages.

Each stage must leave the project buildable and preserve existing functionality.

### Stage A — Graph Model Foundation

Establish the separation between Graph and GraphEditor.

Tasks:

- Redesign the Graph base class.
- Move viewport offset and scale out of Graph.
- Introduce or adapt GraphEditor as the editing context.
- Move selection and interaction state into GraphEditor.
- Adapt graph rendering and layout to use editor state.
- Update GraphManager ownership and lookup.
- Establish explicit graph creation methods.
- Ensure each node belongs to exactly one graph.
- Preserve the existing action and history architecture.
- Integrate with the existing serialization lifecycle.

Completion criteria:

- Graph contains no editor presentation state.
- GraphEditor owns editing state.
- GraphManager owns graph definitions.
- Existing editing functionality works.
- Graph rendering and layout no longer depend on Graph viewport properties.
- The project builds and existing projects remain loadable.

### Stage B — Graph Types and Invariants

Introduce the complete graph hierarchy and enforce graph-specific rules.

Tasks:

- Establish WorldGraph.
- Establish Subgraph.
- Establish PassGraph.
- Establish SimulationGraph.
- Add explicit graph creation methods to GraphManager.
- Introduce mandatory output nodes.
- Enforce exactly one mandatory output per graph.
- Implement graph-specific output behavior.
- Redesign Subgraph interface definitions.
- Change GraphOutputNode to use dynamic inputs.
- Implement PassGraph output definitions.
- Implement SimulationGraph state definitions.
- Change SimulationOutputNode to use dynamic inputs.
- Preserve SubgraphNode reference validation.
- Preserve recursive reference detection.
- Enforce connection and ownership invariants.

Completion criteria:

- All graph types have explicit behavior.
- Graph-specific invariants are enforced by the model.
- Every graph has exactly one mandatory output node.
- Subgraph interfaces work independently of their visual representation.
- PassGraph and SimulationGraph definitions are structurally complete.
- GraphManager supports all graph types.

### Stage C — Serialization Compatibility

Adapt the new graph model to the existing serialization API.

Tasks:

- Update graph serialization declarations where required.
- Update node serialization declarations where required.
- Update graph-specific definition serialization.
- Preserve the existing serialization API and lifecycle.
- Introduce project-version migration if necessary.
- Migrate legacy output nodes.
- Restore mandatory output nodes correctly.
- Rebuild indexes and references.
- Validate graph invariants after restoration.

Completion criteria:

- No serialization infrastructure is rewritten.
- Existing projects load without losing valid data.
- New graph structures serialize and deserialize correctly.
- Graph IDs, node IDs and edge references remain stable.
- Graph-specific definitions survive serialization.
- Restored graphs satisfy all structural invariants.

### Stage D — Editor Integration

Complete the integration with the existing editor and React application.

Tasks:

- Update GraphEditor creation and lifecycle.
- Update graph opening and closing.
- Update project graph management.
- Update graph selection and history.
- Update graph actions.
- Update rendering and layout consumers.
- Update graph creation UI.
- Update graph interface editing UI.
- Update simulation configuration UI.
- Ensure `/app` only contains UI and React-specific code.
- Ensure all non-UI editor systems live under `/editor`.

Completion criteria:

- Graph editing works for every graph type.
- The React application consumes editor APIs.
- Graph definitions are independent of React.
- No editor domain logic is unnecessarily duplicated in `/app`.

### Stage E — Node Interface Improvements

Complete the node interface changes required by the redesigned graph architecture.

Tasks:

- Verify stable port identity.
- Verify dynamic input and output behavior.
- Update graph interface nodes.
- Update SubgraphNode interface synchronization.
- Implement the operator-selectable Math node.
- Implement the operator-selectable Vector Math node.
- Ensure connection validation responds correctly to interface changes.
- Preserve existing node registration and serialization behavior.

Completion criteria:

- Dynamic node interfaces behave consistently.
- Connections remain valid after interface changes.
- Math and Vector Math use operator selection.
- Existing node behavior remains intact.

---

## 15. Migration Rules

The following rules apply throughout the migration.

1. **Redesign only what needs redesigning.** Do not replace working infrastructure without a concrete architectural reason.
2. **Do not rewrite serialization.** Use the existing serialization API.
3. **Do not rewrite the reactive API.** Continue using the existing reactive system.
4. **Keep all non-UI editor code under `/editor`.**
5. **Keep `/app` as the React/UI layer.**
6. **Do not put viewport or selection state in Graph.**
7. **Do not put graph topology or structural invariants in React components.**
8. **Do not rely on UI restrictions to enforce model invariants.**
9. **Do not introduce a redundant graph kind property when inheritance is sufficient.**
10. **Do not allocate GPU resources in graph definitions.**
11. **Do not put runtime execution state in Graph.**
12. **Do not create multiple mandatory output nodes.**
13. **Do not silently discard legacy serialized data.**
14. **Do not introduce parallel implementations of existing systems.**
15. **Preserve the existing coding style and reactive conventions.**
16. **Keep the project buildable after each migration stage.**

---

## 16. Out of Scope

This migration establishes the graph architecture and its integration with the editor.

It does not require implementing:

- The complete GPU compiler.
- WGSL generation.
- GPU resource allocation.
- Bind group generation.
- Render scheduling.
- GPU dispatch.
- Simulation execution.
- Simulation scheduling.
- Runtime resource lifetime management.

These systems will use the architecture established by this migration, but should be implemented as separate work.

---

## 17. Final Architecture Goals

After the migration:

- Graph is a standalone computation definition.
- GraphEditor is a standalone editing context.
- GraphManager owns and manages graph definitions.
- WorldGraph, Subgraph, PassGraph and SimulationGraph have explicit structural behavior.
- Every graph has exactly one mandatory output node.
- Graph interfaces are independent of their visual representation.
- Graph ownership and connection validity are enforced by the model.
- The existing serialization API remains unchanged.
- The existing reactive API remains unchanged.
- Editor actions and history operate independently of graph definitions.
- Rendering and layout use editor state rather than graph state.
- Compiler and runtime remain separate from graph definitions.
- GPU resources and execution state belong to the runtime.
- All non-UI editor implementation lives under `/editor`.
- `/app` contains the React/UI application and consumes the editor through its APIs.

The result is a graph architecture that can support increasingly complex procedural computation without coupling the graph model to its editor presentation or execution environment.