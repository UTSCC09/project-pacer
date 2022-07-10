set -e
set -u
docker compose -f pacer.yaml build
docker compose -f pacer.yaml down
docker compose -f pacer.yaml up -d