from django.db import models
from django.contrib.auth.models import AbstractUser

# myapp/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    USER_TYPES = (
        ('student', 'Student'),
        ('warden', 'Warden'),
        ('rector', 'Rector'),

        ('manager','Manager'),
        
    )

    CLASS_CHOICES = [
        ("fy", "First Year"),
        ("sy", "Second Year"),
        ("ty", "Third Year"),
        ("btech", "Final Year"),
    ]

    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='student')
    email = models.EmailField(unique=True)

    class_name = models.CharField(
        max_length=10,
        choices=CLASS_CHOICES,
        default='ty',
        null=True,
        blank=True,
        help_text="Only applicable for students",
    )

    def __str__(self):
        return f"{self.username} ({self.user_type})"

    def save(self, *args, **kwargs):
        # Ensure branch and class_name are only set for students
        if self.user_type != 'student':
            self.class_name = None
        else:
            if self.class_name and self.class_name not in dict(self.CLASS_CHOICES):
                raise ValueError(f"Invalid class_name: {self.class_name}")
        super().save(*args, **kwargs)

class Branch(models.Model):
    branch = models.CharField(max_length=100, unique=True, primary_key=True)
    def __str__(self):
        return self.branch

class AdmissionCategory(models.Model):
    admission_category = models.CharField(max_length=100, unique=True, primary_key=True)
    def __str__(self):
        return self.admission_category

class Caste(models.Model):
    caste = models.CharField(max_length=100, unique=True, primary_key=True)
    seat_matrix_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    def __str__(self):
        return self.caste

class StudentDataEntry(models.Model):
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'),
        ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'),
        ('O+', 'O+'), ('O-', 'O-'),
    ]
    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
    ]
    CLASS_CHOICES = [
        ("fy", "First Year"),
        ("sy", "Second Year"),
        ("ty", "Third Year"),
        ("btech", "Final Year"),
    ]
    ENTRANCE_EXAM_CHOICES = [
        ('jee_mains', 'JEE Mains'),
        ('mht_cet', 'MHT-CET'),
    ]

    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="data_entry", null=True)
    personal_mail = models.EmailField(unique=True)
    college_mail = models.EmailField(null=True, blank=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    mobile_number = models.CharField(max_length=15)
    class_name = models.CharField(max_length=10, choices=CLASS_CHOICES)
    branch = models.ForeignKey(Branch, on_delete=models.DO_NOTHING)
    blood_group = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES)
    admission_category = models.ForeignKey(AdmissionCategory, on_delete=models.DO_NOTHING)
    roll_no = models.CharField(max_length=20, primary_key=True)
    rank = models.IntegerField(null=True, blank=True)
    branch_rank = models.IntegerField(null=True, blank=True, help_text="Rank within branch and gender")
    cgpa = models.FloatField(null=True, blank=True)
    caste = models.ForeignKey(Caste, on_delete=models.DO_NOTHING)
    creamy_layer = models.BooleanField(default=False)
    orphan = models.BooleanField(default=False)
    pwd = models.BooleanField(default=False)
    parent_name = models.CharField(max_length=100)
    parent_contact = models.CharField(max_length=15)
    parent_occupation = models.CharField(max_length=100, null=True, blank=True)
    permanent_address = models.TextField()
    annual_income = models.CharField(max_length=20, null=True, blank=True)
    local_guardian_name = models.CharField(max_length=100, null=True, blank=True)
    local_guardian_address = models.TextField(null=True, blank=True)
    local_guardian_contact = models.CharField(max_length=15, null=True, blank=True)
    emergency_contact = models.CharField(max_length=15, null=True, blank=True)
    entrance_exam = models.CharField(
        max_length=10,
        choices=ENTRANCE_EXAM_CHOICES,
        null=True,
        blank=True,
        help_text="Required for First Year students (JEE Mains or MHT-CET)."
    )
    application_form = models.FileField(upload_to='students_documents/forms/', null=True, blank=True)
    hostel_no_dues = models.FileField(upload_to='students_documents/hostel_no_dues/', null=True, blank=True)
    mess_no_dues = models.FileField(upload_to='students_documents/mess_no_dues/', null=True, blank=True)
    address_proof = models.FileField(upload_to='student_documents/address_proofs/', null=True, blank=True)
    caste_validity_certificate = models.FileField(upload_to='student_documents/caste_validity/', null=True, blank=True)
    income_certificate = models.FileField(upload_to='student_documents/income/', null=True, blank=True)
    caste_certificate = models.FileField(upload_to='student_documents/caste_cert/', null=True, blank=True)
    ews_certificate = models.FileField(upload_to='student_documents/ews/', null=True, blank=True)
    pwd_certificate = models.FileField(upload_to='student_documents/pwd/', null=True, blank=True)
    admission_confirmation_letter = models.FileField(upload_to='student_documents/admission_confirmation/', null=True, blank=True)
    college_fee_receipt = models.FileField(upload_to='student_documents/fee_receipt/', null=True, blank=True)
    non_creamy_layer_certificate = models.FileField(upload_to='student_documents/ncl_certificate/', null=True, blank=True)
    verified = models.BooleanField(null=True, default=None)

    def __str__(self):
        return f"{self.first_name} {self.last_name or ''} ({self.roll_no})"
