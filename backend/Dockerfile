# 1. Use an official Python image
FROM python:3.10

# 2. Create and set the working directory
WORKDIR /app

# 3. Copy the requirements file and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy the rest of the code into the container
COPY . .

# 5. Expose port 8000 (FastAPI default)
EXPOSE 8000

# 6. Default command to run FastAPI with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
