FROM python:3.10-slim

WORKDIR /code

# Install system dependencies (e.g. for psycopg2 if building from source, or audio libs)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    git \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY ./requirements.txt /code/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Create a non-root user (Hugging Face Spaces recommendation)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH

# Copy the rest of the application
COPY --chown=user . /code

# Expose the port (7860 is default for Spaces)
EXPOSE 7860

# Command to run the application
# Use uvicorn to run the app. Use 0.0.0.0 for host and 7860 for port.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "7860"]
