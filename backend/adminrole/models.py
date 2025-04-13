from django.db import models

# Create your models here.
from django.db import models

class SelectDates(models.Model):
    event_id = models.AutoField(primary_key=True)
    event = models.TextField()
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.event} ({self.start_date} - {self.end_date})"