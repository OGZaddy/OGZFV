#!/bin/bash

# ==========================================
# DESKTOP TUNNEL SETUP - CodeLlama 70B Bridge
# ==========================================
# Run this script ON YOUR DESKTOP to connect CodeLlama to VPS

echo "🔥 OGZFV Desktop-to-VPS CodeLlama Bridge Setup"
echo "=============================================="
echo ""

# Check if Ollama is running
echo "Checking Ollama status on desktop..."
if ! pgrep -f "ollama" > /dev/null; then
    echo "❌ Ollama not running. Please start Ollama first."
    echo "Run: ollama serve"
    exit 1
fi

# Check if CodeLlama 70B is available
echo "Checking CodeLlama 70B model..."
if ! ollama list | grep -q "codellama:70b"; then
    echo "❌ CodeLlama 70B not found. Please pull the model first."
    echo "Run: ollama pull codellama:70b-instruct-q4_K_M"
    exit 1
fi

echo "✅ Ollama and CodeLlama 70B ready"
echo ""

# Create the SSH tunnel
echo "Creating SSH tunnel to VPS (149.248.242.111)..."
echo "This will forward VPS port 11434 to your local Ollama (127.0.0.1:11434)"
echo ""
echo "🚀 Starting SSH tunnel..."
echo "Keep this terminal open for Trai to access your CodeLlama 70B!"
echo ""

# SSH tunnel command
ssh -o StrictHostKeyChecking=no -R 11434:127.0.0.1:11434 root@149.248.242.111 -N -v

echo "SSH tunnel closed."