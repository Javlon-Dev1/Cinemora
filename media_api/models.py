from math import ceil

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import FileExtensionValidator, MinValueValidator, MaxValueValidator
from django.db.models import Q
from django.core.exceptions import ValidationError
from mutagen import MutagenError
from mutagen.mp4 import MP4

from django.utils.text import slugify


# Create your models here.

class Genre(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Country(models.Model):
    name = models.CharField(max_length=100)

    class Meta:
        verbose_name_plural = 'countries'

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)

    class Meta:
        verbose_name_plural = 'categories'

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Movie(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=288, blank=True, unique=True)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.PROTECT)
    release_year = models.PositiveSmallIntegerField(db_index=True)
    duration = models.PositiveSmallIntegerField(blank=True, null=True, help_text='daqiqada')
    poster = models.ImageField(upload_to='posters/')
    video_url = models.URLField(blank=True)
    video_file = models.FileField(
        upload_to='videos/',
        blank=True,
        null=True,
        validators=[FileExtensionValidator(allowed_extensions=['mp4'])],
    )
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

    def clean(self):
        super().clean()
        if not self.video_file and not self.video_url:
            raise ValidationError('Kino uchun video fayl yoki video URL kiriting.')
        if self.video_file:
            video = self.video_file.file
            position = video.tell()
            try:
                video.seek(0)
                duration_seconds = MP4(video).info.length
                self.duration = max(1, ceil(duration_seconds / 60))
            except (MutagenError, OSError, ValueError, TypeError, AttributeError) as exc:
                raise ValidationError({
                    'video_file': 'Video davomiyligini aniqlab bo‘lmadi. MP4 faylni tekshiring.',
                }) from exc
            finally:
                video.seek(position)

    def __str__(self):
        return self.title


class MovieRating(models.Model):
    """One rating per browser identity and movie until accounts are added."""
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='ratings')
    visitor_key = models.CharField(max_length=64)
    score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['movie', 'visitor_key'], name='unique_movie_rating_per_visitor'),
            models.CheckConstraint(condition=Q(score__gte=1, score__lte=5), name='movie_rating_score_1_to_5'),
        ]
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.movie}: {self.score}/5'
