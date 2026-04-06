from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from core.models import TimeStampedModel

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'super')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    ROLE_CHOICES = (
        ('super', 'Super'),
        ('admin', 'Admin'),
    )
    
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='admin')
    lang = models.CharField(max_length=10, default='ar')
    image = models.ImageField(upload_to='users/', null=True, blank=True)
    created_by_user_id = models.IntegerField(null=True, blank=True, db_column='iduser')
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    def __str__(self):
        return self.email


class ModulePermission(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='module_permissions')
    name = models.CharField(max_length=100)
    can_show = models.BooleanField(default=False, db_column='show')
    can_add = models.BooleanField(default=False, db_column='add')
    can_edit = models.BooleanField(default=False, db_column='edit')
    can_delete = models.BooleanField(default=False, db_column='delete')
    can_posted = models.BooleanField(default=False, db_column='posted')
    updated_by_user_id = models.IntegerField(null=True, blank=True, db_column='iduser')

    class Meta:
        unique_together = ('user', 'name')

    def __str__(self):
        return f'{self.user.email} - {self.name}'


class UserActivityLog(TimeStampedModel):
    """سجل نشاط المستخدمين — يتتبع جميع العمليات في النظام."""

    ACTION_CHOICES = [
        ('login',      'تسجيل دخول'),
        ('logout',     'تسجيل خروج'),
        ('create',     'إضافة'),
        ('update',     'تعديل'),
        ('delete',     'حذف'),
        ('export',     'تصدير'),
        ('distribute', 'توزيع'),
    ]

    user = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='activity_logs',
        verbose_name='المستخدم',
    )
    action      = models.CharField(max_length=20, choices=ACTION_CHOICES, verbose_name='الإجراء')
    module      = models.CharField(max_length=100, verbose_name='الوحدة')
    description = models.TextField(blank=True, default='', verbose_name='الوصف')
    ip_address  = models.GenericIPAddressField(null=True, blank=True, verbose_name='عنوان IP')
    user_agent  = models.CharField(max_length=500, blank=True, default='', verbose_name='المتصفح')
    extra_data  = models.JSONField(null=True, blank=True, verbose_name='بيانات إضافية')

    class Meta:
        db_table         = 'user_activity_logs'
        ordering         = ['-created_at']
        verbose_name     = 'سجل النشاط'
        verbose_name_plural = 'سجلات النشاط'

    def __str__(self):
        user_str = self.user.email if self.user else 'مجهول'
        return f'{user_str} — {self.get_action_display()} — {self.module}'
