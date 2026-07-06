server {
    listen 80;
    listen 443 ssl http2;
    server_name storage.presets-adobe.com;

    ssl_certificate     /etc/nginx/ssl/origin.crt;
    ssl_certificate_key /etc/nginx/ssl/origin.key;

    client_max_body_size 2048m;

    # Whole admin UI is behind HTTP Basic Auth
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd_storage;

    location / {
        proxy_pass http://127.0.0.1:3005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
