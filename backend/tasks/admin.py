from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Admin interface for Task model"""
    
    list_display = ['title', 'status', 'assignee', 'deadline', 'created_at']
    list_filter = ['status', 'assignee', 'created_at', 'deadline']
    search_fields = ['title', 'description', 'assignee__username']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Task Information', {
            'fields': ('title', 'description', 'status')
        }),
        ('Assignment', {
            'fields': ('assignee', 'deadline')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['created_at', 'updated_at']
