# Gaia-X Lab Compliance Service

main
branch: [![main pipeline status](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/badges/main/pipeline.svg)](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/commits/main)

development
branch: [![development pipeline status](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/badges/development/pipeline.svg)](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/-/commits/development)

[[_TOC_]]

This repository contains the official implementation of the Gaia-X Compliance.

**Warning**: Gaia-X Compliance is not obtained by using a software but by using specific versions of the compliance
instances. See [GXDCH](https://gaia-x.eu/gxdch/).

## Try out

You can use an instance of the Gaia-X Wizard [here](https://wizard.lab.gaia-x.eu).

## Existing deployments

In addition to the [GXDCH](https://gaia-x.eu/gxdch/) instances, the Gaia-X Lab maintains several instances:

| Deployment URL                                                              | Usage                                                    | Content                                                        |
|-----------------------------------------------------------------------------|----------------------------------------------------------|----------------------------------------------------------------|
| [`v1`, `v1.x.x`](https://compliance.lab.gaia-x.eu/v1/docs/)                 | Used to verify and claim Gaia-X Compliance.              | Latest stable release. Version deployed on the Clearing Houses |
| [`2206-unreleased`](https://compliance.lab.gaia-x.eu/2206-unreleased/docs/) | Used to verify and claim Gaia-X Compliance with 2206 TF. | Outdated 2206-unreleased version                               |
| [main](https://compliance.lab.gaia-x.eu/main/docs/)                         | Used for playground activities.                          | Latest stable (main branch)                                    |
| [development](https://compliance.lab.gaia-x.eu/development/docs/)           | Used for playground activities.                          | Latest unstable (development branch)                           |

## Images tags

This repo provides
several [images tags](https://gitlab.com/gaia-x/lab/compliance/gx-compliance/container_registry/3036427).

| tag           | content              | example |
|---------------|----------------------|---------|
| `vX`          | latest major version | v1      |
| `vX.Y`        | latest minor version | v1.1    |
| `vX.Y.Z`      | specific version     | v1.1.1  |
| `main`        | latest stable        |         |
| `development` | latest unstable      |         |

Feature branches are also build and push to the container registry.

## Deployment

A helm chart is provided inside <a href="k8s/gx-compliance">k8s/gx-compliance</a> folder.

It provides several environment variables for the application:

| Env Variable        | Name in values file            | Default value                                                                                   | Note                                                                                                            |
|---------------------|--------------------------------|-------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| APP_PATH            | ingress.hosts[0].paths[0].path | /main                                                                                           | Deployment path of the application                                                                              |
| BASE_URL            |                                | https://<ingress.hosts[0].host>/<ingress.hosts[0].paths[0].path>                                | URL of the deployed application                                                                                 |
| REGISTRY_URL        | urls.registry                  | http://<ingress.hosts[0].host>.replace("compliance","registry")/<ingress.hosts[0].path[0].path> | defaulted to same namespace registry                                                                            |
| privateKey          | privateKey                     | base64 value of "empty"                                                                         | This value is assigned automatically and contains the privateKey content. Stored in a secret in the cluster     |
| X509_CERTIFICATE    | X509_CERTIFICATE               | base64 value of "empty"                                                                         | This value is assigned automatically and contains the x509 certificate chain. Stored in a secret in the cluster |
| SD_STORAGE_BASE_URL | urls.storage                   | https://example-storage.lab.gaia-x.eu                                                           ||
| SD_STORAGE_API_KEY  | storageApiKey                  | "Nothing"                                                                                       ||

Usage example:

```shell
helm upgrade --install -n "<branch-name>" --create-namespace gx-compliance ./k8s/gx-compliance --set "nameOverride=<branch-name>,ingress.hosts[0].host=compliance.lab.gaia-x.eu,ingress.hosts[0].paths[0].path=/<branch-name>,image.tag=<branch-name>,ingress.hosts[0].paths[0].pathType=Prefix,privateKey=$complianceKey,X509_CERTIFICATE=$complianceCert"
```

For a tag:

```shell
helm upgrade --install -n "v1" --create-namespace gx-compliance ./k8s/gx-compliance --set "nameOverride=v1,ingress.hosts[0].host=compliance.lab.gaia-x.eu,ingress.hosts[0].paths[0].path=/v1,image.tag=v1,ingress.hosts[0].paths[0].pathType=Prefix,privateKey=$complianceKey,X509_CERTIFICATE=$complianceCert"
```

The deployment is triggered automatically on `development` and `main` branches, as well as on release. Please refer
to [Gaia-X Lab Compliance Service](#gaia-x-lab-compliance-service) for available instances.

## See also

- [API Usage](./README-api.md)
- [Development and local testing](./README-developer.md)
