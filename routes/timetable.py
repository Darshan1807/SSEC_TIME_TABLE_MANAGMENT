from flask import Blueprint, render_template, request, redirect, url_for, flash, session, send_file
from models.timetable import TimetableModel
from models.subject import SubjectModel
from models.professor import ProfessorModel
from models.classroom import ClassroomModel
from utils.pdf_generator import generate_timetable_pdf
import io

timetable_bp = Blueprint('timetable', __name__, url_prefix='/timetable')

@timetable_bp.route('/', methods=['GET', 'POST'])
def manage_timetable():
    if request.method == 'POST':
        semester = request.form.get('semester')
        classroom = request.form.get('classroom')
        day = request.form.get('day')
        time_slot = request.form.get('time_slot')
        subject = request.form.get('subject')
        professor = request.form.get('professor')
        room_number = request.form.get('room_number')
        
        tt, msg = TimetableModel.create(semester, classroom, day, time_slot, subject, professor, room_number)
        if tt:
            flash(msg, "success")
        else:
            flash(msg, "danger")

    timetables = TimetableModel.get_all()
    subjects = SubjectModel.get_all()
    classrooms = ClassroomModel.get_all()
    return render_template('admin/crud_timetable.html', timetables=timetables, subjects=subjects, classrooms=classrooms)

@timetable_bp.route('/delete/<tt_id>', methods=['POST'])
def delete_timetable(tt_id):
    TimetableModel.delete(tt_id)
    flash("Timetable slot removed.", "info")
    return redirect(url_for('timetable.manage_timetable'))

@timetable_bp.route('/export-pdf')
def export_pdf():
    role = session.get('role', 'student')
    user_name = session.get('user_name', 'Student')
    
    if role == 'student':
        semester = session.get('semester', 1)
        classroom = session.get('classroom', 'IT-LH-101')
        timetables = TimetableModel.get_by_semester_and_classroom(semester, classroom)
        title = f"SSEC IT - Timetable (Sem {semester} | {classroom})"
    elif role == 'professor':
        timetables = TimetableModel.get_by_professor(user_name)
        title = f"SSEC IT - Teaching Schedule (Prof. {user_name})"
    else:
        timetables = TimetableModel.get_all()
        title = "SSEC IT - Master Department Timetable"

    pdf_buffer = generate_timetable_pdf(title, timetables)
    return send_file(
        io.BytesIO(pdf_buffer),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"SSEC_IT_Timetable_{role}.pdf"
    )
