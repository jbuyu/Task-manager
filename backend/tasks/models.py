from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Task(models.Model):
    """Task model for managing team tasks"""
    
    class Status(models.TextChoices):
        TODO = 'Todo', 'Todo'
        IN_PROGRESS = 'In Progress', 'In Progress'
        DONE = 'Done', 'Done'
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
    )
    deadline = models.DateTimeField(null=True, blank=True)
    assignee = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tasks_task'
        ordering = ['-created_at']
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
    
    def __str__(self):
        assignee_name = self.assignee.username if self.assignee else 'Unassigned'
        return f"{self.title} ({self.status}) - {assignee_name}"
    
    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if self.deadline and self.status != self.Status.DONE:
            return timezone.now() > self.deadline
        return False
