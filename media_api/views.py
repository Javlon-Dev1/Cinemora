from django.shortcuts import render
from django.http import Http404
from django.db.models import Avg, Count, F

from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .serializers import *
from .models import *

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
# Create your views here.

class SearchView(ListAPIView):
    queryset = Movie.objects.filter(is_published=True).annotate(
        ratings_average=Avg('ratings__score'), ratings_count=Count('ratings', distinct=True),
    ).prefetch_related('genres', 'country', 'category')
    serializer_class = MovieSerializer

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
    ]

    filterset_fields = [
        'genres',
        'country',
        'category',
    ]

    search_fields = [
        'title',
        'description',
    ]


class MovieDetailView(RetrieveAPIView):
    queryset = Movie.objects.filter(is_published=True).annotate(
        ratings_average=Avg('ratings__score'), ratings_count=Count('ratings', distinct=True),
    ).prefetch_related('genres', 'country', 'category')
    serializer_class = MovieSerializer
    lookup_field = 'slug'


class MovieRatingView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get_movie(self, slug):
        try:
            return Movie.objects.get(slug=slug, is_published=True)
        except Movie.DoesNotExist as exc:
            raise Http404('Movie not found') from exc

    def get(self, request, slug):
        movie = self.get_movie(slug)
        visitor_key = request.query_params.get('visitor_key', '')
        own_rating = MovieRating.objects.filter(movie=movie, visitor_key=visitor_key).values_list('score', flat=True).first() if visitor_key else None
        summary = movie.ratings.aggregate(average=Avg('score'), count=Count('id'))
        return Response({'average_rating': round(float(summary['average']), 1) if summary['average'] is not None else None,
                         'rating_count': summary['count'], 'user_rating': own_rating})

    def post(self, request, slug):
        movie = self.get_movie(slug)
        visitor_key = str(request.data.get('visitor_key', '')).strip()
        score = request.data.get('score')
        if not visitor_key or len(visitor_key) > 64:
            return Response({'detail': 'visitor_key talab qilinadi.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            score = int(score)
        except (TypeError, ValueError):
            score = 0
        if score < 1 or score > 5:
            return Response({'detail': 'Baho 1 dan 5 gacha bo‘lishi kerak.'}, status=status.HTTP_400_BAD_REQUEST)
        MovieRating.objects.update_or_create(movie=movie, visitor_key=visitor_key, defaults={'score': score})
        summary = movie.ratings.aggregate(average=Avg('score'), count=Count('id'))
        return Response({'average_rating': round(float(summary['average']), 1),
                         'rating_count': summary['count'], 'user_rating': score})


class MovieViewCountView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, slug):
        updated = Movie.objects.filter(slug=slug, is_published=True).update(views_count=F('views_count') + 1)
        if not updated:
            raise Http404('Movie not found')
        views_count = Movie.objects.values_list('views_count', flat=True).get(slug=slug)
        return Response({'views_count': views_count})


def home_page(request):
    return render(request, 'media_api/home.html')


def search_page(request):
    return render(request, 'media_api/search.html', {'query': request.GET.get('q', '')})


def watch_page(request, slug):
    if not Movie.objects.filter(slug=slug, is_published=True).exists():
        raise Http404('Movie not found')
    return render(request, 'media_api/watch.html', {'movie_slug': slug})

@api_view(['get'])
def category_view(request):
    category = Category.objects.all()
    serializer = CategorySerializer(category, many=True)

    return Response(serializer.data)

