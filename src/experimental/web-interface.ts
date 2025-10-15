#!/usr/bin/env -S npx tsx

/**
 * BizQ Web Interface
 * Mobile-first interface for managing multiple businesses
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import BizQCoreV2 from '../core/bizq-core-v2';
import BizQMarketplace from '../core/marketplace';
import PatternDetector from '../core/pattern-detector';
import BizQAIManager from '../providers/ai-manager';
import { getSettings, printSettings } from '../core/settings';

// Load configuration
const config = getSettings();

const app = express();
const server = createServer(app);
const io = new Server(server);

// Print configuration on startup
printSettings(config);

// Initialize BizQ components
const core = new BizQCoreV2();
const marketplace = new BizQMarketplace();
const patternDetector = new PatternDetector();

// Initialize AI Manager with configuration from settings
const aiManager = new BizQAIManager({
  type: config.ai.provider,
  baseURL: config.ai.baseURL,
  model: config.ai.model,
  fallback: config.ai.fallback
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Store active businesses for demo
const businesses = new Map([
  ['biz-001', { 
    id: 'biz-001', 
    name: 'TechGear Store', 
    revenue: 125000,
    tasks: 45,
    health: 92
  }],
  ['biz-002', { 
    id: 'biz-002', 
    name: 'Organic Beauty', 
    revenue: 89000,
    tasks: 32,
    health: 88
  }],
  ['biz-003', { 
    id: 'biz-003', 
    name: 'Pet Supplies Co', 
    revenue: 156000,
    tasks: 67,
    health: 95
  }],
  ['biz-004', { 
    id: 'biz-004', 
    name: 'Home Fitness Pro', 
    revenue: 78000,
    tasks: 28,
    health: 79
  }],
  ['biz-005', { 
    id: 'biz-005', 
    name: 'Gourmet Coffee', 
    revenue: 234000,
    tasks: 89,
    health: 97
  }]
]);

// API Routes
app.get('/api/businesses', (req, res) => {
  res.json(Array.from(businesses.values()));
});

app.get('/api/marketplace/stats', (req, res) => {
  res.json(marketplace.getStats());
});

app.get('/api/marketplace/workers', (req, res) => {
  res.json(marketplace.getLeaderboard(10));
});

app.get('/api/patents/stats', (req, res) => {
  res.json(patternDetector.getStats());
});

app.post('/api/task', async (req, res) => {
  const { businessId, content, type, priority } = req.body;
  
  try {
    // Submit to core
    const result = await core.submitTask({
      businessId,
      content,
      type: type || 'general',
      priority: priority || 'medium',
      credits: 10
    });
    
    // Emit real-time update
    io.emit('task:completed', {
      businessId,
      content,
      result,
      timestamp: new Date()
    });
    
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/bulk-task', async (req, res) => {
  const { content, type, businessIds } = req.body;
  
  const results = [];
  for (const bizId of businessIds) {
    try {
      const result = await core.submitTask({
        businessId: bizId,
        content,
        type: type || 'general',
        credits: 5
      });
      results.push({ businessId: bizId, success: true, result });
      
      // Emit progress
      io.emit('bulk:progress', {
        completed: results.length,
        total: businessIds.length
      });
    } catch (error: any) {
      results.push({ businessId: bizId, success: false, error: error.message });
    }
  }
  
  res.json({ results });
});

// AI-powered endpoints using the AI Manager
app.post('/api/ai/process-task', async (req, res) => {
  try {
    const { businessId, content, type, metadata } = req.body;
    
    const result = await aiManager.processTask({
      businessId,
      content,
      type: type || 'general',
      metadata
    });
    
    // Emit real-time update
    io.emit('ai:task:completed', {
      businessId,
      content,
      result,
      timestamp: new Date()
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ai/generate-content', async (req, res) => {
  try {
    const { type, context } = req.body;
    
    const content = await aiManager.generateContent(type, context);
    
    res.json({ success: true, content });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ai/analyze-data', async (req, res) => {
  try {
    const { data, analysisType } = req.body;
    
    const analysis = await aiManager.analyzeData(data, analysisType);
    
    res.json({ success: true, analysis });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/ai/make-decision', async (req, res) => {
  try {
    const { situation, options, constraints } = req.body;
    
    const decision = await aiManager.makeDecision({
      situation,
      options,
      constraints
    });
    
    res.json({ success: true, decision });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/ai/health', async (req, res) => {
  try {
    const health = await aiManager.healthCheck();
    const models = await aiManager.getAvailableModels();
    
    res.json({ 
      success: true, 
      health, 
      models,
      config: {
        provider: config.ai.provider,
        baseURL: config.ai.baseURL,
        model: config.ai.model,
        fallback: config.ai.fallback,
        timeout: config.ai.timeout,
        maxRetries: config.ai.maxRetries
      },
      server: {
        host: config.host,
        port: config.port,
        environment: config.environment
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Streaming AI responses
app.get('/api/ai/stream/:prompt', async (req, res) => {
  try {
    const { prompt } = req.params;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    for await (const chunk of aiManager.streamCompletion(decodeURIComponent(prompt))) {
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve the HTML interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>BizQ - AI-First Business Management</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            padding-bottom: 80px;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 15px 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: sticky;
            top: 0;
            z-index: 100;
        }
        
        .header h1 {
            font-size: 24px;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .header .subtitle {
            font-size: 12px;
            color: #666;
        }
        
        .stats-bar {
            display: flex;
            justify-content: space-around;
            background: rgba(255, 255, 255, 0.9);
            padding: 15px;
            margin: 15px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            font-size: 11px;
            color: #666;
            margin-top: 3px;
        }
        
        .businesses {
            padding: 15px;
        }
        
        .business-card {
            background: white;
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s;
            cursor: pointer;
        }
        
        .business-card:active {
            transform: scale(0.98);
        }
        
        .business-card.selected {
            border: 2px solid #667eea;
        }
        
        .business-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .business-name {
            font-size: 16px;
            font-weight: 600;
        }
        
        .health-score {
            font-size: 14px;
            padding: 3px 8px;
            border-radius: 15px;
            font-weight: 500;
        }
        
        .health-good { background: #d4edda; color: #155724; }
        .health-warning { background: #fff3cd; color: #856404; }
        .health-critical { background: #f8d7da; color: #721c24; }
        
        .business-metrics {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            color: #666;
        }
        
        .quick-actions {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            padding: 15px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            display: flex;
            gap: 10px;
        }
        
        .action-btn {
            flex: 1;
            padding: 12px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-secondary {
            background: #f0f0f0;
            color: #333;
        }
        
        .action-btn:active {
            transform: scale(0.95);
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 200;
            align-items: center;
            justify-content: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: white;
            width: 90%;
            max-width: 400px;
            border-radius: 15px;
            padding: 20px;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .modal-header {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 15px;
        }
        
        .input-group {
            margin-bottom: 15px;
        }
        
        .input-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .input-field {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
        }
        
        .task-select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
            background: white;
        }
        
        .notification {
            position: fixed;
            top: 80px;
            right: 15px;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            max-width: 300px;
            z-index: 300;
            animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .workers-list {
            margin-top: 15px;
        }
        
        .worker-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: #f9f9f9;
            border-radius: 8px;
            margin-bottom: 8px;
        }
        
        .worker-name {
            font-size: 14px;
            font-weight: 500;
        }
        
        .worker-stats {
            font-size: 12px;
            color: #666;
        }
        
        @media (max-width: 600px) {
            .stats-bar {
                flex-wrap: wrap;
            }
            .stat {
                width: 50%;
                margin-bottom: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>BizQ</h1>
        <div class="subtitle">Managing 5 businesses with AI</div>
    </div>
    
    <div class="stats-bar">
        <div class="stat">
            <div class="stat-value" id="totalRevenue">$0</div>
            <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat">
            <div class="stat-value" id="activeTasks">0</div>
            <div class="stat-label">Active Tasks</div>
        </div>
        <div class="stat">
            <div class="stat-value" id="aiAutomation">0%</div>
            <div class="stat-label">AI Automation</div>
        </div>
        <div class="stat">
            <div class="stat-value" id="creditsSaved">0</div>
            <div class="stat-label">Credits Saved</div>
        </div>
    </div>
    
    <div class="businesses" id="businessList">
        <!-- Business cards will be populated here -->
    </div>
    
    <div class="quick-actions">
        <button class="action-btn btn-primary" onclick="showTaskModal()">
            🤖 AI Task
        </button>
        <button class="action-btn btn-secondary" onclick="showBulkModal()">
            📋 Bulk Action
        </button>
        <button class="action-btn btn-secondary" onclick="showMarketplace()">
            🏪 Marketplace
        </button>
    </div>
    
    <!-- Task Modal -->
    <div class="modal" id="taskModal">
        <div class="modal-content">
            <div class="modal-header">Submit Task to AI</div>
            
            <div class="input-group">
                <div class="input-label">Task Description</div>
                <input type="text" class="input-field" id="taskContent" 
                       placeholder="e.g., Optimize pricing for Black Friday">
            </div>
            
            <div class="input-group">
                <div class="input-label">Task Type</div>
                <select class="task-select" id="taskType">
                    <option value="general">General</option>
                    <option value="financial">Financial Analysis</option>
                    <option value="marketing">Marketing</option>
                    <option value="content">Content Creation</option>
                    <option value="strategy">Strategy</option>
                    <option value="legal">Legal Review</option>
                </select>
            </div>
            
            <div class="input-group">
                <div class="input-label">Priority</div>
                <select class="task-select" id="taskPriority">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                </select>
            </div>
            
            <button class="action-btn btn-primary" onclick="submitTask()" style="width: 100%;">
                Submit Task
            </button>
            <button class="action-btn btn-secondary" onclick="closeModal()" style="width: 100%; margin-top: 10px;">
                Cancel
            </button>
        </div>
    </div>
    
    <!-- Bulk Action Modal -->
    <div class="modal" id="bulkModal">
        <div class="modal-content">
            <div class="modal-header">Bulk Action Across Businesses</div>
            
            <div class="input-group">
                <div class="input-label">Select Businesses</div>
                <div id="businessCheckboxes">
                    <!-- Checkboxes will be populated here -->
                </div>
            </div>
            
            <div class="input-group">
                <div class="input-label">Bulk Task</div>
                <input type="text" class="input-field" id="bulkTaskContent" 
                       placeholder="e.g., Update holiday shipping policy">
            </div>
            
            <button class="action-btn btn-primary" onclick="submitBulkTask()" style="width: 100%;">
                Execute on Selected
            </button>
            <button class="action-btn btn-secondary" onclick="closeModal()" style="width: 100%; margin-top: 10px;">
                Cancel
            </button>
        </div>
    </div>
    
    <!-- Marketplace Modal -->
    <div class="modal" id="marketplaceModal">
        <div class="modal-content">
            <div class="modal-header">Marketplace Workers</div>
            
            <div class="workers-list" id="workersList">
                <!-- Workers will be populated here -->
            </div>
            
            <button class="action-btn btn-secondary" onclick="closeModal()" style="width: 100%; margin-top: 15px;">
                Close
            </button>
        </div>
    </div>
    
    <script>
        const socket = io();
        let selectedBusinesses = new Set();
        let creditsSaved = 0;
        let taskCount = 0;
        
        // Load businesses on startup
        async function loadBusinesses() {
            const response = await fetch('/api/businesses');
            const businesses = await response.json();
            
            const container = document.getElementById('businessList');
            container.innerHTML = '';
            
            let totalRevenue = 0;
            
            businesses.forEach(biz => {
                totalRevenue += biz.revenue;
                const healthClass = biz.health > 90 ? 'health-good' : 
                                  biz.health > 75 ? 'health-warning' : 'health-critical';
                
                const card = document.createElement('div');
                card.className = 'business-card';
                card.onclick = () => toggleBusinessSelection(biz.id);
                card.innerHTML = \`
                    <div class="business-header">
                        <div class="business-name">\${biz.name}</div>
                        <div class="health-score \${healthClass}">\${biz.health}% Health</div>
                    </div>
                    <div class="business-metrics">
                        <span>Revenue: $\${(biz.revenue/1000).toFixed(0)}k</span>
                        <span>Tasks: \${biz.tasks}</span>
                        <span>ID: \${biz.id}</span>
                    </div>
                \`;
                container.appendChild(card);
            });
            
            document.getElementById('totalRevenue').textContent = 
                '$' + (totalRevenue/1000).toFixed(0) + 'k';
            
            // Update bulk checkboxes
            const checkboxContainer = document.getElementById('businessCheckboxes');
            checkboxContainer.innerHTML = businesses.map(biz => \`
                <label style="display: block; margin: 5px 0;">
                    <input type="checkbox" value="\${biz.id}" style="margin-right: 8px;">
                    \${biz.name}
                </label>
            \`).join('');
        }
        
        function toggleBusinessSelection(bizId) {
            if (selectedBusinesses.has(bizId)) {
                selectedBusinesses.delete(bizId);
            } else {
                selectedBusinesses.clear(); // Single selection for now
                selectedBusinesses.add(bizId);
            }
            updateBusinessCards();
        }
        
        function updateBusinessCards() {
            document.querySelectorAll('.business-card').forEach((card, index) => {
                const bizId = 'biz-00' + (index + 1);
                if (selectedBusinesses.has(bizId)) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
            });
        }
        
        function showTaskModal() {
            if (selectedBusinesses.size === 0) {
                showNotification('Please select a business first', 'warning');
                return;
            }
            document.getElementById('taskModal').classList.add('active');
        }
        
        function showBulkModal() {
            document.getElementById('bulkModal').classList.add('active');
        }
        
        async function showMarketplace() {
            const response = await fetch('/api/marketplace/workers');
            const workers = await response.json();
            
            const container = document.getElementById('workersList');
            container.innerHTML = workers.map(worker => \`
                <div class="worker-item">
                    <div>
                        <div class="worker-name">\${worker.name}</div>
                        <div class="worker-stats">
                            \${worker.type} • \${worker.completedTasks} tasks • \${worker.rating}⭐
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 14px; font-weight: 600; color: #667eea;">
                            \${worker.earnings} credits
                        </div>
                        <div class="worker-stats">
                            $\${worker.pricePerTask}/task
                        </div>
                    </div>
                </div>
            \`).join('');
            
            document.getElementById('marketplaceModal').classList.add('active');
        }
        
        function closeModal() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        }
        
        async function submitTask() {
            const businessId = Array.from(selectedBusinesses)[0];
            const content = document.getElementById('taskContent').value;
            const type = document.getElementById('taskType').value;
            const priority = document.getElementById('taskPriority').value;
            
            if (!content) {
                showNotification('Please enter a task description', 'error');
                return;
            }
            
            const response = await fetch('/api/task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessId, content, type, priority })
            });
            
            const result = await response.json();
            
            if (result.success) {
                showNotification('Task completed successfully!', 'success');
                taskCount++;
                creditsSaved += 10;
                updateStats();
                closeModal();
                document.getElementById('taskContent').value = '';
            } else {
                showNotification('Task failed: ' + result.error, 'error');
            }
        }
        
        async function submitBulkTask() {
            const checkboxes = document.querySelectorAll('#businessCheckboxes input:checked');
            const businessIds = Array.from(checkboxes).map(cb => cb.value);
            const content = document.getElementById('bulkTaskContent').value;
            
            if (businessIds.length === 0) {
                showNotification('Please select at least one business', 'error');
                return;
            }
            
            if (!content) {
                showNotification('Please enter a task description', 'error');
                return;
            }
            
            showNotification(\`Executing on \${businessIds.length} businesses...\`, 'info');
            
            const response = await fetch('/api/bulk-task', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ businessIds, content, type: 'general' })
            });
            
            const result = await response.json();
            const successCount = result.results.filter(r => r.success).length;
            
            showNotification(\`Completed \${successCount}/\${businessIds.length} tasks\`, 'success');
            taskCount += successCount;
            creditsSaved += successCount * 5;
            updateStats();
            closeModal();
            document.getElementById('bulkTaskContent').value = '';
        }
        
        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.style.background = type === 'error' ? '#f8d7da' :
                                          type === 'warning' ? '#fff3cd' :
                                          type === 'success' ? '#d4edda' : '#d1ecf1';
            notification.style.color = type === 'error' ? '#721c24' :
                                      type === 'warning' ? '#856404' :
                                      type === 'success' ? '#155724' : '#0c5460';
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
        
        function updateStats() {
            document.getElementById('activeTasks').textContent = taskCount;
            document.getElementById('creditsSaved').textContent = creditsSaved;
            const automationRate = taskCount > 0 ? Math.min(95, 60 + taskCount * 5) : 60;
            document.getElementById('aiAutomation').textContent = automationRate + '%';
        }
        
        // Socket.IO event listeners
        socket.on('task:completed', (data) => {
            showNotification(\`Task completed for \${data.businessId}\`, 'success');
        });
        
        socket.on('bulk:progress', (data) => {
            showNotification(\`Progress: \${data.completed}/\${data.total}\`, 'info');
        });
        
        // Initialize
        loadBusinesses();
        updateStats();
    </script>
</body>
</html>
  `);
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('📱 User connected to BizQ');
  
  socket.on('disconnect', () => {
    console.log('📱 User disconnected');
  });
});

// Set up real-time event forwarding
core.on('task:completed', (data) => {
  io.emit('task:completed', data);
});

core.on('cache:hit', (data) => {
  io.emit('cache:hit', data);
});

marketplace.on('task:completed', (data) => {
  io.emit('marketplace:task-completed', data);
});

// Start server
server.listen(config.port, config.host, () => {
  console.log(`
🚀 BizQ Web Interface Running!
📱 Open: http://${config.host}:${config.port}

Features:
- Multi-business dashboard
- AI task delegation
- Bulk operations across businesses
- Real-time marketplace
- Mobile-first responsive design

Try these actions:
1. Click a business to select it
2. Tap "AI Task" to submit a task
3. Use "Bulk Action" for multiple businesses
4. Check "Marketplace" for available workers
  `);
});