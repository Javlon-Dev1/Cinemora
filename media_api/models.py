from django.db import models
from django.contrib.auth.models import AbstractUser

from django.utils.text import slugify

# Create your models here.

class User(AbstractUser):
    pass

    def __str__(self):
        return self.first_name

class Genre(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

class Country(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = 'countries'

    def __str__(self):
        return self.name

class Movie(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=288, blank=True, unique=True)
    description = models.TextField()
    release_year = models.PositiveSmallIntegerField(db_index=True)
    duration = models.PositiveSmallIntegerField(help_text='daqiqada')
    poster = models.ImageField(upload_to='posters/')
    video_url = models.URLField()
    trailer_url = models.URLField()
    genres = models.ManyToManyField(Genre, related_name='movies')
    country = models.ManyToManyField(Country, related_name='movies')
    imdb_rating = models.DecimalField(max_digits=3, decimal_places=1, null=True, blank=True)
    views_count = models.PositiveIntegerField(default=0)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
