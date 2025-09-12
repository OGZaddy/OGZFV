#!/usr/bin/env bash

# Resilient reverse SSH tunnel (Desktop → VPS) for Ollama
# Run this on YOUR DESKTOP where Ollama + Qwen3 30B are running.

set -euo pipefail

# ====== CONFIG ======
VPS_USER="CHANGE_ME"         # e.g., trey
VPS_HOST="CHANGE_ME"         # e.g., vps.example.com or IP
KEY_PATH="$HOME/.ssh/ollama_tunnel"  # Path to private key used for this tunnel

REMOTE_BIND_IP="127.0.0.1"
REMOTE_PORT=11434            # On the VPS
LOCAL_PORT=11434             # On this desktop (where Ollama listens)

# ====== CHECKS ======
if ! command -v ssh >/dev/null 2>&1; then
  echo "ERROR: ssh not found in PATH" >&2
  exit 1
fi

if ! nc -z 127.0.0.1 "${LOCAL_PORT}" >/dev/null 2>&1; then
  echo "ERROR: Ollama not reachable at 127.0.0.1:${LOCAL_PORT}. Start it with: ollama serve" >&2
  exit 1
fi

if [[ "${VPS_USER}" == "CHANGE_ME" || "${VPS_HOST}" == "CHANGE_ME" ]]; then
  echo "ERROR: Please edit this script and set VPS_USER and VPS_HOST." >&2
  exit 1
fi

# ====== AUTOSSH PREFERED ======
if command -v autossh >/dev/null 2>&1; then
  export AUTOSSH_GATETIME=0
  export AUTOSSH_POLL=30
  export AUTOSSH_LOGLEVEL=0
  echo "Starting autossh reverse tunnel to ${VPS_USER}@${VPS_HOST} ..."
  exec autossh -M 0 -N -T \
    -i "${KEY_PATH}" \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    -o TCPKeepAlive=yes \
    -o StrictHostKeyChecking=yes \
    -R "${REMOTE_BIND_IP}:${REMOTE_PORT}:127.0.0.1:${LOCAL_PORT}" \
    "${VPS_USER}@${VPS_HOST}"
fi

# ====== FALLBACK TO PLAIN SSH ======
echo "autossh not found. Falling back to plain ssh (no auto-reconnect)."
exec ssh -N -T \
  -i "${KEY_PATH}" \
  -o ExitOnForwardFailure=yes \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -o TCPKeepAlive=yes \
  -o StrictHostKeyChecking=yes \
  -R "${REMOTE_BIND_IP}:${REMOTE_PORT}:127.0.0.1:${LOCAL_PORT}" \
  "${VPS_USER}@${VPS_HOST}"

