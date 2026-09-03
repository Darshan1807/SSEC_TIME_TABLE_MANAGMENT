from flask import Blueprint, render_template, request, redirect, url_for, flash, session, current_app, jsonify
from werkzeug.security import generate_password_hash
from models.student import StudentModel
from models.professor import ProfessorModel
from models.otp import OTPModel
from utils.otp_service import OTPService

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    """
    Step 1: Registration Form submission and duplicate checks.
    Generates 6-digit OTP, sends email, and redirects to /verify-otp without creating DB user yet.
    """
    if request.method == 'POST':
        role = request.form.get('role', 'student').strip().lower()
        full_name = request.form.get('full_name', '').strip()
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')

        # Basic validations
        if not full_name or not email or not password:
            flash("All required fields must be filled.", "danger")
            return render_template('auth/register.html', role=role, full_name=full_name, email=email)

        if password != confirm_password:
            flash("Passwords do not match! Please verify your password.", "danger")
            return render_template('auth/register.html', role=role, full_name=full_name, email=email)

        if len(password) < 4:
            flash("Password must be at least 4 characters long.", "danger")
            return render_template('auth/register.html', role=role, full_name=full_name, email=email)

        # Check Duplicates according to role
        identifier = ""
        extra_data = {}

        if role == 'student':
            enrollment_no = request.form.get('enrollment_no', '').strip()
            if not enrollment_no:
                flash("Enrollment Number is required for Student registration.", "danger")
                return render_template('auth/register.html', role=role, full_name=full_name, email=email)

            if StudentModel.get_by_enrollment(enrollment_no):
                flash("This Enrollment Number is already registered.", "danger")
                return render_template('auth/register.html', role=role, full_name=full_name, email=email)

            if StudentModel.get_by_email(email):
                flash("This email is already registered. Please login or use Forgot Password.", "danger")
                return render_template('auth/register.html', role=role, full_name=full_name, email=email)

            identifier = enrollment_no
            extra_data = {
                "semester": int(request.form.get('semester', 6)),
                "classroom": request.form.get('classroom', 'IT-LH-101'),
                "phone": request.form.get('phone', '+91 9800000000')
            }
        else:
            professor_id = request.form.get('professor_id', '').strip()
            if not professor_id:
                flash("Professor ID is required for Faculty registration.", "danger")
                return render_template('auth/register.html', role=role, full_name=full_name, email=email)

            if ProfessorModel.get_by_prof_id(professor_id):
                flash("This Professor ID is already registered.", "danger")
                return render_template('auth/register.html', role=role, full_name=full_name, email=email)

            if ProfessorModel.get_by_email(email):
                flash("This email is already registered. Please login or use Forgot Password.", "danger")
                return render_template('auth/register.html', role=role, full_name=full_name, email=email)

            identifier = professor_id
            extra_data = {
                "department": request.form.get('department', 'Information Technology'),
                "designation": request.form.get('designation', 'Assistant Professor'),
                "phone": request.form.get('phone', '+91 9825000000')
            }

        # Hash password for temporary storage
        password_hash = generate_password_hash(password)

        # Generate & Send 6-Digit OTP (User document is NOT created yet in MongoDB)
        expiry_minutes = current_app.config.get('OTP_EXPIRY_MINUTES', 5)
        res = OTPModel.create_and_send_registration_otp(
            email=email,
            full_name=full_name,
            role=role,
            identifier=identifier,
            password_hash=password_hash,
            extra_data=extra_data,
            expiry_minutes=expiry_minutes
        )

        if not res.get('success'):
            flash(res.get('error', 'Unable to send verification email. Please try again later.'), 'danger')
            return render_template('auth/register.html')

        # Store pending verification state in session
        session['pending_reg_email'] = email
        session['pending_reg_role'] = role
        session['pending_reg_name'] = full_name
        session['pending_reg_identifier'] = identifier

        flash(f"We sent a 6-digit OTP to {OTPService.mask_email(email)}. Please enter it below to verify your email.", "info")
        return redirect(url_for('auth.verify_otp'))

    return render_template('auth/register.html')

@auth_bp.route('/verify-otp', methods=['GET', 'POST'])
def verify_otp():
    """
    Step 2: Dedicated OTP Verification Page.
    Verifies 6-digit numeric OTP, then creates permanent MongoDB student/professor document.
    """
    email = session.get('pending_reg_email')
    if not email:
        flash("No active registration session found. Please fill out the registration form.", "warning")
        return redirect(url_for('auth.register'))

    masked_email = OTPService.mask_email(email)

    if request.method == 'POST':
        otp_input = request.form.get('otp', '').strip()
        if not otp_input:
            flash("Please enter the 6-digit OTP sent to your email.", "danger")
            return render_template('auth/verify_otp.html', email=email, masked_email=masked_email)

        # Verify OTP against MongoDB hashed record
        is_valid, msg, temp_data = OTPModel.verify_otp(email=email, purpose="registration", user_otp=otp_input)
        if not is_valid:
            flash(msg, "danger")
            return render_template('auth/verify_otp.html', email=email, masked_email=masked_email)

        # OTP Verified! Create permanent account in MongoDB
        role = temp_data.get('role', 'student')
        full_name = temp_data.get('full_name', '')
        identifier = temp_data.get('identifier', '')
        password_hash = temp_data.get('password_hash', '')

        if role == 'student':
            student, create_msg = StudentModel.create_student(
                name=full_name,
                enrollment_no=identifier,
                password_hash=password_hash,
                email=email,
                semester=temp_data.get('semester', 6),
                classroom=temp_data.get('classroom', 'IT-LH-101'),
                phone=temp_data.get('phone', '')
            )
            if not student:
                flash(create_msg, "danger")
                return redirect(url_for('auth.register'))
        else:
            prof, create_msg = ProfessorModel.create_professor(
                name=full_name,
                professor_id=identifier,
                password_hash=password_hash,
                email=email,
                department=temp_data.get('department', 'Information Technology'),
                designation=temp_data.get('designation', 'Assistant Professor'),
                phone=temp_data.get('phone', '')
            )
            if not prof:
                flash(create_msg, "danger")
                return redirect(url_for('auth.register'))

        # Clear pending registration session
        session.pop('pending_reg_email', None)
        session.pop('pending_reg_role', None)
        session.pop('pending_reg_name', None)
        session.pop('pending_reg_identifier', None)

        flash("Email Verified Successfully! Your account has been created successfully. Please login.", "success")
        return redirect(url_for('auth.login'))

    return render_template('auth/verify_otp.html', email=email, masked_email=masked_email)

@auth_bp.route('/resend-registration-otp', methods=['POST'])
@auth_bp.route('/resend-otp', methods=['POST'])
def resend_registration_otp():
    """Resends a fresh 6-digit OTP to the pending email."""
    email = session.get('pending_reg_email') or request.form.get('email', '').strip().lower()
    if not email:
        flash("No active registration found. Please register first.", "danger")
        return redirect(url_for('auth.register'))

    full_name = session.get('pending_reg_name', 'Student')
    role = session.get('pending_reg_role', 'student')
    identifier = session.get('pending_reg_identifier', '')

    expiry_minutes = current_app.config.get('OTP_EXPIRY_MINUTES', 5)
    OTPModel.create_and_send_registration_otp(
        email=email,
        full_name=full_name,
        role=role,
        identifier=identifier,
        password_hash="",
        expiry_minutes=expiry_minutes
    )

    flash(f"A new verification OTP has been sent to {OTPService.mask_email(email)}.", "info")
    return redirect(url_for('auth.verify_otp'))

# ==============================================================================
# FORGOT PASSWORD & RECOVERY FLOW
# ==============================================================================

@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    """
    Step 1: User enters registered email. System validates and sends OTP.
    """
    if request.method == 'POST':
        email_or_id = request.form.get('email', '').strip().lower()
        role = request.form.get('role', 'student').strip().lower()

        if not email_or_id:
            flash("Please enter your registered email address.", "danger")
            return render_template('auth/forgot_password.html')

        # Find user in Student or Professor DB
        user = None
        user_role = role
        user_email = ""
        user_name = ""
        user_id = ""

        if role == 'student':
            user = StudentModel.get_by_email(email_or_id) or StudentModel.get_by_enrollment(email_or_id)
            if user:
                user_email = user.get('email')
                user_name = user.get('name') or user.get('full_name', 'Student')
                user_id = user.get('enrollment_no')
        elif role == 'professor':
            user = ProfessorModel.get_by_email(email_or_id) or ProfessorModel.get_by_prof_id(email_or_id)
            if user:
                user_email = user.get('email')
                user_name = user.get('name') or user.get('full_name', 'Professor')
                user_id = user.get('professor_id')
        else:
            # Check both
            user = StudentModel.get_by_email(email_or_id) or StudentModel.get_by_enrollment(email_or_id)
            if user:
                user_role = 'student'
                user_email = user.get('email')
                user_name = user.get('name') or user.get('full_name', 'Student')
                user_id = user.get('enrollment_no')
            else:
                user = ProfessorModel.get_by_email(email_or_id) or ProfessorModel.get_by_prof_id(email_or_id)
                if user:
                    user_role = 'professor'
                    user_email = user.get('email')
                    user_name = user.get('name') or user.get('full_name', 'Professor')
                    user_id = user.get('professor_id')

        if not user:
            flash("No registered account found with that email. Please check and try again.", "danger")
            return render_template('auth/forgot_password.html')

        # Send Reset OTP
        expiry_minutes = current_app.config.get('OTP_EXPIRY_MINUTES', 5)
        res = OTPModel.create_and_send_password_reset_otp(
            email=user_email,
            recipient_name=user_name,
            role=user_role,
            identifier=user_id,
            expiry_minutes=expiry_minutes
        )

        if not res.get('success'):
            flash(res.get('error', 'Unable to send verification email. Please try again later.'), 'danger')
            return render_template('auth/forgot_password.html')

        session['reset_email'] = user_email
        session['reset_role'] = user_role
        session['reset_name'] = user_name

        flash(f"We sent a password reset OTP to {OTPService.mask_email(user_email)}.", "info")
        return redirect(url_for('auth.verify_reset_otp'))

    return render_template('auth/forgot_password.html')

@auth_bp.route('/reset-password/verify-otp', methods=['GET', 'POST'])
def verify_reset_otp():
    """
    Step 2: User enters password reset OTP.
    """
    email = session.get('reset_email')
    if not email:
        flash("Please enter your registered email address first.", "warning")
        return redirect(url_for('auth.forgot_password'))

    masked_email = OTPService.mask_email(email)

    if request.method == 'POST':
        otp_input = request.form.get('otp', '').strip()
        if not otp_input:
            flash("Please enter the 6-digit OTP sent to your email.", "danger")
            return render_template('auth/verify_reset_otp.html', email=email, masked_email=masked_email)

        is_valid, msg, _ = OTPModel.verify_otp(email=email, purpose="password_reset", user_otp=otp_input)
        if not is_valid:
            flash(msg, "danger")
            return render_template('auth/verify_reset_otp.html', email=email, masked_email=masked_email)

        session['reset_otp_verified'] = True
        return redirect(url_for('auth.reset_password'))

    return render_template('auth/verify_reset_otp.html', email=email, masked_email=masked_email)

@auth_bp.route('/resend-reset-otp', methods=['POST'])
def resend_reset_otp():
    """Resends Password Reset OTP."""
    email = session.get('reset_email')
    if not email:
        flash("Session expired. Please request a new OTP.", "danger")
        return redirect(url_for('auth.forgot_password'))

    name = session.get('reset_name', 'User')
    role = session.get('reset_role', 'student')
    expiry_minutes = current_app.config.get('OTP_EXPIRY_MINUTES', 5)

    OTPModel.create_and_send_password_reset_otp(
        email=email,
        recipient_name=name,
        role=role,
        identifier="",
        expiry_minutes=expiry_minutes
    )

    flash(f"A new password reset OTP has been sent to {OTPService.mask_email(email)}.", "info")
    return redirect(url_for('auth.verify_reset_otp'))

@auth_bp.route('/reset-password', methods=['GET', 'POST'])
def reset_password():
    """
    Step 3: User creates a new password after OTP verification.
    """
    email = session.get('reset_email')
    verified = session.get('reset_otp_verified')

    if not email or not verified:
        flash("Unauthorized password reset attempt. Please complete OTP verification.", "danger")
        return redirect(url_for('auth.forgot_password'))

    if request.method == 'POST':
        new_password = request.form.get('new_password', '')
        confirm_password = request.form.get('confirm_password', '')

        if not new_password:
            flash("New password cannot be empty.", "danger")
            return render_template('auth/reset_password.html')

        if new_password != confirm_password:
            flash("New passwords do not match!", "danger")
            return render_template('auth/reset_password.html')

        if len(new_password) < 4:
            flash("Password must be at least 4 characters long.", "danger")
            return render_template('auth/reset_password.html')

        role = session.get('reset_role', 'student')
        if role == 'student':
            updated = StudentModel.update_password(email, new_password)
        else:
            updated = ProfessorModel.update_password(email, new_password)

        if updated:
            session.pop('reset_email', None)
            session.pop('reset_role', None)
            session.pop('reset_name', None)
            session.pop('reset_otp_verified', None)

            flash("Password Reset Successfully! You can now login using your new password.", "success")
            return redirect(url_for('auth.login'))
        else:
            flash("Failed to update password. Account not found.", "danger")

    return render_template('auth/reset_password.html')

# ==============================================================================
# LOGIN & LOGOUT
# ==============================================================================

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        role = request.form.get('role', 'student').strip().lower()
        password = request.form.get('password', '')

        if role == 'admin':
            username = request.form.get('username', '').strip()
            admin_user = current_app.config['ADMIN_USERNAME']
            admin_pass = current_app.config['ADMIN_PASSWORD']
            
            if username == admin_user and password == admin_pass:
                session['user_id'] = 'ADMIN'
                session['user_name'] = 'SSEC IT Administrator'
                session['role'] = 'admin'
                flash("Welcome Admin!", "success")
                return redirect(url_for('admin.dashboard'))
            else:
                flash("Invalid Admin Credentials!", "danger")

        elif role == 'student':
            enrollment_no = request.form.get('enrollment_no', '').strip()
            student = StudentModel.get_by_enrollment(enrollment_no) or StudentModel.get_by_email(enrollment_no)
            if student and StudentModel.verify_password(student['password'], password):
                session['user_id'] = student['enrollment_no']
                session['user_name'] = student.get('name') or student.get('full_name')
                session['role'] = 'student'
                session['semester'] = student.get('semester', 6)
                session['classroom'] = student.get('classroom', 'IT-LH-101')
                flash(f"Welcome back, {session['user_name']}!", "success")
                return redirect(url_for('student.dashboard'))
            else:
                flash("Invalid Enrollment Number or Password!", "danger")

        elif role == 'professor':
            professor_id = request.form.get('professor_id', '').strip()
            prof = ProfessorModel.get_by_prof_id(professor_id) or ProfessorModel.get_by_email(professor_id)
            if prof and ProfessorModel.verify_password(prof['password'], password):
                session['user_id'] = prof['professor_id']
                session['user_name'] = prof.get('name') or prof.get('full_name')
                session['role'] = 'professor'
                session['department'] = prof.get('department', 'Information Technology')
                flash(f"Welcome Professor {session['user_name']}!", "success")
                return redirect(url_for('professor.dashboard'))
            else:
                flash("Invalid Professor ID or Password!", "danger")

    return render_template('auth/login.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    flash("You have logged out successfully.", "info")
    return redirect(url_for('auth.login'))
