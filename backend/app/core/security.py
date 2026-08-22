"""Security utilities (placeholder for future authentication)."""

# Future: JWT token handling, API key validation, etc.
# For MVP, all endpoints are publicly accessible.

async def get_current_user():
    """Placeholder for future authentication dependency."""
    return {"id": "demo-user", "name": "Demo Operator", "role": "admin"}
