FROM python:3.13-slim
WORKDIR /app
COPY operator.py /app/operator.py
RUN pip install kubernetes
CMD ["python", "-u", "operator.py"] 
