// Test script to verify MCP status API
// You can run this in your browser's console to check the API response

async function testMCPStatus() {
  try {
    console.log('Testing MCP stats API...');
    
    const response = await fetch('/api/mcp/stats');
    const result = await response.json();
    
    console.log('MCP Stats API Response:', result);
    
    if (result.success && result.data) {
      console.log('Total servers in DB:', result.data.totalServers);
      console.log('Active connections:', result.data.connected);
      console.log('Connections details:', result.data.connections);
      
      for (const conn of result.data.connections) {
        console.log(`Server: ${conn.serverName}`);
        console.log(`  DB Status: ${conn.dbStatus}`);
        console.log(`  Connection Status: ${conn.status}`);
        console.log(`  Connected At: ${conn.connectedAt || 'Never'}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error testing MCP status:', error);
    return null;
  }
}

// Test initialize API
async function testMCPInitialize() {
  try {
    console.log('Testing MCP initialize API...');
    
    const response = await fetch('/api/mcp/initialize', {
      method: 'POST'
    });
    const result = await response.json();
    
    console.log('MCP Initialize API Response:', result);
    return result;
  } catch (error) {
    console.error('Error testing MCP initialize:', error);
    return null;
  }
}

// Export for use
if (typeof window !== 'undefined') {
  window.testMCPStatus = testMCPStatus;
  window.testMCPInitialize = testMCPInitialize;
}

console.log('MCP Status Test functions loaded. Use testMCPStatus() and testMCPInitialize() to test.');
