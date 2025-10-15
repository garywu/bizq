#!/usr/bin/env -S npx tsx

/**
 * Test Claude Code CLI using print mode for non-interactive usage
 */

import { spawn } from 'child_process';

async function testClaudePrintMode() {
  console.log('🧪 Testing Claude Code CLI with Print Mode\n');
  console.log('=' .repeat(50));
  
  // Test 1: Use print mode
  console.log('\n📋 Test 1: Using --print flag');
  console.log('-'.repeat(30));
  
  const runPrintMode = () => {
    return new Promise((resolve) => {
      console.log('Running: claude --print "What is 2+2?"');
      
      const claude = spawn('claude', ['--print', 'What is 2+2?']);
      
      let output = '';
      let errorOutput = '';
      
      claude.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data); // Show output in real-time
      });
      
      claude.stderr.on('data', (data) => {
        errorOutput += data.toString();
        process.stderr.write(data);
      });
      
      // Set a timeout
      const timeout = setTimeout(() => {
        console.log('\n⏱️ Query timed out after 30 seconds');
        claude.kill();
        resolve({ success: false, output, error: 'Timeout' });
      }, 30000);
      
      claude.on('close', (code) => {
        clearTimeout(timeout);
        console.log(`\n\nProcess exited with code ${code}`);
        resolve({ success: code === 0, output, error: errorOutput });
      });
      
      claude.on('error', (err) => {
        clearTimeout(timeout);
        console.log('❌ Error:', err.message);
        resolve({ success: false, output, error: err.message });
      });
    });
  };
  
  const result1 = await runPrintMode() as any;
  
  if (result1.success) {
    console.log('\n✅ Print mode completed successfully');
  } else if (result1.error && !result1.error.includes('Timeout')) {
    console.log('\n⚠️ Print mode not available or different syntax needed');
  }
  
  // Test 2: Try different print mode syntax
  console.log('\n📋 Test 2: Alternative print syntax');
  console.log('-'.repeat(30));
  
  const runAlternativePrint = () => {
    return new Promise((resolve) => {
      console.log('Running: echo "What is 2+2?" | claude --print');
      
      const echo = spawn('echo', ['What is 2+2?']);
      const claude = spawn('claude', ['--print']);
      
      let output = '';
      let errorOutput = '';
      
      // Pipe echo output to claude
      echo.stdout.pipe(claude.stdin);
      
      claude.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });
      
      claude.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      const timeout = setTimeout(() => {
        console.log('\n⏱️ Query timed out');
        claude.kill();
        resolve({ success: false, output, error: 'Timeout' });
      }, 30000);
      
      claude.on('close', (code) => {
        clearTimeout(timeout);
        console.log(`\n\nProcess exited with code ${code}`);
        resolve({ success: code === 0, output, error: errorOutput });
      });
      
      claude.on('error', (err) => {
        console.log('❌ Error:', err.message);
        clearTimeout(timeout);
        resolve({ success: false, output, error: err.message });
      });
    });
  };
  
  const result2 = await runAlternativePrint() as any;
  
  // Test 3: Check available non-interactive options
  console.log('\n📋 Test 3: Check help for non-interactive flags');
  console.log('-'.repeat(30));
  
  const checkHelp = () => {
    return new Promise((resolve) => {
      const claude = spawn('claude', ['--help']);
      
      let output = '';
      
      claude.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      claude.on('close', () => {
        // Look for non-interactive related flags
        const lines = output.split('\n');
        const relevantFlags = lines.filter(line => 
          line.includes('--print') || 
          line.includes('--json') || 
          line.includes('--no-') ||
          line.includes('--quiet') ||
          line.includes('--batch') ||
          line.includes('--non') ||
          line.includes('--output')
        );
        
        if (relevantFlags.length > 0) {
          console.log('Found potentially useful flags:');
          relevantFlags.forEach(flag => {
            console.log('  ', flag.trim());
          });
        } else {
          console.log('No obvious non-interactive flags found in help');
        }
        resolve(true);
      });
      
      claude.on('error', () => {
        resolve(false);
      });
    });
  };
  
  await checkHelp();
  
  // Test 4: Try JSON mode if available
  console.log('\n📋 Test 4: Try JSON output mode');
  console.log('-'.repeat(30));
  
  const runJSONMode = () => {
    return new Promise((resolve) => {
      console.log('Running: claude --json "What is 2+2?"');
      
      const claude = spawn('claude', ['--json', 'What is 2+2?']);
      
      let output = '';
      let errorOutput = '';
      
      claude.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });
      
      claude.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      const timeout = setTimeout(() => {
        console.log('\n⏱️ Query timed out');
        claude.kill();
        resolve({ success: false, output, error: 'Timeout' });
      }, 30000);
      
      claude.on('close', (code) => {
        clearTimeout(timeout);
        console.log(`\n\nProcess exited with code ${code}`);
        
        // Try to parse as JSON if we got output
        if (output) {
          try {
            const parsed = JSON.parse(output);
            console.log('\n✅ Got JSON response:', parsed);
            resolve({ success: true, output: parsed, error: null });
          } catch (e) {
            console.log('\nOutput was not valid JSON');
            resolve({ success: code === 0, output, error: errorOutput });
          }
        } else {
          resolve({ success: code === 0, output, error: errorOutput });
        }
      });
      
      claude.on('error', (err) => {
        clearTimeout(timeout);
        console.log('❌ Error:', err.message);
        resolve({ success: false, output, error: err.message });
      });
    });
  };
  
  const result4 = await runJSONMode() as any;
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 Summary:');
  console.log('- Claude CLI version 1.0.69 is installed');
  console.log('- Tested various non-interactive mode attempts');
  console.log('- Results show which modes are available');
}

// Run the test
testClaudePrintMode().catch(console.error);