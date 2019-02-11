sudo bash

apt install nginx

cp omnireader /etc/nginx/sites-available/omnireader
ln -s /etc/nginx/sites-available/omnireader /etc/nginx/sites-enabled/omnireader
rm /etc/nginx/sites-enabled/default
service nginx reload

mkdir /var/www/omnireader
chown www-data /var/www/omnireader
chgrp www-data /var/www/omnireader

exit

