sudo bash

mkdir /home/liberama
chown www-data /home/liberama
chgrp www-data /home/liberama

apt install nginx

cp omnireader /etc/nginx/sites-available/omnireader
ln -s /etc/nginx/sites-available/omnireader /etc/nginx/sites-enabled/omnireader
rm /etc/nginx/sites-enabled/default
service nginx reload

exit

