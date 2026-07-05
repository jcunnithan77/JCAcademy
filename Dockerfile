FROM python:3.11-slim

WORKDIR /app

# Copy server, UI dashboards, and frontend assets
COPY server.py index.html tutorial_dashboard.html /app/
COPY assets/ /app/assets/

# NOTE: Courses/ is NOT copied into the image.
# It is bind-mounted from the host at runtime via docker-compose.yml
# so any JSON files added on the host are immediately visible in the container.

ENV COURSES_DIR=/app/Courses
ENV PORT=8080

EXPOSE 8080

CMD ["python", "-u", "server.py"]
