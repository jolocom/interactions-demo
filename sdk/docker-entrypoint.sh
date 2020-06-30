#!/bin/sh
set -e

# check if command exists, otherwise consider it a yarn command
if [ "${1#-}" != "${1}" ] || [ -z "$(command -v "${1}")" ]; then
  set -- yarn "$@"
fi

# make sure npm dependencies are up to date and then execute the command
yarn install && exec "$@"
