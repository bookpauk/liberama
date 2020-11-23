#!/bin/bash

sudo -H -u www-data bash -c "cd /var/www; /home/liberama/liberama" &
sudo service cron start
