import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TimetableSlot, Student, Professor, Subject, Classroom, NotificationItem } from '../types';

export const generatePDFReport = (
  title: string,
  timetables: TimetableSlot[],
  subtitle: string = 'Department of Information Technology — SSEC Bhavnagar'
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  // Header background bar
  doc.setFillColor(13, 110, 253); // Royal Blue #0d6efd
  doc.rect(0, 0, 297, 24, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SHANTILAL SHAH ENGINEERING COLLEGE, BHAVNAGAR', 14, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 18);

  // Document Title
  doc.setTextColor(30, 41, 59); // dark #1e293b
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 32);

  // Generated metadata
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 297 - 14, 32, { align: 'right' });

  // Table Data
  const head = [['Day', 'Time Slot', 'Sem', 'Classroom', 'Subject Code & Name', 'Faculty / Professor', 'Room']];
  const body = timetables.map(t => [
    t.day,
    t.time_slot,
    `Sem ${t.semester}`,
    t.classroom,
    t.subject,
    t.professor,
    t.room_number
  ]);

  if (body.length === 0) {
    body.push(['-', '-', '-', '-', 'No timetable records available', '-', '-']);
  }

  // Generate Table using autoTable
  autoTable(doc, {
    startY: 38,
    head: head,
    body: body,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 94, 215],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [30, 41, 59],
      halign: 'center'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 40 },
      2: { cellWidth: 20 },
      3: { cellWidth: 35 },
      4: { cellWidth: 70, halign: 'left' },
      5: { cellWidth: 45, halign: 'left' },
      6: { cellWidth: 25 }
    },
    margin: { left: 14, right: 14 }
  });

  // Footer Signature Block
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 150;
  
  if (finalY + 25 < 200) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Prepared By: Timetable Committee', 14, finalY);
    doc.text('Approved By: Head of Department (HOD, IT)', 297 - 14, finalY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text('SSEC IT Department', 14, finalY + 5);
    doc.text('Shantilal Shah Engineering College', 297 - 14, finalY + 5, { align: 'right' });
  }

  // Save PDF
  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};

export interface MultiReportParams {
  title: string;
  semesterFilter?: number;
  sections: {
    timetable: boolean;
    students: boolean;
    professors: boolean;
    subjects: boolean;
    classrooms: boolean;
    notifications: boolean;
  };
  data: {
    timetables: TimetableSlot[];
    students: Student[];
    professors: Professor[];
    subjects: Subject[];
    classrooms: Classroom[];
    notifications: NotificationItem[];
  };
}

export const generateMultiSectionPDFReport = (params: MultiReportParams) => {
  const { title, semesterFilter, sections, data } = params;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Page dimensions
  const pageWidth = 210;

  // Header background bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SHANTILAL SHAH ENGINEERING COLLEGE, BHAVNAGAR', 12, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Department of Information Technology — Official Academic Report', 12, 18);
  doc.text(`Ref: SSEC/IT/RPT/${Date.now().toString().slice(-6)}`, pageWidth - 12, 18, { align: 'right' });

  // Document Title
  let currentY = 36;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title || 'Custom Department Multi-Section Report', 12, currentY);

  currentY += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const semText = semesterFilter && semesterFilter > 0 ? `Semester ${semesterFilter}` : 'All Semesters';
  doc.text(`Scope: ${semText} | Generated on: ${new Date().toLocaleString()}`, 12, currentY);

  currentY += 6;

  // Render Timetables section
  if (sections.timetable) {
    let slots = data.timetables;
    if (semesterFilter && semesterFilter > 0) {
      slots = slots.filter(s => s.semester === semesterFilter);
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(2, 132, 199); // sky-600
    doc.text(`1. Timetable Schedule (${slots.length} Slots)`, 12, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      head: [['Day & Time', 'Type', 'Sem', 'Subject', 'Professor', 'Room']],
      body: slots.map(s => [
        `${s.day}\n${s.time_slot}`,
        s.session_type || (s.subject.toLowerCase().includes('lab') ? 'Lab' : 'Theory'),
        `Sem ${s.semester}`,
        s.subject,
        s.professor,
        s.room_number
      ]),
      headStyles: { fillColor: [2, 132, 199], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: 12, right: 12 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Render Students section
  if (sections.students) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    let list = data.students;
    if (semesterFilter && semesterFilter > 0) {
      list = list.filter(s => s.semester === semesterFilter);
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(`2. Students Roster (${list.length} Students)`, 12, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      head: [['Enrollment No', 'Student Name', 'Sem', 'Classroom', 'Email']],
      body: list.map(s => [
        s.enrollment_no,
        s.full_name,
        `Sem ${s.semester}`,
        s.classroom || 'IT-LH-101',
        s.email
      ]),
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: 12, right: 12 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Render Professors section
  if (sections.professors) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    const list = data.professors;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(99, 102, 241); // indigo-600
    doc.text(`3. Faculty & Professors Directory (${list.length} Members)`, 12, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      head: [['Prof ID', 'Full Name', 'Designation', 'Department', 'Email']],
      body: list.map(p => [
        p.professor_id,
        p.full_name,
        p.designation,
        p.department,
        p.email
      ]),
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: 12, right: 12 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Render Subjects section
  if (sections.subjects) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    let list = data.subjects;
    if (semesterFilter && semesterFilter > 0) {
      list = list.filter(s => s.semester === semesterFilter);
    }
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 119, 6); // amber-600
    doc.text(`4. Course Subjects & Curriculum (${list.length} Subjects)`, 12, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      head: [['Subject Code', 'Subject Name', 'Sem', 'Type', 'Credits']],
      body: list.map(s => [
        s.code,
        s.name,
        `Sem ${s.semester}`,
        s.type,
        `${s.credits} Credits`
      ]),
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: 12, right: 12 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Render Classrooms section
  if (sections.classrooms) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    const list = data.classrooms;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(147, 51, 234); // purple-600
    doc.text(`5. Infrastructure & Classrooms (${list.length} Rooms)`, 12, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      head: [['Room No', 'Building Block', 'Type', 'Capacity', 'Current Status']],
      body: list.map(c => [
        c.room_number,
        c.building,
        c.type,
        `${c.capacity} Seats`,
        c.status
      ]),
      headStyles: { fillColor: [147, 51, 234], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: 12, right: 12 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Render Notifications section
  if (sections.notifications) {
    if (currentY > 240) { doc.addPage(); currentY = 20; }
    const list = data.notifications;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(225, 29, 72); // rose-600
    doc.text(`6. Live Department Notifications (${list.length} Announcements)`, 12, currentY);
    currentY += 3;

    autoTable(doc, {
      startY: currentY,
      head: [['Title', 'Priority', 'Target Audience', 'Publish Date', 'Status']],
      body: list.map(n => [
        n.title,
        n.priority,
        n.target_role,
        n.publish_date,
        n.status
      ]),
      headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      margin: { left: 12, right: 12 }
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Footer Signature Block
  if (currentY + 25 > 280) { doc.addPage(); currentY = 20; }
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Prepared By: SSEC IT Admin', 12, currentY + 10);
  doc.text('Approved By: Head of IT Department', pageWidth - 12, currentY + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Shantilal Shah Engineering College, Bhavnagar', 12, currentY + 15);
  doc.text('Official Seal & Verification', pageWidth - 12, currentY + 15, { align: 'right' });

  // Save PDF
  doc.save(`${(title || 'SSEC_Report').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};

