FROM python:3.11-slim

WORKDIR /app

COPY server.py /app/server.py

# Create mount point for courses
RUN mkdir -p /app/courses

ENV COURSES_DIR=/app/courses
ENV PORT=8080

EXPOSE 8080

CMD ["python", "-u", "server.py"]
