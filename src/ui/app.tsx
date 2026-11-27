import { useEffect, useState } from "react";
import { Graphite } from "../graphite";
import { Editor } from "./editor";
import { createTestApp } from "../test";

export const App = () => {
	const [app, setApp] = useState<Graphite | null>(null)
	
	useEffect(() => {
		Graphite.init("Test").then((app) => {
			createTestApp(app);
			setApp(app);
		});
	}, []);

	if(!app)
		return <h1>Loading</h1>;
	
	return (
		<Editor app={app} />
	);
};
