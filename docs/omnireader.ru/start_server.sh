#!/bin/bash

sudo -H -u www-data /home/liberama/liberama &
sudo service cron start
