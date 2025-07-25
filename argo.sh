#!/bin/bash

# ArgoCD Installation Script for KIND Cluster
CLUSTER_NAME="argo-cluster"

# Function to check if kubectl is available
check_kubectl() {
  if ! command -v kubectl &>/dev/null; then
    echo "ERROR: kubectl is not installed. Please install kubectl first."
    exit 1
  fi
}

# Function to check if cluster exists and is running
check_cluster() {
  if ! kind get clusters | grep -q "$CLUSTER_NAME"; then
    echo "ERROR: Cluster '$CLUSTER_NAME' does not exist. Create it first with: ./start-cluster.sh create"
    exit 1
  fi

  if ! kubectl cluster-info --context "kind-$CLUSTER_NAME" &>/dev/null; then
    echo "ERROR: Cannot connect to cluster '$CLUSTER_NAME'. Make sure it's running."
    exit 1
  fi
}

# Function to install ArgoCD
install_argocd() {
  echo "Installing ArgoCD on cluster '$CLUSTER_NAME'..."

  # Set the context
  kubectl config use-context "kind-$CLUSTER_NAME"

  # Create namespace
  kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

  # Install ArgoCD
  kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

  echo "Waiting for ArgoCD pods to be ready..."
  kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

  echo "ArgoCD installed successfully!"
}

# Function to get admin password
get_password() {
  echo "Getting ArgoCD admin password..."
  kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
  echo ""
}

# Function to start port forwarding
start_port_forward() {
  echo "Starting port forwarding for ArgoCD UI..."
  echo "ArgoCD UI will be available at: http://localhost:8080"
  echo "Username: admin"
  echo "Password: $(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)"
  echo ""
  echo "Press Ctrl+C to stop port forwarding"
  kubectl port-forward svc/argocd-server -n argocd 8080:443
}

# Function to show ArgoCD status
show_status() {
  echo "ArgoCD status:"
  kubectl get pods -n argocd
  echo ""
  echo "ArgoCD services:"
  kubectl get svc -n argocd
}

# Function to show help
show_help() {
  echo "Usage: $0 [COMMAND]"
  echo ""
  echo "Commands:"
  echo "  install   - Install ArgoCD on the cluster"
  echo "  password  - Get the admin password"
  echo "  ui        - Start port forwarding for ArgoCD UI"
  echo "  status    - Show ArgoCD status"
  echo "  help      - Show this help message"
}

# Main script logic
main() {
  case "${1:-help}" in
  "install")
    check_kubectl
    check_cluster
    install_argocd
    ;;
  "password")
    check_kubectl
    check_cluster
    get_password
    ;;
  "ui")
    check_kubectl
    check_cluster
    start_port_forward
    ;;
  "status")
    check_kubectl
    check_cluster
    show_status
    ;;
  "help" | *)
    show_help
    ;;
  esac
}

# Run main function with all arguments
main "$@"

