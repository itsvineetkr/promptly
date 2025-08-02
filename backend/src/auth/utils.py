from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta

from src.database.mongo import db
from src.config import get_settings
from src.auth.models import User, TokenData


settings = get_settings()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_BASE_PATH}/token")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
users = db.users


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


async def authenticate_user(username: str, password: str) -> User | None:
    user = await find_by_username(username)
    if not user or not verify_password(password, user.hashed_password):
        return False

    return User(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        hashed_password=user.hashed_password,
        disabled=user.disabled,
    )


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now() + expires_delta
    else:
        expire = datetime.now() + timedelta(minutes=60)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credential_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credential_exception

        token_data = TokenData(username=username)
    except JWTError:
        raise credential_exception

    user = await find_by_username(username=token_data.username)

    if user is None:
        raise credential_exception

    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")

    return current_user


async def save_user(username, email, hashed_password, full_name, disabled=False):
    user_data = {
        "username": username,
        "email": email,
        "hashed_password": hashed_password,
        "full_name": full_name,
        "disabled": disabled,
    }
    result = await users.insert_one(user_data)
    return result.inserted_id


async def update_user(username:str, update_data: dict):
    result = await users.update_one({"username": username}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found or no changes made",
        )
    return result


async def find_by_username(username: str):
    user_data = await users.find_one({"username": username})
    if user_data:
        return User(
            id=str(user_data["_id"]),
            username=user_data["username"],
            email=user_data["email"],
            full_name=user_data.get("full_name", ""),
            hashed_password=user_data["hashed_password"],
            disabled=user_data.get("disabled", False),
        )
    return None


async def find_by_email(email: str):
    user_data = await users.find_one({"email": email})
    if user_data:
        return User(
            id=str(user_data["_id"]),
            username=user_data["username"],
            email=user_data["email"],
            full_name=user_data.get("full_name", ""),
            hashed_password=user_data["hashed_password"],
            disabled=user_data.get("disabled", False),
        )
    return None
