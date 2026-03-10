import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

# ---------------------------------------------------------------------------
# Configuration — sourced exclusively from environment variables
# ---------------------------------------------------------------------------
_JWT_SECRET: str = os.getenv("JWT_SECRET_KEY", "")
_JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

if not _JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET_KEY is not set. "
        "Add it to your .env file and restart the server."
    )

_bearer_scheme = HTTPBearer()


def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Security(_bearer_scheme),
) -> dict:

    """
    FastAPI dependency that validates an incoming Bearer JWT.

    Usage::

        @router.get("/protected")
        def protected_route(claims: dict = Depends(verify_jwt_token)):
            ...

    Raises:
        HTTPException 401 – if the token is missing, malformed, or has an
                            invalid signature / expired.

    Returns:
        The decoded JWT payload as a dict.
    """
    token: str = credentials.credentials
    try:
        payload: dict = jwt.decode(
            token,
            _JWT_SECRET,
            algorithms=[_JWT_ALGORITHM],
        )
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

