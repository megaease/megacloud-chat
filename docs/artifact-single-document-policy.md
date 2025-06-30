# Artifact单文档策略功能设计

## 概述

为了改善用户体验并简化版本管理，我们实现了**"一聊天一文档"**的artifact管理策略。这意味着在同一个聊天会话中，所有的文档创建操作都将作用于同一个document，通过版本控制来管理内容变更。

## 问题背景

### 原有问题
- 每次调用 `createDocument` 都会创建新的 document ID
- 一个聊天中可能存在多个独立的 artifact
- 版本历史分散，用户难以管理和追踪
- 界面复杂，需要处理多个artifact的显示

### 解决方案
实现智能的文档创建策略：
- 检查当前聊天是否已有artifact
- 如果有，自动将创建操作转换为更新操作
- 如果没有，正常创建新文档
- 提供 `forceNew` 参数覆盖默认行为

## 技术实现

### 1. 核心文件修改

#### `src/lib/ai/tools/create-document-smart.ts`
新建智能创建工具，包含以下逻辑：
```typescript
// 检查当前聊天是否已有artifact
if (userId && chatId && !forceNew) {
    const existingArtifacts = await getArtifactsByChatId(chatId, userId);
    if (existingArtifacts.length > 0) {
        // 转换为更新操作
        shouldCreateNew = false;
        existingDocumentId = existingArtifacts[0].id;
    }
}
```

#### `src/lib/prompt.ts`
更新AI提示词，说明新的行为模式：
- 强调"一聊天一文档"策略
- 解释自动转换机制
- 说明 `forceNew` 参数的使用场景

#### `src/app/api/chat/route.ts`
更新路由引用新的智能创建工具

### 2. 数据库架构保持不变
- 继续使用复合主键 `(id, version)`
- 每次更新创建新版本记录
- 版本历史完整保留

### 3. 前端界面适配
- 添加国际化文本支持
- 保持现有版本切换功能
- 添加单文档策略提示

## 用户体验改进

### Before (原有行为)
```
用户: 创建一个HTML页面
AI: [创建 document_001]

用户: 再创建一个JavaScript函数  
AI: [创建 document_002]  // 新的独立文档

结果: 聊天中有2个独立的artifact，版本历史分散
```

### After (新行为)
```
用户: 创建一个HTML页面
AI: [创建 document_001 v1]

用户: 再创建一个JavaScript函数
AI: [更新 document_001 到 v2]  // 自动转换为更新

结果: 聊天中只有1个artifact，统一的版本历史
```

## API变化

### createDocument 工具新增参数
```typescript
{
  title: string;
  content: string;
  kind: "text" | "code" | "sheet" | "image";
  language?: string;
  forceNew?: boolean;  // 新增：强制创建新文档
}
```

### 返回值新增字段
```typescript
{
  documentId: string;
  operation: "created" | "updated";  // 新增：标识实际执行的操作
  // ... 其他字段
}
```

## 使用场景

### 默认行为（推荐）
- 大多数用户交互场景
- 迭代式开发和修改
- 保持聊天内容的连贯性

### 强制创建新文档
```typescript
createDocument({
  title: "新的独立文档",
  content: "...",
  kind: "code",
  forceNew: true  // 明确要求创建新文档
})
```

适用于：
- 需要并排比较不同方案
- 创建完全不同类型的文档
- 用户明确要求新建文档

## 配置选项

目前采用硬编码的策略，未来可考虑添加用户偏好设置：
- `artifact_strategy`: "single" | "multiple" | "ask"
- `auto_convert_create_to_update`: boolean

## 兼容性

- ✅ 现有数据库结构完全兼容
- ✅ 现有API端点无需修改
- ✅ 前端版本切换功能正常工作
- ✅ 对已有聊天记录无影响

## 测试建议

### 基本功能测试
1. 新聊天中创建第一个文档 → 应该正常创建
2. 同一聊天中再次创建文档 → 应该转换为更新
3. 使用 `forceNew: true` → 应该创建新文档
4. 版本历史查看 → 应该显示所有版本

### 边界情况测试
1. 数据库连接失败时的降级处理
2. 并发创建请求的处理
3. 不同类型文档的转换（如text转code）

## 后续优化方向

1. **用户选择机制**: 在检测到已有文档时，询问用户是否要更新还是新建
2. **文档分类**: 支持在同一聊天中按文档类型分组管理
3. **性能优化**: 缓存聊天的artifact状态，减少数据库查询
4. **高级版本管理**: 支持分支、合并等类似Git的操作

## 总结

这个单文档策略大大简化了artifact的管理，提供了更加一致和可预测的用户体验。通过智能的创建/更新转换机制，用户无需思考文档管理的复杂性，专注于内容创作本身。
