## Разворачивание сервера OmniReader в Ubuntu:

### git, clone
```
sudo apt install ssh git
git clone https://github.com/bookpauk/liberama
```

### node.js
```
sudo apt install -y curl
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt install -y nodejs
```

### install packages
```
cd liberama
npm i
```

### create public dir
```
sudo mkdir /home/liberama
sudo chown www-data.www-data /home/liberama
```

### external converter `calibre`, download from https://download.calibre-ebook.com/
```
wget "https://download.calibre-ebook.com/5.5.0/calibre-5.5.0-x86_64.txz"
sudo -u www-data mkdir -p /home/liberama/data/calibre
sudo -u www-data tar xvf calibre-5.5.0-x86_64.txz -C /home/liberama/data/calibre
```

### external converters
```
sudo apt install libreoffice
sudo apt install poppler-utils
```

### nginx, server config
Для своего домена необходимо будет подправить docs/omnireader.ru/omnireader.
Можно также настроить сервер для HTTP, без SSL.
```
sudo apt install nginx
sudo cp docs/omnireader.ru/omnireader /etc/nginx/sites-available/omnireader
sudo ln -s /etc/nginx/sites-available/omnireader /etc/nginx/sites-enabled/omnireader
sudo rm /etc/nginx/sites-enabled/default
sudo service nginx reload
sudo chown -R www-data.www-data /var/www
```

### certbot
Следовать инструкции установки certbot https://certbot.eff.org/lets-encrypt/ubuntubionic-nginx
### old.omnireader 
```
sudo apt install php7.2 php7.2-curl php7.2-mbstring php7.2-fpm
sudo service php7.2-fpm restart

sudo mkdir /home/oldreader
sudo chown www-data.www-data /home/oldreader
sudo -u www-data cp -r docs/omnireader.ru/old/* /home/oldreader
```

## Запуск по крону
```
* * * * * /root/liberama/docs/omnireader.ru/cron_server.sh
```

## Деплой и запуск
```
cd docs/omnireader.ru
./stop_server.sh
./deploy.sh
./start_server.sh
```

После первого запуска будет создан конфигурационный файл `/home/liberama/data/config.json`.
Необходимо переключить приложение в режим `omnireader`, отредактировав опцию `servers`:
```
    "servers": [
        {
            "serverName": "1",
            "mode": "omnireader",
            "ip": "0.0.0.0",
            "port": "44081"
        }
    ]
```
и перезапустить сервер