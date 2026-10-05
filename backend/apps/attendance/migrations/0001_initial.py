import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('academics', '0001_initial'),
        ('enrollment', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Attendance',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('date', models.DateField(help_text='Date of the attendance record')),
                ('status', models.CharField(choices=[('PRESENT', 'Present'), ('ABSENT', 'Absent'), ('LATE', 'Late'), ('EXCUSED', 'Excused')], default='PRESENT', max_length=10)),
                ('remarks', models.TextField(blank=True, default='', help_text='Optional teacher remarks for this attendance record')),
                ('recorded_by', models.ForeignKey(blank=True, help_text='Teacher or staff who recorded this attendance', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='attendance_recorded', to=settings.AUTH_USER_MODEL)),
                ('student', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendance_records', to='enrollment.studentprofile')),
                ('subject_assignment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='attendance_records', to='academics.subjectassignment')),
            ],
            options={
                'verbose_name': 'attendance',
                'verbose_name_plural': 'attendance records',
                'ordering': ['-date', 'student'],
                'unique_together': {('student', 'subject_assignment', 'date')},
            },
        ),
    ]
