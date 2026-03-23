from pydantic import BaseModel


class User(BaseModel):
    id : str
    username: str
    email: str
    full_name: str
    hashed_password: str
    disabled: bool = False


class CreateUser(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    disabled: bool = False


class UpdateUser(BaseModel):
    username: str = None
    email: str = None
    full_name: str = None
    password: str = None
    disabled: bool = False


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: str | None = None


class UserInDB(BaseModel):
    hashed_password: str
