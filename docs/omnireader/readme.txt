sudo bash

mkdir /home/liberama
chown www-data /home/liberama
chgrp www-data /home/liberama

### oldreader
# ubuntu 18
apt install php7.2 php7.2-curl php7.2-mbstring php7.2-fpm
service php7.2-fpm restart

mkdir /home/oldreader
chown www-data /home/oldreader
chgrp www-data /home/oldreader
sudo -u www-data cp -r ./old/* /home/oldreader
###

apt install nginx

cp omnireader /etc/nginx/sites-available/omnireader
ln -s /etc/nginx/sites-available/omnireader /etc/nginx/sites-enabled/omnireader
rm /etc/nginx/sites-enabled/default
service nginx reload

exit

