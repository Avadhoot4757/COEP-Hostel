from django.db import models

# Create your models here.
from django.db import models

from django.db import models

class SelectDates(models.Model):
    # Let Django handle the primary key automatically
    event_id = models.IntegerField(unique=True)  # Not primary key
    event = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    
    def __str__(self):
        return f"{self.event} (ID: {self.event_id}, {self.start_date} - {self.end_date})"
    
    class Meta:
        ordering = ['event_id']