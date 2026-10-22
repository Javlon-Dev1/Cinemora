from django.contrib import admin
from .models import *

# Register your models here.

admin.site.register(Genre)
admin.site.register(Country)
admin.site.register(Category)


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    filter_horizontal = ('genres', 'country')
    list_display = ('title', 'category', 'release_year', 'views_count', 'is_published')
    readonly_fields = ('views_count',)
    exclude = ('imdb_rating',)


@admin.register(MovieRating)
class MovieRatingAdmin(admin.ModelAdmin):
    list_display = ('movie', 'score', 'visitor_key', 'updated_at')
    list_filter = ('score',)
    readonly_fields = ('movie', 'visitor_key', 'score', 'created_at', 'updated_at')

