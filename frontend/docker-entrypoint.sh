#!/bin/sh
set -ex

yarn install

if [ "${BUILD_OUTPUT#-}" = "${BUILD_OUTPUT}" ]; then
  yarn build &&
  rm -rf "${BUILD_OUTPUT}" &&
  cp -r build "${BUILD_OUTPUT}"
fi

if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ]; then
  set -- yarn "$@"
fi

exec "$@"
