#!/bin/bash

npm run build:linux
sudo -u www-data cp -r ../../dist/linux/* /home/liberama
