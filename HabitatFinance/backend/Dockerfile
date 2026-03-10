# Use a lightweight Python base image
FROM python:3.11-slim

# Set the working directory inside the container
WORKDIR /app

# Copy only the requirements first to leverage Docker's caching
COPY requirements.txt .

# Install dependencies (ignoring the cache to keep the image small)
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your backend code
COPY . .

# DigitalOcean automatically injects the $PORT environment variable.
# We use sh -c to evaluate the $PORT variable at runtime.
CMD ["sh", "-c", "gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT"]