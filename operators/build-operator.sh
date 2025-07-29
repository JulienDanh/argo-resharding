#!/bin/bash

set -e
docker build -t operator:latest .
kind load docker-image operator:latest --name argo-cluster

