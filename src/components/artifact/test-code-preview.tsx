import { CodePreview } from "./CodePreview";

// Test HTML content
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Test</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`;

// Test React content
const reactContent = `function HelloWorld() {
  return <div>Hello React!</div>;
}`;

// Test JavaScript content
const jsContent = `function test() {
  console.log("Hello JavaScript!");
}
test();`;

// Test the component
export function TestCodePreview() {
	return (
		<div>
			<CodePreview content={htmlContent} mode="preview" />
			<CodePreview content={reactContent} mode="preview" />
			<CodePreview content={jsContent} mode="preview" />
		</div>
	);
}
