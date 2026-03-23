from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime, timedelta

from src.config import get_settings
from src.auth.models import User, Token, CreateUser, UpdateUser
from src.auth.utils import save_user, update_user, find_by_username, find_by_email
from src.auth.validators import password_validator
from src.auth.utils import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_password_hash,
)


settings = get_settings()
router = APIRouter(responses={418: {"description": "Authentication Endpoints"}})


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Login endpoint to authenticate user and return access token."""
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/users/")
async def create_user_me(user: CreateUser):
    """Create a new user."""
    if not user.username or not user.email or not user.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username, email, and password are required",
        )
    if not password_validator(user.password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is weak. It must be at least 8 characters long, contain letters and numbers.",
        )

    existing_user = await find_by_username(user.username)

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists",
        )

    hashed_password = get_password_hash(user.password)

    user_id = await save_user(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        disabled=user.disabled,
    )

    return {"id": str(user_id), "username": user.username, "email": user.email}


@router.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get the current authenticated user's details."""
    return current_user


@router.put("/users/me/")
async def update_user_me(
    user_update: UpdateUser,
    current_user: User = Depends(get_current_active_user),
):
    """Update the current authenticated user's details."""
    update_data = {}

    if user_update.username:
        existing_user = await find_by_username(user_update.username)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already exists",
            )
        update_data["username"] = user_update.username

    if user_update.email:
        existing_user = await find_by_email(user_update.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already exists",
            )
        update_data["email"] = user_update.email

    if user_update.full_name:
        update_data["full_name"] = user_update.full_name

    if user_update.disabled is not None:
        update_data["disabled"] = user_update.disabled

    if user_update.password:
        if not password_validator(user_update.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is weak. It must be at least 8 characters long, contain letters and numbers.",
            )
        update_data["hashed_password"] = get_password_hash(user_update.password)

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields to update",
        )

    await update_user(current_user.username, update_data)

    return {
        "message": "User updated successfully",
        "updated_fields": list(update_data.keys()),
    }
