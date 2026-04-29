#!/bin/bash

echo "⚠️ Derrubando containers..."

sudo rm -rf ./database/mysql/data

# echo "🧹 Subindo tudo limpo..."

# docker compose up -d

echo "✅ Banco resetado do zero"