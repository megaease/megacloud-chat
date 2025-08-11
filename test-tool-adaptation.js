// 测试工具适配逻辑
const testMessage = {
    "type": "dynamic-tool",
    "toolName": "get_current_time",
    "toolCallId": "call_0_65fe3382-db78-4b6b-8f0f-d209689fc3bb",
    "state": "output-available",
    "input": {
        "timezone": "Asia/Shanghai"
    },
    "output": {
        "content": [
            {
                "type": "text",
                "text": "8/11/2025, 16:36:13 (Asia/Shanghai)"
            }
        ],
        "isError": false
    }
};

// 模拟适配函数
function safeParseJSON(input) {
    if (typeof input !== "string") return input;
    try {
        return JSON.parse(input);
    } catch {
        return input;
    }
}

function normalizeArgs(input) {
    const parsed = safeParseJSON(input);
    return parsed && typeof parsed === "object"
        ? parsed
        : { value: parsed };
}

function normalizeResult(output) {
    const parsed = safeParseJSON(output);
    if (parsed == null) return undefined;
    if (typeof parsed === "string") return { content: parsed };
    if (typeof parsed === "object") return parsed;
    return { content: String(parsed) };
}

function mapState(raw, hasResult) {
    if (hasResult) return "result";
    switch (raw) {
        case "output-available":
            return "result";
        case "input-available":
        case "call-created":
        case "created":
        case "call":
            return "call";
        case "input-streaming":
        case "partial-call":
            return "partial-call";
        case "processing":
        case "running":
        case "executing":
            return "processing";
        default:
            return "processing";
    }
}

// 测试适配
const toolName = testMessage.toolName;
const input = testMessage.input;
const output = testMessage.output;
const stateRaw = testMessage.state;
const result = normalizeResult(output);

const adaptedResult = {
    type: "tool-invocation",
    toolInvocation: {
        toolName,
        args: normalizeArgs(input),
        state: mapState(stateRaw, !!result),
        ...(result ? { result } : {}),
    },
};

console.log("Original message:", JSON.stringify(testMessage, null, 2));
console.log("Adapted result:", JSON.stringify(adaptedResult, null, 2));
console.log("Result content:", result);
