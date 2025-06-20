// test/test-artifact-api.js
const testChatCreation = async () => {
  try {
    // 先创建一个chat
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: 'test-chat-123',
        userId: 'test-user-123',
        modelName: 'gpt-4o-mini',
        apiKey: 'test-key',
        message: {
          id: 'test-message-id',
          role: 'user',
          content: 'Hello, create a simple JavaScript function',
          createdAt: new Date(),
        },
      }),
    });

    console.log('Chat creation response status:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('❌ Error creating chat:', error);
    return false;
  }
};

const testArtifactCreation = async () => {
  try {
    // 测试创建artifact
    const response = await fetch('http://localhost:3001/api/artifacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Artifact',
        content: 'console.log("Hello, World!");',
        kind: 'code',
        userId: 'test-user-123',
        chatId: 'test-chat-123',
        tags: ['test'],
        isPublic: false,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Artifact created successfully:', data.artifact);
      return data.artifact;
    }
    
    console.error('❌ Failed to create artifact:', response.status);
    const error = await response.json();
    console.error('Error details:', error);
    return null;
  } catch (error) {
    console.error('❌ Error testing artifact creation:', error);
    return null;
  }
};

const testArtifactRetrieval = async (userId) => {
  try {
    // 测试获取artifacts
    const response = await fetch(`http://localhost:3001/api/artifacts?userId=${userId}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Artifacts retrieved successfully:', data.artifacts);
      return data.artifacts;
    } else {
      console.error('❌ Failed to retrieve artifacts:', response.status);
    }
  } catch (error) {
    console.error('❌ Error testing artifact retrieval:', error);
  }
};

// 运行测试
const runTests = async () => {
  console.log('🧪 Testing Artifact API...\n');
  
  // 先创建chat
  console.log('Creating test chat...');
  const chatCreated = await testChatCreation();
  
  if (!chatCreated) {
    console.log('⚠️  Chat creation failed, but continuing with artifact test...');
  }
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试创建
  const artifact = await testArtifactCreation();
  
  if (artifact) {
    // 测试获取
    await testArtifactRetrieval('test-user-123');
  }
  
  console.log('\n✅ All tests completed!');
};

// 如果是直接运行这个脚本
if (typeof window === 'undefined') {
  runTests();
}

// 如果是在浏览器中运行
if (typeof window !== 'undefined') {
  window.testArtifactAPI = runTests;
}
