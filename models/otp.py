import datetime
from database.db import get_db
from utils.otp_service import OTPService
from utils.email_service import send_registration_otp, send_password_reset_otp

class OTPModel:
    COLLECTION_NAME = "otp_verifications"

    @staticmethod
    def create_and_send_registration_otp(
        email: str, 
        full_name: str, 
        role: str, 
        identifier: str, 
        password_hash: str,
        extra_data: dict = None,
        expiry_minutes: int = 5,
        custom_otp: str = None
    ) -> dict:
        """
        Stores pending registration data temporarily alongside the hashed 6-digit OTP.
        Permanent account in MongoDB is NOT created until verified.
        """
        db = get_db()
        email_clean = email.strip().lower()
        now = datetime.datetime.utcnow()

        # Rate Limiting: Prevent OTP spamming if requested within 60 seconds
        recent = db[OTPModel.COLLECTION_NAME].find_one({
            "email": email_clean,
            "purpose": "registration"
        })
        if recent and recent.get("created_at"):
            delta = (now - recent["created_at"]).total_seconds()
            if delta < 60:
                remaining = max(1, int(60 - delta))
                return {
                    "success": False,
                    "error": f"Please wait {remaining} seconds before requesting a new OTP."
                }

        otp_plain = (custom_otp.strip() if custom_otp and len(custom_otp.strip()) == 6 and custom_otp.strip().isdigit() else None) or OTPService.generate_numeric_otp(6)
        otp_hashed = OTPService.hash_otp(otp_plain)
        expires_at = now + datetime.timedelta(minutes=expiry_minutes)

        # Invalidate any prior unused OTPs for this email and registration
        db[OTPModel.COLLECTION_NAME].delete_many({
            "email": email_clean,
            "purpose": "registration"
        })

        temp_data = {
            "full_name": full_name,
            "role": role,
            "identifier": identifier,
            "password_hash": password_hash,
            **(extra_data or {})
        }

        otp_doc = {
            "email": email_clean,
            "otp_hash": otp_hashed,
            "purpose": "registration",
            "expires_at": expires_at,
            "attempts": 0,
            "created_at": now,
            "temp_data": temp_data
        }

        db[OTPModel.COLLECTION_NAME].insert_one(otp_doc)

        # Dispatch Email via real Gmail SMTP
        dispatch_result = send_registration_otp(
            email=email_clean,
            otp=otp_plain,
            recipient_name=full_name,
            expiry_minutes=expiry_minutes
        )

        if not dispatch_result.get("success", False):
            # Clean up pending record on failure
            db[OTPModel.COLLECTION_NAME].delete_many({
                "email": email_clean,
                "purpose": "registration"
            })
            return {
                "success": False,
                "error": "Unable to send verification email. Please try again later."
            }

        return {
            "success": True,
            "email": email_clean,
            "expires_at": expires_at.isoformat(),
            "expires_in_minutes": expiry_minutes,
            "masked_email": OTPService.mask_email(email_clean)
        }

    @staticmethod
    def create_and_send_password_reset_otp(
        email: str,
        recipient_name: str,
        role: str,
        identifier: str,
        expiry_minutes: int = 5,
        custom_otp: str = None
    ) -> dict:
        """
        Generates and stores a hashed 6-digit OTP for password recovery.
        """
        db = get_db()
        email_clean = email.strip().lower()
        now = datetime.datetime.utcnow()

        # Rate Limiting: Prevent OTP spamming if requested within 60 seconds
        recent = db[OTPModel.COLLECTION_NAME].find_one({
            "email": email_clean,
            "purpose": "password_reset"
        })
        if recent and recent.get("created_at"):
            delta = (now - recent["created_at"]).total_seconds()
            if delta < 60:
                remaining = max(1, int(60 - delta))
                return {
                    "success": False,
                    "error": f"Please wait {remaining} seconds before requesting a new OTP."
                }

        otp_plain = (custom_otp.strip() if custom_otp and len(custom_otp.strip()) == 6 and custom_otp.strip().isdigit() else None) or OTPService.generate_numeric_otp(6)
        otp_hashed = OTPService.hash_otp(otp_plain)
        expires_at = now + datetime.timedelta(minutes=expiry_minutes)

        # Invalidate prior reset OTPs
        db[OTPModel.COLLECTION_NAME].delete_many({
            "email": email_clean,
            "purpose": "password_reset"
        })

        otp_doc = {
            "email": email_clean,
            "otp_hash": otp_hashed,
            "purpose": "password_reset",
            "expires_at": expires_at,
            "attempts": 0,
            "created_at": now,
            "temp_data": {
                "name": recipient_name,
                "role": role,
                "identifier": identifier
            }
        }

        db[OTPModel.COLLECTION_NAME].insert_one(otp_doc)

        # Dispatch Email via real Gmail SMTP
        dispatch_result = send_password_reset_otp(
            email=email_clean,
            otp=otp_plain,
            recipient_name=recipient_name,
            expiry_minutes=expiry_minutes
        )

        if not dispatch_result.get("success", False):
            # Clean up pending record on failure
            db[OTPModel.COLLECTION_NAME].delete_many({
                "email": email_clean,
                "purpose": "password_reset"
            })
            return {
                "success": False,
                "error": "Unable to send verification email. Please try again later."
            }

        return {
            "success": True,
            "email": email_clean,
            "expires_at": expires_at.isoformat(),
            "expires_in_minutes": expiry_minutes,
            "masked_email": OTPService.mask_email(email_clean)
        }

    @staticmethod
    def verify_otp(email: str, purpose: str, user_otp: str) -> tuple[bool, str, dict]:
        """
        Validates user OTP against stored hashed OTP.
        Enforces maximum 5 attempts and 5-minute expiration.
        Returns (is_valid, message, temp_data).
        """
        db = get_db()
        email_clean = email.strip().lower()
        otp_clean = user_otp.strip()

        record = db[OTPModel.COLLECTION_NAME].find_one({
            "email": email_clean,
            "purpose": purpose
        })

        if not record:
            return False, "No active OTP request found. Please request a new OTP.", {}

        # 1. Check max attempts (5 maximum)
        if record.get("attempts", 0) >= 5:
            db[OTPModel.COLLECTION_NAME].delete_one({"_id": record["_id"]})
            return False, "Too many failed attempts. This OTP has expired. Please request a new OTP.", {}

        # 2. Check expiration (5 minutes)
        now = datetime.datetime.utcnow()
        if now > record.get("expires_at", now):
            db[OTPModel.COLLECTION_NAME].delete_one({"_id": record["_id"]})
            return False, "OTP expired. Please request a new OTP.", {}

        # 3. Verify Werkzeug hashed OTP
        stored_hash = record.get("otp_hash", "")
        if not OTPService.verify_otp_hash(stored_hash, otp_clean):
            db[OTPModel.COLLECTION_NAME].update_one(
                {"_id": record["_id"]},
                {"$inc": {"attempts": 1}}
            )
            attempts_done = record.get("attempts", 0) + 1
            remaining = max(0, 5 - attempts_done)
            if remaining == 0:
                db[OTPModel.COLLECTION_NAME].delete_one({"_id": record["_id"]})
                return False, "Too many failed attempts. OTP expired. Please request a new OTP.", {}
            return False, "Invalid OTP. Please try again.", {}

        # 4. Valid OTP: remove temporary OTP record upon success
        temp_data = record.get("temp_data", {})
        db[OTPModel.COLLECTION_NAME].delete_one({"_id": record["_id"]})
        return True, "Email verified successfully.", temp_data
