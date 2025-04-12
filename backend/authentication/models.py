from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    USER_TYPES = (
        ('student', 'Student'),
        ('warden', 'Warden'),
        ('rector', 'Rector'),
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='student')
    email = models.EmailField(unique=True)

    def __str__(self):
        return f"{self.username} ({self.user_type})"

class Gender(models.Model):
    gender = models.CharField(max_length=20, unique=True, primary_key=True)

class Branch(models.Model):
    branch = models.CharField(max_length=100, unique=True, primary_key=True)

class Class(models.Model):
    class_name = models.CharField(max_length=100, unique=True, primary_key=True)

class BloodGroup(models.Model):
    blood_group = models.CharField(max_length=10, unique=True, primary_key=True)

class AdmissionCategory(models.Model):
    admission_category = models.CharField(max_length=100, unique=True, primary_key=True)

class Caste(models.Model):
    caste = models.CharField(max_length=100, unique=True, primary_key=True)
    seat_matrix_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

class StudentDataEntry(models.Model):
    personal_mail = models.EmailField(unique=True)
    college_mail = models.EmailField(null=True, blank=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    gender = models.ForeignKey(Gender, on_delete=models.DO_NOTHING)
    mobile_number = models.CharField(max_length=15)
    class_name = models.ForeignKey(Class, on_delete=models.DO_NOTHING)
    branch = models.ForeignKey(Branch, on_delete=models.DO_NOTHING)
    blood_group = models.ForeignKey(BloodGroup, on_delete=models.DO_NOTHING)
    admission_category = models.ForeignKey(AdmissionCategory, on_delete=models.DO_NOTHING)
    roll_no = models.CharField(max_length=20, unique=True, primary_key=True)
    rank = models.IntegerField(null=True, blank=True)
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
    hostel_no_dues = models.CharField(max_length=50, null=True, blank=True)
    mess_no_dues = models.CharField(max_length=50, null=True, blank=True)
    address_proof = models.CharField(max_length=255, null=True, blank=True)
    caste_validity_certificate = models.CharField(max_length=255, null=True, blank=True)
    income_certificate = models.CharField(max_length=255, null=True, blank=True)
    caste_certificate = models.CharField(max_length=255, null=True, blank=True)
    ews_certificate = models.CharField(max_length=255, null=True, blank=True)
    pwd_certificate = models.CharField(max_length=255, null=True, blank=True)
    admission_confirmation_letter = models.CharField(max_length=255, null=True, blank=True)
    college_fee_receipt = models.CharField(max_length=255, null=True, blank=True)
    non_creamy_layer_certificate = models.CharField(max_length=255, null=True, blank=True)
    verified = models.BooleanField(null=True, default=None)

class StudentMain(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name="student_profile", null=True)
    
    personal_mail = models.EmailField(unique=True, null=True)
    college_mail = models.EmailField(null=True, blank=True)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, null=True, blank=True)
    last_name = models.CharField(max_length=100, null=True, blank=True)
    mobile_number = models.CharField(max_length=15)
    class_name = models.ForeignKey(Class, on_delete=models.DO_NOTHING)
    branch = models.ForeignKey(Branch, on_delete=models.DO_NOTHING)
    blood_group = models.ForeignKey(BloodGroup, on_delete=models.DO_NOTHING)
    admission_category = models.ForeignKey(AdmissionCategory, on_delete=models.DO_NOTHING)
    roll_no = models.CharField(max_length=20, unique=True, primary_key=True)
    rank = models.IntegerField(null=True, blank=True)
    caste = models.ForeignKey(Caste, on_delete=models.DO_NOTHING)
    pwd = models.BooleanField(default=False, null=True)
    creamy_layer = models.BooleanField(default=False, null=True)
    parent_name = models.CharField(max_length=100, null=True)
    parent_contact = models.CharField(max_length=15, null=True)
    permanent_address = models.TextField(null=True)
    local_guardian_name = models.CharField(max_length=100, null=True, blank=True)
    local_guardian_contact = models.CharField(max_length=15, null=True, blank=True)
    local_guardian_address = models.TextField(null=True, blank=True)
    emergency_contact = models.CharField(max_length=15, null=True, blank=True)
    caste_certificate = models.CharField(max_length=255, null=True, blank=True)
    ews_certificate = models.CharField(max_length=255, null=True, blank=True)
    pwd_certificate = models.CharField(max_length=255, null=True, blank=True)
    non_creamy_layer_certificate = models.CharField(max_length=255, null=True, blank=True)
    gender = models.ForeignKey(Gender, on_delete=models.DO_NOTHING)

