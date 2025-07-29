import time
import kubernetes

# Ensure the Kubernetes client is configured
kubernetes.config.load_incluster_config()

NAMESPACE = "es-config"
GROUP = "front.search.com"
VERSION = "v1"
PLURAL = "reshardings"

api = kubernetes.client.CustomObjectsApi()

while True:
    try:
        reshardings = api.list_namespaced_custom_object(
            group=GROUP, version=VERSION, namespace=NAMESPACE, plural=PLURAL
        )
        print(reshardings)
        for item in reshardings.get("items", []):
            name = item["metadata"]["name"]
            spec = item.get("spec", {})
            if spec.get("status") != "DONE":
                body = {"spec": dict(spec)}
                body["spec"]["status"] = "DONE"
                api.patch_namespaced_custom_object(
                    group=GROUP,
                    version=VERSION,
                    namespace=NAMESPACE,
                    plural=PLURAL,
                    name=name,
                    body=body,
                )
                print(f"Set status to DONE for {name}")
    except Exception as e:
        print(f"Error: {e}")
    time.sleep(10)
