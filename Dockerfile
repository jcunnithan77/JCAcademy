FROM python:3.11-slim

WORKDIR /app

# Copy server, UI dashboards, and frontend assets
COPY server.py index.html tutorial_dashboard.html /app/
COPY assets/ /app/assets/

# Copy standalone JSON tutorial course data
COPY Courses/ /app/Courses/

ENV COURSES_DIR=/app/Courses
ENV PORT=8080

EXPOSE 8080

CMD ["python", "-u", "server.py"]
