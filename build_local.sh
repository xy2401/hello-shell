#!/bin/bash
set -e
export CHUNK_SIZE="10M"
for ENV_NAME in empty shell powershell; do
  echo "========================================================="
  echo "Processing environment: ${ENV_NAME}"
  echo "========================================================="
  
  if [ "${ENV_NAME}" = "powershell" ]; then
    TARGET_ARCH="amd64"
  else
    TARGET_ARCH="riscv64"
  fi
  
  DEST_DIR="./docs/public/runtime/c2w"
  if [ "${ENV_NAME}" != "empty" ]; then
    DEST_DIR="./docs/public/runtime/c2w-${ENV_NAME}"
  fi
  echo "1. Building Docker image for ${TARGET_ARCH}..."
  docker buildx build --platform="linux/${TARGET_ARCH}" -f "${DEST_DIR}/Dockerfile" -t hello-shell-${ENV_NAME}:latest --load .
  
  echo "2. Converting container to WebAssembly..."
  mkdir -p ./out/${ENV_NAME}
  c2w --build-arg SOURCE_REPO=https://github.com/container2wasm/container2wasm.git --build-arg SOURCE_REPO_VERSION=v0.8.4 --target-arch="${TARGET_ARCH}" hello-shell-${ENV_NAME}:latest ./out/${ENV_NAME}/c2w-runtime.wasm
  
  echo "3. Splitting and generating manifest..."
  # Clean up old chunks first
  rm -f "${DEST_DIR}"/c2w-runtime.part_*.gz "${DEST_DIR}"/manifest.json
  node scripts/package-c2w.js --input ./out/${ENV_NAME}/c2w-runtime.wasm --dest "${DEST_DIR}" --arch "${TARGET_ARCH}" --chunk-size "${CHUNK_SIZE}"
done
