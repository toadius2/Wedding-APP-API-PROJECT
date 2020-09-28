#!/usr/bin/env bash
rm -rf .uploads && rm -rf .downloads
for D in `find local_modules/ -type d -maxdepth 1 -mindepth 1`
do
    tsc -p $D
done
tsc -p . && npm run zip && eb deploy && rm out.zip
