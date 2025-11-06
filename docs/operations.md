# Operations

## Local Development

- Prereqs: Docker, pnpm, Foundry
- Start stack: `docker-compose up --build` in `backend/`
- Contracts tests: `cd contracts && forge test -vv`

## Observability

- Structured logs (Pino) for services
- Prometheus + Grafana (planned) for metrics and dashboards
- OpenTelemetry traces (planned) for end-to-end visibility

## Deployment

- CI: GitHub Actions builds contracts and backend
- CD: Kubernetes manifests (infra/k8s) and Terraform stubs (infra/terraform)
- Canary/blue-green rollout for services (planned)


