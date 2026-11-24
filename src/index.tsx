import { BinaryOp, BinaryOpNode, GraphManager, SubGraph, SubGraphNode, UnaryOp, UnaryOpNode, ValueNode } from "./compiler/graph";
import { createTaggedEnum, type TaggedEnumType, isTaggedVariant, matchEnum } from "./utils";

const manager = new GraphManager();

const subGraph = manager.createGraph(SubGraph, "Test");

const subGraph2 = manager.tryCreateGraph(SubGraph, "Test");
if (subGraph2.isErr()) {
	console.error(subGraph2.error.toString());
}

const a = manager.addNode(subGraph, ValueNode, { value: 0 });
const b = manager.addNode(subGraph, ValueNode, { value: 1 });

const add = manager.addNode(subGraph, BinaryOpNode, { op: BinaryOp.add });

subGraph.connect(a, "value", add, "a");
subGraph.connect(b, "value", add, "b");

const negate = manager.addNode(subGraph, UnaryOpNode, { op: UnaryOp.negate });

subGraph.connect(add, "value", negate, "a");

manager.worldGraph.addNode(SubGraphNode, { graph: subGraph.id });

const serialized = manager.serialize();

const testManager = new GraphManager(serialized);
const serialized2 = testManager.serialize();
const s1 = JSON.stringify(serialized, null, 4);
const s2 = JSON.stringify(serialized2, null, 4);

console.log(serialized);
console.log(s1 === s2);

const Foo = createTaggedEnum({
	Bar: () => "Bar",
	Baz: (baz: string) => ({ baz }),
});

type Foo = TaggedEnumType<typeof Foo>;

const bar = Foo.Baz("test");

const test = (foo: Foo) => {
	if (isTaggedVariant(foo, "Bar")) {
		console.log("got bar", foo.toString());
	} else if (isTaggedVariant(foo, "Baz")) {
		console.log("got baz", foo.baz);
	}
}

test(bar);

console.log(matchEnum(bar, {
	Bar: value => value.toString(),
	Baz: value => value.baz
}));