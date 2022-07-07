#!/bin/bash

if ! pgrep -x "liberama" > /dev/null ; then
    sudo -H -u www-data bash -c "cd /var/www; /home/liberama/liberama >/dev/null"
else
    echo "Process 'liberama' already running"
fi

