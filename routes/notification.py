from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from models.notification import NotificationModel

notification_bp = Blueprint('notification', __name__, url_prefix='/notification')

@notification_bp.route('/', methods=['GET', 'POST'])
def manage_notifications():
    if request.method == 'POST':
        title = request.form.get('title')
        description = request.form.get('description')
        priority = request.form.get('priority', 'Medium')
        target_role = request.form.get('target_role', 'All')
        
        NotificationModel.create(title, description, priority=priority, target_role=target_role)
        flash("Notification published!", "success")
        return redirect(url_for('notification.manage_notifications'))

    notifications = NotificationModel.get_all()
    return render_template('admin/crud_notifications.html', notifications=notifications)

@notification_bp.route('/delete/<notif_id>', methods=['POST'])
def delete_notification(notif_id):
    NotificationModel.delete(notif_id)
    flash("Notification deleted.", "info")
    return redirect(url_for('notification.manage_notifications'))
