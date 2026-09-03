import secrets
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

class OTPService:
    @staticmethod
    def generate_numeric_otp(length: int = 6) -> str:
        """
        Generates a cryptographically secure random 6-digit numeric OTP using Python's secrets module.
        Example: '482913'
        """
        return f"{secrets.randbelow(1000000):06d}"

    @staticmethod
    def hash_otp(otp_plain: str) -> str:
        """
        Hashes the plaintext OTP using Werkzeug PBKDF2/SHA256 for secure database storage.
        Plaintext OTP is never stored in MongoDB.
        """
        return generate_password_hash(otp_plain.strip())

    @staticmethod
    def verify_otp_hash(stored_hash: str, otp_plain: str) -> bool:
        """
        Verifies user-submitted plaintext OTP against the stored Werkzeug hash.
        """
        if not stored_hash or not otp_plain:
            return False
        return check_password_hash(stored_hash, otp_plain.strip())

    @staticmethod
    def mask_email(email: str) -> str:
        """
        Masks email for secure UI display (e.g. 'darshanparmar1100@gmail.com' -> 'd********@gmail.com')
        """
        if not email or '@' not in email:
            return email
        parts = email.split('@')
        user_part = parts[0]
        domain_part = parts[1]
        
        if len(user_part) <= 2:
            masked_user = user_part[0] + "*" * 4
        else:
            masked_user = user_part[0] + "*" * (len(user_part) - 1)
            
        return f"{masked_user}@{domain_part}"

    @staticmethod
    def calculate_expiry(minutes: int = 5) -> datetime:
        """
        Calculates UTC expiration timestamp (default 5 minutes).
        """
        return datetime.utcnow() + timedelta(minutes=minutes)
