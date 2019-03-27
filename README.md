# Berlioz GCP Samples
The purpose of this repository is to present capabilities of [Berlioz](https://berlioz.cloud) - the microservices applications deployment and orchestration service.

The repo is structured in chapters, starting with trivial samples to more complex applications.

## Prerequisites
First, install _berlioz_ command line toolkit.
```
$ npm install berlioz -g
```

## Running Samples Locally
1. Navigate to sample directory
```
$ cd 01.FuncAdddr
```

2. Setup GCP cloud account.
```
$ berlioz local provider gcp set --key-path <path-to-credentials-json>
```

3. Build and deploy the project
```
$ berlioz local build-run
```


## Running Samples In GCP
1. Push Image
```
$ cd 01.FuncAdddr
$ berlioz push --region us-central-1a
```

2. Deploy in GCP
```
$ berlioz run --deployment prod --cluster addr --region us-central1-a
```

3. Check Deployment Status
```
$ berlioz status --region us-central-1a
```
