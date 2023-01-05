# Запуск Liberama в контейнере

## Сборка

1. Клонируем репозиторий на целевую машину
```bash
git clone https://github.com/bookpauk/liberama.git
```
2. Собираем образ контейнера
```bash
docker build -t liberama:1.0.0 .
```
## Запуск
Для корректной работы **Liberama** после перезапуска контейнера необходимо при запуске отобразить папки с базой данных и загруженными файлами на папки хоста, например:
```bash
docker run -d -p 127.0.0.1:8090:80 -v /path/to/upload/files:/app/public-files -v /path/to/db:/app/db liberama:1.0.0
```
## Настройка nginx
```conf
server {

       # Указываем реальный URL сервера
       server_name liberama.example.com;

       client_max_body_size 50m;

       root /var/www;
       index index.html;

       location / {
		# Указываем порт, использованный при запуске контейнера
        proxy_pass http://localhost:8090;
		proxy_set_header Host $host;
       }
         location /ws {
            # Указываем порт, использованный при запуске контейнера
            proxy_pass http://localhost:8090;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
       }


    listen 80;
}
```
