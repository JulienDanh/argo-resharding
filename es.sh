#!/bin/bash
set -e

kubectl create -f https://download.elastic.co/downloads/eck/3.2.0/crds.yaml

kubectl apply -f https://download.elastic.co/downloads/eck/3.2.0/operator.yaml

# Deploy the ArgoCD Application for Elasticsearch
kubectl apply -f elasticsearch/argocd-app.yaml -n argocd

echo "Elasticsearch ArgoCD app deployed!"
