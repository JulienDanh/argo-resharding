#!/bin/bash
set -e

(cd operators && ./build-operator.sh)

kubectl apply -f https://download.elastic.co/downloads/eck/3.0.0/crds.yaml
kubectl apply -f https://download.elastic.co/downloads/eck/3.0.0/operator.yaml

kubectl apply -f argocd-apps/es-app.yaml -n argocd
kubectl apply -f argocd-apps/es-config-app.yaml -n argocd

echo "Elasticsearch ArgoCD app deployed!"
