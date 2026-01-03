# Use an official lightweight Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory inside the container
WORKDIR /app

# Prevent Python from writing .pyc files to disc
ENV PYTHONDONTWRITEBYTECODE 1

# Ensure that python output is sent straight to terminal without buffering
ENV PYTHONUNBUFFERED 1

# Install system dependencies required for gcc and PostgreSQL client
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend application code
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run uvicorn server with hot-reload enabled
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]