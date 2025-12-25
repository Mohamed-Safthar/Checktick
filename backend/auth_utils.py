import hashlib
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def get_password_hash(password):
    # Pre-hash with SHA256 to allow passwords > 72 bytes
    hashed_sha256 = hashlib.sha256(password.encode()).hexdigest()
    return pwd_context.hash(hashed_sha256)

def verify_password(plain_password, hashed_password):
    # Pre-hash candidate with SHA256 before verifying
    hashed_sha256 = hashlib.sha256(plain_password.encode()).hexdigest()
    return pwd_context.verify(hashed_sha256, hashed_password)
