from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    USER_TYPES = (
        ('student', 'Student'),
        ('warden', 'Warden'),
        ('rector', 'Rector'),
    )
    user_type = models.CharField(max_length=10, choices=USER_TYPES, default='student')
    email = models.EmailField(unique=True)  # Ensures unique email for all users

    def __str__(self):
        return f"{self.username} ({self.user_type})"



class StudentMain(models.Model):
    roll_no = models.CharField(max_length=255)
    personal_mail = models.EmailField(unique=True, null=True)
    college_mail = models.EmailField(unique=True, null=True)
    year = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.name} ({self.year})"

# from django.contrib.auth.models import AbstractUser
# from django.db import models
#
# class CustomUser(AbstractUser):
#     USER_TYPES = (
#         ('student', 'Student'),
#         ('warden', 'Warden'),
#         ('rector', 'Rector'),
#     )
#     user_type = models.CharField(max_length=10, choices=USER_TYPES, default='student')
#
#     def is_student(self):
#         return self.user_type == 'student'
#
#     def is_warden(self):
#         return self.user_type == 'warden'
#
#     def is_rector(self):
#         return self.user_type == 'rector'
#
#
# class Student(models.Model):
#     user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
#     roll_no = models.CharField(max_length=20, unique=True)
#     class = models.CharField(max_length=100)
#     mail = models.CharField(max_length=100, unique=True)
#
#     def __str__(self):
#         return self.user.username
#
# class Warden(models.Model):
#     user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
#     first_name = models.CharField(max_length=100)
#     middle_name = models.CharField(max_length=100)
#     last_name = models.CharField(max_length=100)
#
#     def __str__(self):
#         return self.user.username
#
# class Rector(models.Model):
#     user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, primary_key=True)
#     first_name = models.CharField(max_length=100)
#     middle_name = models.CharField(max_length=100)
#     last_name = models.CharField(max_length=100)
#
#     def __str__(self):
#         return self.user.username

