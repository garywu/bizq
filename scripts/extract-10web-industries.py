#!/usr/bin/env python3
"""
10Web Industries Data Extractor

This script extracts all industry data from the browser log files
and creates a comprehensive JSON dataset.
"""

import json
import re
import os
from datetime import datetime

def extract_industries_from_log(log_file_path):
    """Extract industry data from browser log file."""
    try:
        with open(log_file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find the JSON array in the log
        json_start = content.find('[')
        json_end = content.rfind(']') + 1
        
        if json_start == -1 or json_end == -1:
            print(f"❌ Could not find JSON data in {log_file_path}")
            return None
        
        # Extract and parse JSON
        json_data = content[json_start:json_end]
        industries = json.loads(json_data)
        
        return industries
        
    except Exception as e:
        print(f"❌ Error processing {log_file_path}: {e}")
        return None

def create_complete_dataset(industries):
    """Create the complete dataset structure."""
    return {
        "metadata": {
            "totalCount": len(industries),
            "platform": "10web",
            "source": "Industry Explorer",
            "extractedAt": datetime.now().isoformat(),
            "url": "https://10web.io/ai-website-builder/industries/",
            "extractionMethod": "Browser automation with Playwright",
            "description": "Complete list of industries from 10Web AI Website Builder Industry Explorer"
        },
        "industries": industries
    }

def save_to_jsonl(industries, filename):
    """Save industries to JSONL format."""
    with open(filename, 'w', encoding='utf-8') as f:
        for industry in industries:
            f.write(json.dumps(industry, ensure_ascii=False) + '\n')

def main():
    """Main extraction function."""
    # Find the most recent browser log file
    log_dir = "/Users/admin/.cursor/browser-logs"
    log_files = [f for f in os.listdir(log_dir) if f.startswith('browser_evaluate-') and f.endswith('.log')]
    
    if not log_files:
        print("❌ No browser log files found")
        return
    
    # Get the most recent log file
    latest_log = sorted(log_files)[-1]
    log_path = os.path.join(log_dir, latest_log)
    
    print(f"📁 Processing log file: {latest_log}")
    
    # Extract industries
    industries = extract_industries_from_log(log_path)
    
    if not industries:
        print("❌ Failed to extract industries")
        return
    
    print(f"✅ Successfully extracted {len(industries)} industries")
    
    # Create complete dataset
    complete_data = create_complete_dataset(industries)
    
    # Save to JSON
    json_filename = "research/developer-marketing-site/10web-industries-complete.json"
    with open(json_filename, 'w', encoding='utf-8') as f:
        json.dump(complete_data, f, indent=2, ensure_ascii=False)
    
    # Save to JSONL
    jsonl_filename = "research/developer-marketing-site/10web-industries.jsonl"
    save_to_jsonl(industries, jsonl_filename)
    
    print(f"💾 Saved complete dataset to {json_filename}")
    print(f"💾 Saved JSONL format to {jsonl_filename}")
    
    # Show sample data
    print(f"\n📋 Sample industries:")
    for i, industry in enumerate(industries[:5]):
        print(f"  {i+1}. {industry['title']}")
    
    if len(industries) > 5:
        print(f"  ... and {len(industries) - 5} more")
    
    # Show categories
    categories = {}
    for industry in industries:
        # Extract category from title (simple heuristic)
        title = industry['title'].lower()
        if any(word in title for word in ['store', 'shop', 'boutique', 'market']):
            category = 'retail'
        elif any(word in title for word in ['school', 'tutor', 'education', 'learning']):
            category = 'education'
        elif any(word in title for word in ['portfolio', 'artist', 'designer', 'creative']):
            category = 'creative'
        elif any(word in title for word in ['blog', 'news', 'media']):
            category = 'media'
        elif any(word in title for word in ['service', 'clinic', 'consulting']):
            category = 'services'
        else:
            category = 'other'
        
        categories[category] = categories.get(category, 0) + 1
    
    print(f"\n📊 Industry categories:")
    for category, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
        print(f"  {category}: {count} industries")

if __name__ == "__main__":
    main()
