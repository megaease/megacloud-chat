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
const reactContent = `const HelloWorld = () => {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Hello React!</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Click me: {count}
      </button>
      <div style={{ marginTop: '10px' }}>
        <small>This is a React component preview</small>
      </div>
    </div>
  );
};

export default HelloWorld;`;

// Test JavaScript content
const jsContent = `// JavaScript 测试示例
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function test() {
  console.log("Hello JavaScript!");
  console.log("计算斐波那契数列前10项:");
  
  for (let i = 0; i < 10; i++) {
    console.log(\`fibonacci(\${i}) = \${fibonacci(i)}\`);
  }
  
  const numbers = [1, 2, 3, 4, 5];
  const doubled = numbers.map(n => n * 2);
  console.log("原数组:", numbers);
  console.log("翻倍后:", doubled);
}

test();`;

// Test the component
export function TestCodePreview() {
	return (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-semibold mb-2">HTML Content</h3>
				<CodePreview content={htmlContent} />
			</div>
			<div>
				<h3 className="text-lg font-semibold mb-2">React Content</h3>
				<CodePreview content={reactContent} />
			</div>
			<div>
				<h3 className="text-lg font-semibold mb-2">JavaScript Content</h3>
				<CodePreview content={jsContent} />
			</div>
		</div>
	);
}
