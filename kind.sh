#!/bin/bash

# KIND Kubernetes Cluster Management Script
CLUSTER_NAME="argo-cluster"
CONFIG_FILE="kind-config.yaml"

# Function to check if KIND is installed
check_kind() {
  if ! command -v kind &>/dev/null; then
    echo "ERROR: KIND is not installed. Please install KIND first:"
    echo "  macOS: brew install kind"
    echo "  Linux: curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64 && chmod +x ./kind && sudo mv ./kind /usr/local/bin/"
    echo "  Windows: choco install kind"
    exit 1
  fi
}

# Function to check if Docker is running
check_docker() {
  if ! docker info &>/dev/null; then
    echo "ERROR: Docker is not running. Please start Docker first."
    exit 1
  fi
}

# Function to create cluster
create_cluster() {
  echo "Creating KIND cluster '$CLUSTER_NAME'..."

  if kind get clusters | grep -q "$CLUSTER_NAME"; then
    echo "Cluster '$CLUSTER_NAME' already exists. Use 'restart' to recreate it."
    return 1
  fi

  if kind create cluster --name "$CLUSTER_NAME" --config "$CONFIG_FILE"; then
    echo "Cluster '$CLUSTER_NAME' created successfully!"
    echo "To use this cluster: kubectl config use-context kind-$CLUSTER_NAME"
  else
    echo "Failed to create cluster"
    return 1
  fi
}

# Function to start existing cluster
start_cluster() {
  echo "Starting cluster '$CLUSTER_NAME'..."
  if kind start cluster --name "$CLUSTER_NAME"; then
    echo "Cluster '$CLUSTER_NAME' started successfully!"
  else
    echo "Failed to start cluster"
    return 1
  fi
}

# Function to stop cluster
stop_cluster() {
  echo "Stopping cluster '$CLUSTER_NAME'..."
  if kind stop cluster --name "$CLUSTER_NAME"; then
    echo "Cluster '$CLUSTER_NAME' stopped successfully!"
  else
    echo "Failed to stop cluster"
    return 1
  fi
}

# Function to delete cluster
delete_cluster() {
  echo "Deleting cluster '$CLUSTER_NAME'..."
  if kind delete cluster --name "$CLUSTER_NAME"; then
    echo "Cluster '$CLUSTER_NAME' deleted successfully!"
  else
    echo "Failed to delete cluster"
    return 1
  fi
}

# Function to restart cluster (delete and recreate)
restart_cluster() {
  echo "Restarting cluster '$CLUSTER_NAME'..."
  delete_cluster
  create_cluster
}

# Function to show cluster status
show_status() {
  echo "Cluster status:"
  kind get clusters
  echo ""
  echo "Current kubectl context:"
  kubectl config current-context
}

# Function to show cluster info
show_info() {
  if kind get clusters | grep -q "$CLUSTER_NAME"; then
    echo "Cluster information:"
    kubectl cluster-info --context "kind-$CLUSTER_NAME"
    echo ""
    echo "Node information:"
    kubectl get nodes --context "kind-$CLUSTER_NAME"
  else
    echo "Cluster '$CLUSTER_NAME' does not exist"
  fi
}

# Function to show help
show_help() {
  echo "Usage: $0 [COMMAND]"
  echo ""
  echo "Commands:"
  echo "  create    - Create a new cluster"
  echo "  start     - Start an existing cluster"
  echo "  stop      - Stop the cluster"
  echo "  delete    - Delete the cluster"
  echo "  restart   - Delete and recreate the cluster"
  echo "  status    - Show cluster status"
  echo "  info      - Show cluster information"
  echo "  help      - Show this help message"
}

# Main script logic
main() {
  case "${1:-help}" in
  "create")
    check_kind
    check_docker
    create_cluster
    ;;
  "start")
    check_kind
    check_docker
    start_cluster
    ;;
  "stop")
    check_kind
    stop_cluster
    ;;
  "delete")
    check_kind
    delete_cluster
    ;;
  "restart")
    check_kind
    check_docker
    restart_cluster
    ;;
  "status")
    check_kind
    show_status
    ;;
  "info")
    check_kind
    show_info
    ;;
  "help" | *)
    show_help
    ;;
  esac
}

# Run main function with all arguments
main "$@"
