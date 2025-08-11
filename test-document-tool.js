// 测试文档工具的渲染
const testDocumentTool = {
    "type": "dynamic-tool",
    "toolName": "createDocument",
    "toolCallId": "call_doc_123",
    "state": "output-available",
    "input": {
        "title": "示例代码",
        "content": "console.log('Hello, World!');",
        "kind": "code"
    },
    "output": {
        "documentId": "doc_123",
        "title": "示例代码",
        "kind": "code",
        "language": "javascript",
        "version": 1,
        "success": true
    }
};

const testUpdateTool = {
    "type": "dynamic-tool",
    "toolName": "updateDocument", 
    "toolCallId": "call_doc_456",
    "state": "processing",
    "input": {
        "documentId": "doc_123",
        "title": "更新的代码",
        "content": "console.log('Hello, Updated World!');",
        "kind": "code"
    }
};

console.log("创建文档工具测试数据:", JSON.stringify(testDocumentTool, null, 2));
console.log("更新文档工具测试数据:", JSON.stringify(testUpdateTool, null, 2));
