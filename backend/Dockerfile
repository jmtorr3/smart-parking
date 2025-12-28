FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libpq-dev gcc && \
    rm -rf /var/lib/apt/lists/*

COPY parking_system/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY parking_system/ .

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "parking_system.wsgi:application"]
