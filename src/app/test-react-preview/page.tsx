import React from "react";
import { CodePreview } from "@/components/artifact/CodePreview";

const TestPage = () => {
	const testReactCode = `
import React, { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('React');

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Hello, {name}!
      </h2>
      
      <div className="space-y-4">
        <div>
          <p className="text-lg">Count: <span className="font-bold text-blue-600">{count}</span></p>
          <div className="flex gap-2 mt-2">
            <button 
              type="button"
              onClick={() => setCount(count + 1)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              +1
            </button>
            <button 
              type="button"
              onClick={() => setCount(count - 1)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              -1
            </button>
            <button 
              type="button"
              onClick={() => setCount(0)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Change name:
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your name"
          />
        </div>
      </div>
    </div>
  );
};

export default Counter;
`;

	return (
		<div className="min-h-screen bg-gray-100 p-8">
			<div className="max-w-6xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 mb-8">
					React 组件预览测试
				</h1>

				<div className="bg-white rounded-lg shadow-lg overflow-hidden">
					<div className="h-96">
						<CodePreview
							content={testReactCode}
							language="react"
							mode="preview"
						/>
					</div>
				</div>

				<div className="mt-8 p-6 bg-blue-50 rounded-lg">
					<h2 className="text-xl font-semibold text-blue-900 mb-4">
						🎉 恭喜！现在支持真正的 React 组件渲染了
					</h2>
					<ul className="text-blue-800 space-y-2">
						<li>✅ 实时编译和渲染 React 组件</li>
						<li>✅ 支持 React Hooks (useState, useEffect, etc.)</li>
						<li>✅ 错误边界和异常处理</li>
						<li>✅ 安全的沙盒执行环境</li>
						<li>✅ 支持 JSX/TSX 语法</li>
						<li>✅ 交互式组件预览</li>
					</ul>
				</div>
			</div>
		</div>
	);
};

export default TestPage;
