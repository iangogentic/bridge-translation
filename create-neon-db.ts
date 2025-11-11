// Autonomous Neon database creation via MCP
import { callMCPTool } from 'code-executor-mcp';

async function createDatabase() {
  try {
    console.log('Creating Neon PostgreSQL database...');
    
    const result = await callMCPTool('mcp__neon__create_project', {
      name: 'bridge-translation',
      region: 'us-east-1'
    });
    
    console.log('Database created successfully!');
    console.log('Connection string:', result.connectionString);
    console.log('\nAdd this to your .env.local:');
    console.log(`DATABASE_URL="${result.connectionString}"`);
    
    return result;
  } catch (error) {
    console.error('Failed to create database:', error);
    throw error;
  }
}

createDatabase();
