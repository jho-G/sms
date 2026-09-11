import django.dispatch

# ---------------------------------------------------------------------------
# Custom signals for the attendance module
# ---------------------------------------------------------------------------

student_marked_absent = django.dispatch.Signal()
"""
Emitted whenever an Attendance record with status ABSENT is created.

Keyword arguments:
    sender    – The Attendance model class
    student_id – UUID of the StudentProfile that was marked absent
    date       – The date of the absence (datetime.date)
    subject    – Name of the subject from the linked SubjectAssignment
"""
