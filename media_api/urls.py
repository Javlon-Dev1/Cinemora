from django.urls import path

from .views import *

urlpatterns = [
    path('home/', SearchView.as_view(), name='home'),
    path('movie/<slug:slug>/', MovieDetailView.as_view(), name='movie-detail'),
    path('movie/<slug:slug>/rating/', MovieRatingView.as_view(), name='movie-rating'),
    path('movie/<slug:slug>/view/', MovieViewCountView.as_view(), name='movie-view-count'),
    path('category/', category_view, name='category'),
    #path('movie/', MovieView.as_view(), name='movie'),
]
