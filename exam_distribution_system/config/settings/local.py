from .base import *

DEBUG = True

CORS_ALLOW_ALL_ORIGINS = True

# Overwrite databases if needed, base.py already has sqlite default for dev
# DATABASES = {
#     'default': env.db('DATABASE_URL', default='postgres://postgres:postgres@127.0.0.1:5432/exam_db')
# }
