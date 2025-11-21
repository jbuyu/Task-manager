from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class UserPagination(PageNumberPagination):
    """Pagination for user list endpoints."""
    
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50
    
    def get_paginated_response(self, data):
        page_size = self.get_page_size(self.request)
        return Response({
            'count': self.page.paginator.count,
            'current_page': self.page.number,
            'total_pages': self.page.paginator.num_pages,
            'page_size': page_size,
            'results': data,
        })

