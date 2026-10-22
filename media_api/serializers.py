from django.db.models import Avg, Count
from rest_framework import serializers
from .models import *

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = '__all__'


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = '__all__'

class MovieSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    genres = GenreSerializer(many=True, read_only=True)
    country = CountrySerializer(many=True, read_only=True)
    genre_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Genre.objects.all(), source='genres', write_only=True, required=False,
    )
    country_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Country.objects.all(), source='country', write_only=True, required=False,
    )
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = (
            'id', 'title', 'slug', 'description', 'category', 'release_year', 'duration',
            'poster', 'video_url', 'trailer_url', 'genres', 'genre_ids', 'country', 'country_ids',
            'imdb_rating', 'views_count', 'average_rating', 'rating_count', 'is_published',
            'created_at', 'uploaded_at',
        )
        read_only_fields = ('imdb_rating', 'views_count', 'average_rating', 'rating_count', 'created_at', 'uploaded_at')

    def get_average_rating(self, obj):
        value = getattr(obj, 'ratings_average', None)
        if value is None:
            value = obj.ratings.aggregate(value=Avg('score'))['value']
        return round(float(value), 1) if value is not None else None

    def get_rating_count(self, obj):
        value = getattr(obj, 'ratings_count', None)
        return value if value is not None else obj.ratings.count()
