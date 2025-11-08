#!/bin/bash

# Script para aplicar regras CORS ao Firebase Storage
# Execute com: bash aplicar-cors.sh

echo "🔧 Aplicando regras CORS ao Firebase Storage..."
echo ""

# Verifica se gsutil está instalado
if ! command -v gsutil &> /dev/null
then
    echo "❌ gsutil não encontrado!"
    echo ""
    echo "Por favor, instale o Google Cloud SDK:"
    echo "https://cloud.google.com/sdk/docs/install"
    echo ""
    exit 1
fi

# Verifica se o arquivo cors.json existe
if [ ! -f "cors.json" ]; then
    echo "❌ Arquivo cors.json não encontrado!"
    exit 1
fi

echo "📋 Conteúdo do cors.json:"
cat cors.json
echo ""

# Aplica as regras CORS
echo "🚀 Aplicando regras CORS ao bucket gs://app-hinos.appspot.com..."
gsutil cors set cors.json gs://app-hinos.appspot.com

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Regras CORS aplicadas com sucesso!"
    echo ""
    echo "📋 Verificando as regras aplicadas:"
    gsutil cors get gs://app-hinos.appspot.com
    echo ""
    echo "✨ Pronto! Aguarde 2-3 minutos e teste novamente."
else
    echo ""
    echo "❌ Erro ao aplicar regras CORS."
    echo "Verifique se você está autenticado com:"
    echo "  gcloud auth login"
    echo "  gcloud config set project app-hinos"
fi
