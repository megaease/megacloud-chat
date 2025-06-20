#!/usr/bin/env node

// Test script for artifact system
const BASE_URL = 'http://localhost:3001';

async function testArtifactSystem() {
  console.log('🧪 Testing Artifact System...\n');

  // For testing, we'll manually use existing data or create via proper flow
  // Let's first check what chats exist in the database
  console.log('0. Checking existing chats...');
  const existingChatsResponse = await fetch(`${BASE_URL}/api/chats`, {
    headers: {
      'userId': 'test-user-id'
    }
  });

  let chatId = 'test-chat-id-fallback';
  if (existingChatsResponse.ok) {
    const chatsData = await existingChatsResponse.json();
    if (chatsData.chats && chatsData.chats.length > 0) {
      chatId = chatsData.chats[0].id;
      console.log('✅ Using existing chat:', chatId);
    } else {
      console.log('⚠️ No existing chats found, will try to create one via direct insertion');
      // For now, we'll use a known chatId that we'll create manually in Drizzle Studio
      chatId = 'manual-test-chat-id';
    }
  } else {
    console.log('⚠️ Failed to fetch chats, using fallback chat ID');
  }

  // Test 1: Create an artifact
  console.log('1. Testing artifact creation...');
  const createResponse = await fetch(`${BASE_URL}/api/artifacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Test Document',
      content: 'This is a test document content.',
      kind: 'text',
      userId: 'test-user-id',
      chatId: chatId,
      isPublic: false,
      tags: ['test', 'document']
    })
  });

  if (!createResponse.ok) {
    console.error('❌ Failed to create artifact:', await createResponse.text());
    return;
  }

  const createdArtifact = await createResponse.json();
  console.log('✅ Created artifact:', {
    id: createdArtifact.id,
    version: createdArtifact.version,
    title: createdArtifact.title
  });

  const artifactId = createdArtifact.id;

  // Test 2: Get artifact by ID
  console.log('\n2. Testing artifact retrieval...');
  const getResponse = await fetch(`${BASE_URL}/api/artifacts/${artifactId}?userId=test-user-id`);
  
  if (!getResponse.ok) {
    console.error('❌ Failed to get artifact:', await getResponse.text());
    return;
  }

  const retrievedArtifact = await getResponse.json();
  console.log('✅ Retrieved artifact:', {
    id: retrievedArtifact.artifact.id,
    version: retrievedArtifact.artifact.version,
    title: retrievedArtifact.artifact.title
  });

  // Test 3: Update artifact (create new version)
  console.log('\n3. Testing artifact update...');
  const updateResponse = await fetch(`${BASE_URL}/api/artifacts/${artifactId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Updated Test Document',
      content: 'This is updated content for the test document.',
      kind: 'text',
      userId: 'test-user-id',
      changeDescription: 'Updated title and content'
    })
  });

  if (!updateResponse.ok) {
    console.error('❌ Failed to update artifact:', await updateResponse.text());
    return;
  }

  const updatedArtifact = await updateResponse.json();
  console.log('✅ Updated artifact:', {
    id: updatedArtifact.id,
    version: updatedArtifact.version,
    title: updatedArtifact.title,
    changeDescription: updatedArtifact.changeDescription
  });

  // Test 4: Get artifact versions
  console.log('\n4. Testing artifact versions retrieval...');
  const versionsResponse = await fetch(`${BASE_URL}/api/artifacts/${artifactId}?userId=test-user-id&versions=true`);
  
  if (!versionsResponse.ok) {
    console.error('❌ Failed to get artifact versions:', await versionsResponse.text());
    return;
  }

  const versionsData = await versionsResponse.json();
  console.log('✅ Retrieved versions:', versionsData.versions.map((v) => ({
    version: v.version,
    title: v.title,
    changeDescription: v.changeDescription,
    createdAt: v.createdAt
  })));

  // Test 5: Get specific version
  console.log('\n5. Testing specific version retrieval...');
  const specificVersionResponse = await fetch(`${BASE_URL}/api/artifacts/${artifactId}?userId=test-user-id&version=1`);
  
  if (!specificVersionResponse.ok) {
    console.error('❌ Failed to get specific version:', await specificVersionResponse.text());
    return;
  }

  const specificVersion = await specificVersionResponse.json();
  console.log('✅ Retrieved version 1:', {
    id: specificVersion.artifact.id,
    version: specificVersion.artifact.version,
    title: specificVersion.artifact.title
  });

  // Test 6: List all artifacts
  console.log('\n6. Testing artifacts listing...');
  const listResponse = await fetch(`${BASE_URL}/api/artifacts?userId=test-user-id`);
  
  if (!listResponse.ok) {
    console.error('❌ Failed to list artifacts:', await listResponse.text());
    return;
  }

  const listData = await listResponse.json();
  console.log('✅ Listed artifacts:', listData.artifacts.map((a) => ({
    id: a.id,
    version: a.version,
    title: a.title
  })));

  console.log('\n🎉 All artifact system tests passed!');
}

// Run the tests
testArtifactSystem().catch(console.error);
