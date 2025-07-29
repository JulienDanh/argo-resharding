FROM python:3.13-slim
WORKDIR /app
COPY es-operator.py /app/es-operator.py
RUN pip install kubernetes
CMD ["python", "-u", "es-operator.py"] 
