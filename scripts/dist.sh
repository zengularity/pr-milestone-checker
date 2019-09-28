#! /bin/sh

set -e

DIR=`dirname $0`

cd "$DIR/.."

tar -czvf app.tgz app.yml lib/ package-lock.json package.json
