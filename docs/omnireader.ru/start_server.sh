#!/bin/bash

sudo -H -u www-data bash -c "cd /var/www; /home/liberama/liberama" & disown
sudo service cron start
