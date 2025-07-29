import kopf
import kubernetes

# Ensure the Kubernetes client is configured
kubernetes.config.load_incluster_config()


@kopf.on.update("front.search.com", "v1", "reshardings", namespace="es-config")
@kopf.on.create("front.search.com", "v1", "reshardings", namespace="es-config")
def resharding_handler(spec, name, namespace, status, **kwargs):
    api = kubernetes.client.CustomObjectsApi()
    # Set status to DONE if not already
    if spec.get("status") != "DONE":
        body = {"spec": dict(spec)}
        body["spec"]["status"] = "DONE"
        api.patch_namespaced_custom_object(
            group="elasticsearch.example.com",
            version="v1",
            namespace=namespace,
            plural="reshardings",
            name=name,
            body=body,
        )
        kopf.info({"name": name}, reason="StatusUpdate", message="Status set to DONE")
