#!/bin/bash

sudo -H -u www-data bash -c "\
while true; do\
  trap '' 2;\
  cd /var/www;\
  /home/liberama/liberama;\
  trap 2;\
  echo \"Restart after 5 sec. Press Ctrl+C to exit.\";\
  sleep 5;\
done;"
