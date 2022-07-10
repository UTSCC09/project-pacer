set -e
set -u
docker compose -f pacer.yaml down --rmi=all --volumes --remove-orphans