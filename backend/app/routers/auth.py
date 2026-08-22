from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import UserSignUp, UserLogin, TokenResponse, UserOut
from app.services.auth_service import register_user, authenticate_user, refresh_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/signup", response_model=dict, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserSignUp):
    return await register_user(user_data)

@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin):
    return await authenticate_user(login_data)

@router.post("/refresh", response_model=dict)
async def refresh(refresh_token: str):
    return await refresh_access_token(refresh_token)

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
