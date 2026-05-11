# Chasm-Master-API-Server

A RESTful API server for Chasm Master. Built with Node.js and Typescript packages.

## Running the Server

To run the server locally, do the following:

1. Add a value to the `MONGODB_CONN_URL` env variable in `docker-compose.services.yml` so you can connect to a database deployment. This can be the one you'll spin up locally or another one.
2. Run a Docker daemon like [Colima](https://github.com/abiosoft/colima).
3. Navigate to the project directory and run `docker compose up --build`. The local server will be reachable at your localhost on port 8000 or whatever you set as your `$PORT` env variable.

## GitHub Actions

The server image (on Google Cloud Artifact Registry) is automatically updated and redeployed when you merge a PR onto `main`.
