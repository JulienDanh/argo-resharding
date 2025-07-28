#!/bin/bash
set -e

kubectl apply -f https://download.elastic.co/downloads/eck/3.0.0/crds.yaml
kubectl apply -f https://download.elastic.co/downloads/eck/3.0.0/operator.yaml

kubectl apply -f elasticsearch/argocd-app.yaml -n argocd
kubectl apply -f es-config-app/argocd-app.yaml -n argocd

echo "Elasticsearch ArgoCD app deployed!"
