from typing import Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from app.core.security import decode_token
from app.db.mongodb import get_database

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

async def get_current_user(request: Request, header_token: Optional[str] = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = None
    
    # 1. Try Bearer header token
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    elif header_token:
        token = header_token
    
    # 2. Fallback to query parameter ?token=... (for direct browser downloads)
    if not token:
        token = request.query_params.get("token")
        
    if not token:
        raise credentials_exception
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception
    
    user_id = payload.get("sub")
    employee_id = payload.get("employee_id")
    role = payload.get("role")
    
    if not user_id or not employee_id:
        raise credentials_exception
    
    db = get_database()
    user = await db.users.find_one({"employee_id": employee_id})
    if not user:
        raise credentials_exception
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your administrator."
        )
    
    user["_id"] = str(user["_id"])
    return user

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required for this action."
        )
    return current_user

async def require_employee(current_user: dict = Depends(get_current_user)):
    # Both active employee and admin can access employee-level resources
    return current_user
