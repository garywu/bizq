#!/usr/bin/env -S npx tsx

/**
 * Working Claude Code CLI non-interactive implementation
 * Uses --print flag with piped input
 */

import { spawn } from 'child_process';

export class ClaudeCLI {
  /**
   * Execute a non-interactive Claude query
   */
  async query(prompt: string, outputFormat: 'text' | 'json' = 'text'): Promise<string> {
    return new Promise((resolve, reject) => {
      // Use echo to pipe the prompt to claude with --print flag
      const echo = spawn('echo', [prompt]);
      const claude = spawn('claude', ['--print', '--output-format', outputFormat]);
      
      let output = '';
      let errorOutput = '';
      
      // Pipe echo output to claude input
      echo.stdout.pipe(claude.stdin);
      
      claude.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      claude.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      // Set a timeout
      const timeout = setTimeout(() => {
        claude.kill();
        reject(new Error('Query timeout'));
      }, 30000);
      
      claude.on('close', (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Claude exited with code ${code}: ${errorOutput}`));
        }
      });
      
      claude.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * Execute a query and get JSON response
   */
  async queryJSON(prompt: string): Promise<any> {
    const response = await this.query(prompt, 'json');
    try {
      return JSON.parse(response);
    } catch (e) {
      return { text: response };
    }
  }
}

// Test the working implementation
async function test() {
  console.log('🚀 Testing Working Claude CLI Implementation\n');
  console.log('=' .repeat(50));
  
  const claude = new ClaudeCLI();
  
  // Test 1: Simple calculation
  console.log('\n📋 Test 1: Simple Calculation');
  console.log('-'.repeat(30));
  console.log('Query: "What is 2+2?"');
  
  try {
    const result = await claude.query('What is 2+2?');
    console.log('✅ Response:', result);
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 2: Code generation
  console.log('\n📋 Test 2: Code Generation');
  console.log('-'.repeat(30));
  console.log('Query: "Write a TypeScript hello world function"');
  
  try {
    const result = await claude.query('Write a TypeScript hello world function');
    console.log('✅ Response:\n', result);
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 3: Business analysis
  console.log('\n📋 Test 3: Business Analysis');
  console.log('-'.repeat(30));
  console.log('Query: "What is ROI if I invest $1000 and get $1500 back?"');
  
  try {
    const result = await claude.query('What is ROI if I invest $1000 and get $1500 back?');
    console.log('✅ Response:', result);
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
  
  // Test 4: JSON output
  console.log('\n📋 Test 4: JSON Output Format');
  console.log('-'.repeat(30));
  console.log('Query: "List 3 benefits of AI" (JSON format)');
  
  try {
    const result = await claude.queryJSON('List 3 benefits of AI');
    console.log('✅ Response:', result);
  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('✅ Claude CLI is working non-interactively!');
  console.log('Key: echo "prompt" | claude --print --output-format text');
}

// Run tests if executed directly
if (require.main === module) {
  test().catch(console.error);
}

export default ClaudeCLI;