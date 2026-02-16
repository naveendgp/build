# Otter Laundry API Load Tests

This directory contains k6 load tests for the Otter Laundry API backend.

## Prerequisites

- [k6](https://k6.io/docs/get-started/installation/) must be installed on your machine.
- The backend server must be running (default: `http://localhost:3000`).

## Configuration

Configuration is located in `config.js`. 
- `BASE_URL`: API endpoint.
- `TEST_PHONE`: Magic phone number (default: `9999999999`).
- `TEST_OTP`: Magic OTP (default: `1234`).

## Running the Tests

To run the full suite using the configured stages:

```bash
k6 run load-test/main.js
```

To run a quick smoke test (1 user, 1 iteration):

```bash
k6 run --vus 1 --iterations 1 load-test/main.js
```

## Structure

- `main.js`: Entry point, defines scenarios and groups.
- `config.js`: Global settings.
- `auth.js`: Login helpers.
- `user-api.js`: User API endpoints.
- `vendor-api.js`: Vendor API endpoints.
