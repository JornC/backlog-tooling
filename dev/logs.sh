#!/usr/bin/env bash
set -e

HOST="root@aeriusbacklog.nl"

ssh -o ConnectTimeout=5 "$HOST" \
  "docker logs --tail 100 -f \$(docker ps --filter label=service=backlog --filter label=role=web -q)" \
  || { echo "Could not connect to $HOST - check your SSH agent"; exit 1; }
