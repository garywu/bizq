#!/usr/bin/env python3
"""
10Web Industry Explorer Data Downloader

This script downloads all industry data from 10Web's Industry Explorer
using their AJAX API endpoint and saves it to JSONL format.

Usage:
    python download-10web-industries.py

Requirements:
    uv add requests

Output:
    - 10web_industries.jsonl: Complete industry data in JSONL format
    - Console output showing download progress
"""

import requests
import json
import time
import sys
from datetime import datetime

def download_10web_industries():
    """
    Download all industry data from 10Web's Industry Explorer API.
    
    Returns:
        list: Complete list of industry data
    """
    base_url = "https://10web.io/wp-admin/admin-ajax.php"
    industries = []
    page = 1
    
    # Nonce token (MUST be updated per session - get from browser dev tools)
    # To get a fresh nonce:
    # 1. Go to https://10web.io/ai-website-builder/industries/
    # 2. Open browser dev tools (F12)
    # 3. Go to Network tab
    # 4. Scroll down to trigger infinite scroll
    # 5. Look for admin-ajax.php request and copy the nonce value
    nonce = "bbb329b0c0"  # UPDATE THIS WITH FRESH NONCE
    
    print(f"🚀 Starting 10Web Industry Explorer download at {datetime.now()}")
    print(f"📡 API Endpoint: {base_url}")
    print(f"🔑 Using nonce: {nonce}")
    print("-" * 50)
    
    while True:
        data = {
            "action": "industry_load_more",
            "nonce": nonce,
            "page": page,
            "post_type": "theme_10web_industry",
            "posts_per_page": 21,
            "post__not_in": "16956"
        }
        
        print(f"📄 Requesting page {page}...")
        
        try:
            response = requests.post(base_url, data=data, timeout=30)
            
            if response.status_code != 200:
                print(f"❌ Error: HTTP {response.status_code}")
                print(f"Response: {response.text[:200]}...")
                break
                
            result = response.json()
            
            # Check if we got data
            if not result or len(result) == 0:
                print("✅ No more data found - download complete!")
                break
                
            industries.extend(result)
            page += 1
            
            # Rate limiting to be respectful
            time.sleep(1)
            
            print(f"✅ Downloaded page {page-1}, total industries: {len(industries)}")
            
        except requests.exceptions.RequestException as e:
            print(f"❌ Request error: {e}")
            break
        except json.JSONDecodeError as e:
            print(f"❌ JSON decode error: {e}")
            print(f"Response text: {response.text[:500]}...")
            print("💡 This usually means the nonce token has expired.")
            print("   Please get a fresh nonce from browser dev tools.")
            break
    
    return industries

def save_to_jsonl(industries, filename="10web_industries.jsonl"):
    """
    Save industries data to JSONL format.
    
    Args:
        industries (list): List of industry data
        filename (str): Output filename
    """
    print(f"\n💾 Saving {len(industries)} industries to {filename}...")
    
    with open(filename, 'w', encoding='utf-8') as f:
        for industry in industries:
            f.write(json.dumps(industry, ensure_ascii=False) + '\n')
    
    print(f"✅ Successfully saved to {filename}")

def analyze_industries(industries):
    """
    Analyze the downloaded industry data.
    
    Args:
        industries (list): List of industry data
    """
    print(f"\n📊 Industry Data Analysis:")
    print(f"   Total Industries: {len(industries)}")
    
    if industries:
        # Sample analysis
        sample_industry = industries[0]
        print(f"   Sample Industry Keys: {list(sample_industry.keys())}")
        
        # Count by category if available
        if 'category' in sample_industry:
            categories = {}
            for industry in industries:
                cat = industry.get('category', 'Unknown')
                categories[cat] = categories.get(cat, 0) + 1
            
            print(f"   Categories Found: {len(categories)}")
            for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5]:
                print(f"     - {cat}: {count} industries")

def main():
    """Main function to run the download process."""
    try:
        # Download industries
        industries = download_10web_industries()
        
        if not industries:
            print("❌ No industries downloaded. Check your nonce token or network connection.")
            sys.exit(1)
        
        # Save to JSONL
        save_to_jsonl(industries)
        
        # Analyze results
        analyze_industries(industries)
        
        print(f"\n🎉 Download completed successfully!")
        print(f"   Total industries: {len(industries)}")
        print(f"   Output file: 10web_industries.jsonl")
        
    except KeyboardInterrupt:
        print("\n⏹️  Download interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
