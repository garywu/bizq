import asyncio
import logging
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any
import structlog

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import redis.asyncio as redis
import whois
from openai import AsyncOpenAI
import httpx

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Configuration
class Settings:
    redis_url: str = "redis://localhost:6379"
    openai_api_key: Optional[str] = None
    port: int = 3002
    rate_limit_requests: int = 50
    rate_limit_window: int = 3600  # 1 hour

settings = Settings()

# Pydantic models
class DomainSuggestionRequest(BaseModel):
    industry: str = Field(..., description="Business industry/sector")
    keywords: List[str] = Field(default_factory=list, description="Keywords describing the business")
    limit: int = Field(default=10, ge=1, le=20, description="Number of suggestions to return")
    check_availability: bool = Field(default=True, description="Check domain availability")

class DomainSuggestion(BaseModel):
    name: str = Field(..., description="Suggested domain name")
    available: Optional[bool] = Field(None, description="Domain availability status")
    tld: str = Field(default="com", description="Top-level domain")

class DomainSuggestionsResponse(BaseModel):
    suggestions: List[DomainSuggestion]
    industry: str
    keywords: List[str]
    processing_time: float
    source: str = "ai"

# Services
class CacheService:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)

    async def get(self, key: str) -> Optional[List[Dict[str, Any]]]:
        try:
            data = await self.redis.get(key)
            if data:
                return eval(data.decode())  # Simple JSON-like parsing
            return None
        except Exception as e:
            logger.error("Cache get error", key=key, error=str(e))
            return None

    async def set(self, key: str, value: List[Dict[str, Any]], ttl: int = 3600):
        try:
            await self.redis.setex(key, ttl, str(value))
        except Exception as e:
            logger.error("Cache set error", key=key, error=str(e))

class AISuggestionService:
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def generate_suggestions(
        self,
        industry: str,
        keywords: List[str],
        limit: int = 10
    ) -> List[str]:
        try:
            keywords_str = ", ".join(keywords) if keywords else "general business"

            prompt = f"""Generate {limit} creative and memorable domain name suggestions for a {industry} business.
Keywords/themes: {keywords_str}

Requirements:
- Suggest only the domain names without .com extension
- Make them unique, brandable, and easy to remember
- Avoid hyphens when possible
- Consider industry relevance
- Return as a JSON array of strings

Example format: ["DomainName1", "DomainName2", "DomainName3"]"""

            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
                temperature=0.8
            )

            content = response.choices[0].message.content
            if not content:
                return []

            # Parse JSON response
            try:
                import json
                suggestions = json.loads(content.strip())
                if isinstance(suggestions, list):
                    return [s.strip() for s in suggestions if s.strip()][:limit]
            except json.JSONDecodeError:
                # Fallback: extract from text
                lines = content.strip().split('\n')
                suggestions = []
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith('[') and not line.startswith(']'):
                        # Remove quotes and commas
                        clean = line.strip('",[]')
                        if clean and len(clean) > 2:
                            suggestions.append(clean)
                return suggestions[:limit]

            return []

        except Exception as e:
            logger.error("AI suggestion error", industry=industry, error=str(e))
            return []

class DomainAvailabilityService:
    async def check_availability(self, domain: str, tld: str = "com") -> bool:
        """Check if a domain is available using WHOIS"""
        try:
            full_domain = f"{domain}.{tld}"
            w = whois.whois(full_domain)

            # If domain_name is None or empty, domain is likely available
            return not w.domain_name or len(str(w.domain_name)) == 0

        except Exception as e:
            logger.warning("WHOIS check failed", domain=domain, tld=tld, error=str(e))
            # If WHOIS fails, assume available (better UX)
            return True

class DomainSuggestionService:
    def __init__(self):
        self.cache = CacheService(settings.redis_url)
        self.ai = AISuggestionService(settings.openai_api_key) if settings.openai_api_key else None
        self.availability = DomainAvailabilityService()

    async def suggest_domains(self, request: DomainSuggestionRequest) -> DomainSuggestionsResponse:
        import time
        start_time = time.time()

        # Create cache key
        cache_key = f"domains:{request.industry}:{','.join(sorted(request.keywords))}:{request.limit}"

        # Check cache
        cached = await self.cache.get(cache_key)
        if cached:
            return DomainSuggestionsResponse(
                suggestions=[DomainSuggestion(**s) for s in cached],
                industry=request.industry,
                keywords=request.keywords,
                processing_time=time.time() - start_time,
                source="cache"
            )

        # Generate suggestions
        if not self.ai:
            raise HTTPException(status_code=503, detail="AI service unavailable")

        domain_names = await self.ai.generate_suggestions(
            request.industry,
            request.keywords,
            request.limit
        )

        if not domain_names:
            raise HTTPException(status_code=500, detail="Failed to generate suggestions")

        # Check availability if requested
        suggestions = []
        for name in domain_names:
            available = None
            if request.check_availability:
                available = await self.availability.check_availability(name)

            suggestions.append(DomainSuggestion(
                name=name,
                available=available,
                tld="com"
            ))

        # Cache results
        cache_data = [s.dict() for s in suggestions]
        await self.cache.set(cache_key, cache_data)

        return DomainSuggestionsResponse(
            suggestions=suggestions,
            industry=request.industry,
            keywords=request.keywords,
            processing_time=time.time() - start_time,
            source="ai"
        )

# FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Domain Suggestions service")
    yield
    # Shutdown
    logger.info("Shutting down Domain Suggestions service")

app = FastAPI(
    title="Domain Suggestions API",
    description="AI-powered domain name suggestions for business ideas",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting (simple in-memory implementation)
request_counts: Dict[str, List[float]] = {}

def check_rate_limit(client_ip: str) -> bool:
    import time
    now = time.time()
    window_start = now - settings.rate_limit_window

    if client_ip not in request_counts:
        request_counts[client_ip] = []

    # Remove old requests
    request_counts[client_ip] = [
        t for t in request_counts[client_ip] if t > window_start
    ]

    if len(request_counts[client_ip]) >= settings.rate_limit_requests:
        return False

    request_counts[client_ip].append(now)
    return True

# Dependency injection
suggestion_service = DomainSuggestionService()

# Routes
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "domain-suggestions"}

@app.post("/api/suggest", response_model=DomainSuggestionsResponse)
async def suggest_domains(
    request: DomainSuggestionRequest,
    client_ip: str = "unknown"
):
    # Rate limiting
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    try:
        return await suggestion_service.suggest_domains(request)
    except Exception as e:
        logger.error("API error", error=str(e), request=request.dict())
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/suggest")
async def suggest_domains_get(
    industry: str = Query(..., description="Business industry/sector"),
    keywords: List[str] = Query(default_factory=list, description="Keywords describing the business"),
    limit: int = Query(default=10, ge=1, le=20, description="Number of suggestions"),
    check_availability: bool = Query(default=True, description="Check domain availability"),
    client_ip: str = "unknown"
):
    # Rate limiting
    if not check_rate_limit(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded")

    request = DomainSuggestionRequest(
        industry=industry,
        keywords=keywords,
        limit=limit,
        check_availability=check_availability
    )

    try:
        return await suggestion_service.suggest_domains(request)
    except Exception as e:
        logger.error("API error", error=str(e), request=request.dict())
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=True,
        log_level="info"
    )