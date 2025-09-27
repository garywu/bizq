#!/usr/bin/env -S npx tsx

/**
 * Test Claude Code CLI directly using the swarm service
 */

import { spawn } from 'child_process';

async function testClaudeCLIDirect() {
  console.log('🧪 Testing Claude Code CLI Directly\n');
  console.log('=' .repeat(50));
  
  // Test 1: Check if Claude CLI is available
  console.log('\n📋 Test 1: Check Claude CLI availability');
  console.log('-'.repeat(30));
  
  const checkVersion = () => {
    return new Promise((resolve) => {
      const proc = spawn('claude', ['--version']);
      let output = '';
      
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Claude CLI found:', output.trim());
          resolve(true);
        } else {
          console.log('❌ Claude CLI not found or returned error');
          resolve(false);
        }
      });
      
      proc.on('error', (err) => {
        console.log('❌ Error running Claude CLI:', err.message);
        resolve(false);
      });
    });
  };
  
  const isAvailable = await checkVersion();
  
  if (!isAvailable) {
    console.log('\n⚠️ Claude CLI is not available or not in PATH');
    return;
  }
  
  // Test 2: Simple non-interactive query
  console.log('\n📋 Test 2: Non-interactive query with echo');
  console.log('-'.repeat(30));
  
  const runSimpleQuery = () => {
    return new Promise((resolve) => {
      console.log('Running: echo "What is 2+2?" | claude');
      
      const echo = spawn('echo', ['What is 2+2?']);
      const claude = spawn('claude', [], { 
        env: { 
          ...process.env,
          CLAUDE_NON_INTERACTIVE: '1' // Try to force non-interactive mode
        }
      });
      
      let output = '';
      let errorOutput = '';
      
      // Pipe echo output to claude
      echo.stdout.pipe(claude.stdin);
      
      claude.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data); // Show output in real-time
      });
      
      claude.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      // Set a timeout
      const timeout = setTimeout(() => {
        console.log('\n⏱️ Query timed out after 10 seconds');
        claude.kill();
        resolve({ success: false, output, error: 'Timeout' });
      }, 10000);
      
      claude.on('close', (code) => {
        clearTimeout(timeout);
        console.log(`\nProcess exited with code ${code}`);
        resolve({ success: code === 0, output, error: errorOutput });
      });
      
      claude.on('error', (err) => {
        clearTimeout(timeout);
        console.log('❌ Error:', err.message);
        resolve({ success: false, output, error: err.message });
      });
    });
  };
  
  const result = await runSimpleQuery() as any;
  
  if (result.success) {
    console.log('\n✅ Query completed successfully');
  } else {
    console.log('\n⚠️ Query did not complete successfully');
    if (result.error) {
      console.log('Error details:', result.error);
    }
  }
  
  // Test 3: Try with different flags
  console.log('\n📋 Test 3: Try with print mode');
  console.log('-'.repeat(30));
  
  const runPrintQuery = () => {
    return new Promise((resolve) => {
      console.log('Running: claude with print mode');
      
      const claude = spawn('claude', ['--help']);
      
      let output = '';
      
      claude.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      claude.on('close', (code) => {
        if (output.includes('--print') || output.includes('print')) {
          console.log('✅ Print mode is available');
        } else if (output.includes('--json') || output.includes('json')) {
          console.log('✅ JSON mode is available');
        } else {
          console.log('ℹ️ Available flags:');
          // Show first few lines of help
          const lines = output.split('\n').slice(0, 20);
          lines.forEach(line => {
            if (line.includes('--')) {
              console.log('  ', line.trim());
            }
          });
        }
        resolve(true);
      });
      
      claude.on('error', () => {
        resolve(false);
      });
    });
  };
  
  await runPrintQuery();
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 Summary:');
  console.log('- Claude CLI is installed and accessible');
  console.log('- Interactive mode may require terminal input');
  console.log('- SDKs provide programmatic access without interaction');
  console.log('- Fallback responses ensure BizQ remains functional');
}

// Run the test
testClaudeCLIDirect().catch(console.error);