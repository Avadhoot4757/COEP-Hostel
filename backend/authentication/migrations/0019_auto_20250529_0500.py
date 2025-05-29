from django.db import migrations, models
# Import your CustomUser to access CLASS_CHOICES
from authentication.models import CustomUser


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0017_branch_seat_allocation_weight'),  # Replace with your actual previous migration
    ]

    operations = [
        # Create Branch table with new structure
        migrations.CreateModel(
            name='Branch',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('branch', models.CharField(max_length=100)),
                ('year', models.CharField(max_length=10, choices=CustomUser.CLASS_CHOICES)),
                ('seat_allocation_weight', models.IntegerField(default=1)),
            ],
            options={
                'indexes': [models.Index(fields=['year'], name='authentication_branch_year_idx')],
            },
        ),
        
        # Create Caste table with new structure
        migrations.CreateModel(
            name='Caste',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('caste', models.CharField(max_length=100)),
                ('year', models.CharField(max_length=10, choices=CustomUser.CLASS_CHOICES)),
                ('seat_matrix_percentage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
            ],
            options={
                'indexes': [models.Index(fields=['year'], name='authentication_caste_year_idx')],
            },
        ),
        
        # Add unique_together constraints
        migrations.AlterUniqueTogether(
            name='branch',
            unique_together={('branch', 'year')},
        ),
        migrations.AlterUniqueTogether(
            name='caste',
            unique_together={('caste', 'year')},
        ),
    ]
