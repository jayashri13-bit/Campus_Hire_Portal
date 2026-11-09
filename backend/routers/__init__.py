# Feature-named Routers Package for Campus Hire API
from routers import (
    auth_authentication,
    jobs_postings,
    admin_dashboard,
    admin_analytics,
    admin_queries_stories,
    student_dashboard,
    student_hub
)

# Aliases for compatibility
auth = auth_authentication
jobs = jobs_postings
admin = admin_dashboard
analytics = admin_analytics
queries_stories = admin_queries_stories
student = student_dashboard
