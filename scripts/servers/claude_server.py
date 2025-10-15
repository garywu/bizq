#!/usr/bin/env -S uv run python

"""
Claude Code API Server
Provides HTTP endpoints for the BizQ frontend to use Claude Code CLI
Uses uv for Python package management
"""

# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "flask>=3.0.0",
#     "flask-cors>=4.0.0",
# ]
# ///

from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import hashlib
from typing import Optional, Dict, Any
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend access

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple in-memory cache
cache = {}
cache_hits = 0
cache_misses = 0

class ClaudeCodeService:
    """Service for interacting with Claude Code CLI"""
    
    @staticmethod
    def query(prompt: str, output_format: str = "text") -> str:
        """
        Execute a Claude Code query using the CLI in non-interactive mode
        """
        try:
            # Use echo to pipe the prompt to claude with --print flag
            # Escape quotes in the prompt
            escaped_prompt = prompt.replace('"', '\\"').replace("'", "\\'")
            cmd = f'echo "{escaped_prompt}" | claude --print --output-format {output_format}'
            
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return result.stdout.strip()
            else:
                error_msg = result.stderr.strip() if result.stderr else "Unknown error"
                logger.error(f"Claude CLI error: {error_msg}")
                raise Exception(f"Claude CLI error: {error_msg}")
                
        except subprocess.TimeoutExpired:
            logger.error("Claude CLI query timeout")
            raise Exception("Query timeout - Claude took too long to respond")
        except Exception as e:
            logger.error(f"Error executing Claude query: {e}")
            raise

    @staticmethod
    def get_cache_key(prompt: str, task_type: str = "") -> str:
        """Generate a cache key for the prompt"""
        content = f"{task_type}:{prompt}".lower()
        return hashlib.md5(content.encode()).hexdigest()

# Initialize service
claude_service = ClaudeCodeService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Claude Code API Server',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/task', methods=['POST'])
def process_task():
    """
    Process a business task using Claude Code
    
    Expected JSON payload:
    {
        "businessId": "biz-001",
        "content": "Task description",
        "type": "financial|marketing|strategy|operations|general",
        "useCache": true
    }
    """
    try:
        data = request.json
        if not data or 'content' not in data:
            return jsonify({'error': 'Missing content in request'}), 400
        
        prompt = data['content']
        task_type = data.get('type', 'general')
        use_cache = data.get('useCache', True)
        business_id = data.get('businessId', 'unknown')
        
        # Check cache if enabled
        cache_key = claude_service.get_cache_key(prompt, task_type)
        if use_cache and cache_key in cache:
            global cache_hits
            cache_hits += 1
            logger.info(f"Cache hit for task: {prompt[:50]}...")
            cached_result = cache[cache_key]
            return jsonify({
                'success': True,
                'result': cached_result['result'],
                'cached': True,
                'cacheKey': cache_key,
                'businessId': business_id,
                'credits': 1  # Reduced credits for cached result
            })
        
        # Build contextual prompt based on task type
        contextual_prompt = build_contextual_prompt(prompt, task_type)
        
        # Query Claude Code
        global cache_misses
        cache_misses += 1
        logger.info(f"Processing task: {prompt[:50]}...")
        
        result = claude_service.query(contextual_prompt)
        
        # Cache the result
        cache[cache_key] = {
            'result': result,
            'timestamp': datetime.now().isoformat(),
            'task_type': task_type
        }
        
        return jsonify({
            'success': True,
            'result': result,
            'cached': False,
            'businessId': business_id,
            'credits': 10  # Full credits for new processing
        })
        
    except Exception as e:
        logger.error(f"Error processing task: {e}")
        # Return fallback response
        fallback = get_fallback_response(data.get('type', 'general'), data.get('content', ''))
        return jsonify({
            'success': True,
            'result': fallback,
            'fallback': True,
            'error': str(e),
            'credits': 5
        })

@app.route('/api/bulk-task', methods=['POST'])
def process_bulk_tasks():
    """
    Process multiple tasks across different businesses
    
    Expected JSON payload:
    {
        "businessIds": ["biz-001", "biz-002"],
        "content": "Task description",
        "type": "general"
    }
    """
    try:
        data = request.json
        business_ids = data.get('businessIds', [])
        content = data.get('content', '')
        task_type = data.get('type', 'general')
        
        if not business_ids or not content:
            return jsonify({'error': 'Missing businessIds or content'}), 400
        
        results = []
        
        # Process for each business (could be parallelized)
        for business_id in business_ids:
            try:
                # Check cache first
                cache_key = claude_service.get_cache_key(content, task_type)
                if cache_key in cache:
                    results.append({
                        'businessId': business_id,
                        'success': True,
                        'result': cache[cache_key]['result'],
                        'cached': True
                    })
                else:
                    # Query Claude
                    contextual_prompt = build_contextual_prompt(content, task_type)
                    result = claude_service.query(contextual_prompt)
                    
                    # Cache it
                    cache[cache_key] = {
                        'result': result,
                        'timestamp': datetime.now().isoformat(),
                        'task_type': task_type
                    }
                    
                    results.append({
                        'businessId': business_id,
                        'success': True,
                        'result': result,
                        'cached': False
                    })
                    
            except Exception as e:
                results.append({
                    'businessId': business_id,
                    'success': False,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'results': results,
            'totalCredits': len(business_ids) * 5
        })
        
    except Exception as e:
        logger.error(f"Error in bulk processing: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate', methods=['POST'])
def generate_content():
    """
    Generate specific content using Claude Code
    
    Expected JSON payload:
    {
        "type": "marketing|email|report|code",
        "context": {...},
        "format": "text|json"
    }
    """
    try:
        data = request.json
        content_type = data.get('type', 'general')
        context = data.get('context', {})
        output_format = data.get('format', 'text')
        
        # Build generation prompt
        prompt = build_generation_prompt(content_type, context)
        
        # Query Claude
        result = claude_service.query(prompt, output_format)
        
        # Parse JSON if requested
        if output_format == 'json':
            try:
                result = json.loads(result)
            except:
                pass  # Return as text if JSON parsing fails
        
        return jsonify({
            'success': True,
            'content': result,
            'type': content_type,
            'credits': 15
        })
        
    except Exception as e:
        logger.error(f"Error generating content: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cache/stats', methods=['GET'])
def cache_stats():
    """Get cache statistics"""
    return jsonify({
        'cacheSize': len(cache),
        'cacheHits': cache_hits,
        'cacheMisses': cache_misses,
        'hitRate': f"{(cache_hits / (cache_hits + cache_misses) * 100):.1f}%" if (cache_hits + cache_misses) > 0 else "0%",
        'entries': [
            {
                'key': key,
                'timestamp': value['timestamp'],
                'type': value['task_type']
            }
            for key, value in list(cache.items())[:10]  # Show last 10 entries
        ]
    })

@app.route('/api/cache/clear', methods=['POST'])
def clear_cache():
    """Clear the cache"""
    global cache, cache_hits, cache_misses
    cache = {}
    cache_hits = 0
    cache_misses = 0
    return jsonify({'success': True, 'message': 'Cache cleared'})

@app.route('/api/test', methods=['GET'])
def test_claude():
    """Test Claude CLI directly"""
    try:
        result = claude_service.query("What is 2+2?")
        return jsonify({
            'success': True,
            'result': result,
            'message': 'Claude CLI is working!'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Claude CLI test failed'
        })

def build_contextual_prompt(prompt: str, task_type: str) -> str:
    """Build a contextual prompt based on task type"""
    prefixes = {
        'financial': f"Analyze this financial question and provide specific insights: {prompt}",
        'marketing': f"Create a marketing solution for: {prompt}",
        'strategy': f"Provide strategic business advice for: {prompt}",
        'operations': f"Suggest operational improvements for: {prompt}",
        'general': prompt
    }
    return prefixes.get(task_type, prompt)

def build_generation_prompt(content_type: str, context: Dict) -> str:
    """Build a generation prompt based on content type"""
    templates = {
        'marketing': f"Create engaging marketing content for: {json.dumps(context)}",
        'email': f"Write a professional business email based on: {json.dumps(context)}",
        'report': f"Generate a business report for: {json.dumps(context)}",
        'code': f"Generate clean, commented code for: {json.dumps(context)}"
    }
    return templates.get(content_type, f"Generate {content_type} content: {json.dumps(context)}")

def get_fallback_response(task_type: str, content: str) -> str:
    """Get a fallback response when Claude is unavailable"""
    fallbacks = {
        'financial': "Based on the financial query, I recommend reviewing your cash flow, optimizing expenses, and maintaining a 20% profit margin target.",
        'marketing': "For this marketing challenge, consider focusing on your target audience, creating engaging content, and measuring ROI across channels.",
        'strategy': "Strategically, prioritize customer retention, operational efficiency, and sustainable growth while managing risks.",
        'operations': "To optimize operations, implement process automation, improve inventory management, and enhance quality control.",
        'general': f"I'll help you with: {content[:100]}. Focus on efficiency, measurement, and continuous improvement."
    }
    return fallbacks.get(task_type, f"Processing your request: {content[:100]}")

if __name__ == '__main__':
    import sys
    
    # Check if Claude CLI is available
    try:
        result = subprocess.run(['claude', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            logger.info(f"✅ Claude CLI found: {result.stdout.strip()}")
        else:
            logger.warning("⚠️ Claude CLI not found, will use fallback responses")
    except:
        logger.warning("⚠️ Claude CLI not available, will use fallback responses")
    
    # Get port from command line or use default
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5000
    
    logger.info(f"""
🚀 Claude Code API Server Starting (with uv)
📍 URL: http://localhost:{port}
📡 Endpoints:
   - POST /api/task - Process single task
   - POST /api/bulk-task - Process multiple tasks
   - POST /api/generate - Generate content
   - GET /api/cache/stats - Cache statistics
   - POST /api/cache/clear - Clear cache
   - GET /api/test - Test Claude CLI
   - GET /health - Health check

💡 Frontend Integration:
   fetch('http://localhost:{port}/api/task', {{
     method: 'POST',
     headers: {{ 'Content-Type': 'application/json' }},
     body: JSON.stringify({{
       businessId: 'biz-001',
       content: 'Your task here',
       type: 'financial'
     }})
   }})

🧪 Test the API:
   curl http://localhost:{port}/api/test
""")
    
    app.run(host='0.0.0.0', port=port, debug=True)