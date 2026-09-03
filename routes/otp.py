from flask import Blueprint, request, jsonify, session, current_app
from models.otp import OTPModel
from models.student import StudentModel
from models.professor import ProfessorModel
from utils.otp_service import OTPService

otp_bp = Blueprint('otp', __name__)

@otp_bp.route('/api/otp/request', methods=['POST'])
def request_otp():
    """
    Unified API to request an OTP for either Registration or Password Reset.
    """
    data = request.get_json() or request.form
    email = data.get('email', '').strip().lower()
    purpose = data.get('purpose', 'registration') # 'registration' or 'password_reset'
    role = data.get('role', 'student')
    recipient_name = data.get('name', 'User').strip()
    identifier = data.get('identifier', '').strip()

    if not email or '@' not in email:
        return jsonify({"success": False, "error": "A valid email address is required."}), 400

    expiry_minutes = current_app.config.get('OTP_EXPIRY_MINUTES', 5)

    if purpose == 'registration':
        # Check duplicate
        if role == 'student':
            if StudentModel.get_by_enrollment(identifier):
                return jsonify({"success": False, "error": "This Enrollment Number is already registered."}), 400
            if StudentModel.get_by_email(email):
                return jsonify({"success": False, "error": "This email is already registered. Please login or use Forgot Password."}), 400
        else:
            if ProfessorModel.get_by_prof_id(identifier):
                return jsonify({"success": False, "error": "This Professor ID is already registered."}), 400
            if ProfessorModel.get_by_email(email):
                return jsonify({"success": False, "error": "This email is already registered. Please login or use Forgot Password."}), 400

        result = OTPModel.create_and_send_registration_otp(
            email=email,
            full_name=recipient_name,
            role=role,
            identifier=identifier,
            password_hash=data.get('password_hash', ''),
            extra_data=data.get('extra_data', {}),
            expiry_minutes=expiry_minutes,
            custom_otp=data.get('otp')
        )
    else:
        # Password Reset - check user exists
        user = None
        if role == 'student':
            user = StudentModel.get_by_enrollment(identifier) or StudentModel.get_by_email(email)
        else:
            user = ProfessorModel.get_by_prof_id(identifier) or ProfessorModel.get_by_email(email)

        if not user:
            return jsonify({"success": False, "error": f"No registered {role} account found matching this email."}), 404

        recipient_name = user.get('name') or user.get('full_name', recipient_name)
        identifier = user.get('enrollment_no') or user.get('professor_id', identifier)
        email = user.get('email', email)

        result = OTPModel.create_and_send_password_reset_otp(
            email=email,
            recipient_name=recipient_name,
            role=role,
            identifier=identifier,
            expiry_minutes=expiry_minutes,
            custom_otp=data.get('otp')
        )

    if not result.get("success"):
        return jsonify({
            "success": False, 
            "error": result.get("error", "Unable to send verification email. Please try again later.")
        }), 400

    return jsonify({
        "success": True,
        "message": f"Verification OTP sent to {OTPService.mask_email(email)}. Valid for {expiry_minutes} minutes.",
        "email": email,
        "masked_email": OTPService.mask_email(email),
        "expires_in_minutes": expiry_minutes
    })

@otp_bp.route('/api/otp/verify', methods=['POST'])
def verify_otp_endpoint():
    """
    Unified API to verify OTP code.
    """
    data = request.get_json() or request.form
    email = data.get('email', '').strip().lower()
    purpose = data.get('purpose', 'registration')
    otp_code = data.get('otp', '').strip()

    if not email or not otp_code:
        return jsonify({"success": False, "error": "Email and 6-digit OTP code are required."}), 400

    is_valid, msg, temp_data = OTPModel.verify_otp(email=email, purpose=purpose, user_otp=otp_code)
    if is_valid:
        return jsonify({
            "success": True,
            "message": msg,
            "temp_data": temp_data
        })
    else:
        return jsonify({"success": False, "error": msg}), 400

@otp_bp.route('/api/smtp/diagnostics', methods=['GET', 'POST'])
@otp_bp.route('/api/otp/diagnostics', methods=['GET', 'POST'])
def smtp_diagnostics_endpoint():
    """
    Diagnostic endpoint that tests Gmail SMTP connection and credentials
    without exposing sensitive passwords or unmasked information.
    """
    import socket
    import smtplib
    import ssl
    import time

    smtp_server = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    smtp_port = int(os.environ.get('MAIL_PORT', 587))
    raw_user = os.environ.get('MAIL_USERNAME', '')
    raw_pass = os.environ.get('MAIL_PASSWORD', '')
    sender = os.environ.get('MAIL_DEFAULT_SENDER', raw_user)
    use_tls = os.environ.get('MAIL_USE_TLS', 'True').lower() in ('true', '1', 't')
    use_ssl = os.environ.get('MAIL_USE_SSL', 'False').lower() in ('true', '1', 't') or smtp_port == 465

    masked_user = OTPService.mask_email(raw_user) if raw_user else "Not configured"
    masked_sender = OTPService.mask_email(sender) if sender else "Not configured"

    password_set = bool(raw_pass.strip())
    sanitized_pass = raw_pass.strip().replace(' ', '')
    password_len = len(sanitized_pass) if password_set else 0
    has_whitespace = ' ' in raw_pass
    is_placeholder = 'your_' in raw_pass.lower() or 'password_here' in raw_pass.lower()

    recommendations = []
    env_check = {
        "server": smtp_server,
        "port": smtp_port,
        "encryption": "SSL (Port 465)" if use_ssl else "STARTTLS (Port 587)" if use_tls else "Plaintext",
        "usernameConfigured": bool(raw_user),
        "maskedUsername": masked_user,
        "senderConfigured": bool(sender),
        "maskedSender": masked_sender,
        "passwordConfigured": password_set and not is_placeholder,
        "passwordLength": password_len,
        "hasWhitespaceInPassword": has_whitespace,
        "isPlaceholderPassword": is_placeholder
    }

    if not password_set or is_placeholder:
        recommendations.append("MAIL_PASSWORD is not configured. Google requires a 16-character App Password.")
    elif password_len != 16:
        recommendations.append(f"Password length is {password_len} characters. Google App Passwords are strictly 16 characters. Standard Google account passwords will be rejected.")

    # 1. TCP Socket Test
    start_time = time.time()
    tcp_ok = False
    latency_ms = 0
    tcp_err = ""
    try:
        s = socket.create_connection((smtp_server, smtp_port), timeout=4)
        latency_ms = int((time.time() - start_time) * 1000)
        s.close()
        tcp_ok = True
    except Exception as exc:
        latency_ms = int((time.time() - start_time) * 1000)
        tcp_err = str(exc)

    if not tcp_ok:
        recommendations.append(f"Unable to reach {smtp_server}:{smtp_port} over TCP. Error: {tcp_err}")
        return jsonify({
            "success": False,
            "status": "NETWORK_UNREACHABLE",
            "summary": f"Network connection to {smtp_server}:{smtp_port} failed.",
            "diagnostics": {
                "environment": env_check,
                "network": {"reachable": False, "host": smtp_server, "port": smtp_port, "latencyMs": latency_ms, "error": tcp_err},
                "authentication": {"attempted": False, "verified": False, "reason": "Network unreachable"}
            },
            "recommendations": recommendations
        }), 400

    if not password_set or is_placeholder:
        return jsonify({
            "success": False,
            "status": "CONFIGURATION_INCOMPLETE",
            "summary": "Gmail SMTP network port is open and reachable, but MAIL_PASSWORD is missing or placeholder.",
            "diagnostics": {
                "environment": env_check,
                "network": {"reachable": True, "host": smtp_server, "port": smtp_port, "latencyMs": latency_ms},
                "authentication": {"attempted": False, "verified": False, "reason": "MAIL_PASSWORD missing"}
            },
            "recommendations": recommendations
        }), 400

    # 2. SMTP Handshake & Login Test
    try:
        if use_ssl:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_server, smtp_port, context=context, timeout=10) as server:
                server.login(raw_user, sanitized_pass)
        else:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                server.ehlo()
                if use_tls:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                    server.ehlo()
                server.login(raw_user, sanitized_pass)

        return jsonify({
            "success": True,
            "status": "AUTHENTICATED",
            "summary": f"Gmail SMTP connection and credentials verified successfully ({smtp_server}:{smtp_port}). Ready to deliver verification emails.",
            "diagnostics": {
                "environment": env_check,
                "network": {"reachable": True, "host": smtp_server, "port": smtp_port, "latencyMs": latency_ms},
                "authentication": {"attempted": True, "verified": True, "smtpCode": 250, "authenticatedUser": masked_user}
            },
            "recommendations": [
                "Gmail SMTP is healthy and authenticated.",
                "Verification emails will arrive directly in recipient Google Gmail inboxes."
            ]
        })
    except smtplib.SMTPAuthenticationError as auth_err:
        recommendations.extend([
            "Google rejected login credentials (535 BadCredentials). Please follow these steps:",
            "1. Enable 2-Step Verification on your Google Account (myaccount.google.com/security).",
            "2. Generate a 16-character App Password at https://myaccount.google.com/apppasswords.",
            "3. Set the 16-character code into MAIL_PASSWORD in Settings.",
            f"4. Verify that MAIL_USERNAME ({masked_user}) matches the Google account that created the App Password."
        ])
        return jsonify({
            "success": False,
            "status": "AUTHENTICATION_FAILED",
            "summary": "Google SMTP rejected login credentials (535 BadCredentials). Google requires a 16-character App Password.",
            "diagnostics": {
                "environment": env_check,
                "network": {"reachable": True, "host": smtp_server, "port": smtp_port, "latencyMs": latency_ms},
                "authentication": {
                    "attempted": True,
                    "verified": False,
                    "errorType": "BAD_CREDENTIALS",
                    "smtpCode": 535,
                    "details": "535 5.7.8 Username and Password not accepted"
                }
            },
            "recommendations": recommendations
        }), 401
    except Exception as other_err:
        return jsonify({
            "success": False,
            "status": "SMTP_ERROR",
            "summary": f"SMTP handshake error: {str(other_err)}",
            "diagnostics": {
                "environment": env_check,
                "network": {"reachable": True, "host": smtp_server, "port": smtp_port, "latencyMs": latency_ms},
                "authentication": {"attempted": True, "verified": False, "details": str(other_err)}
            },
            "recommendations": [f"Check SMTP server settings: {str(other_err)}"]
        }), 400

