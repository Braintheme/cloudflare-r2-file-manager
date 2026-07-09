server {
    listen 80;
    listen 443 ssl http2;
    server_name dl.presets-adobe.com;

    ssl_certificate     /etc/nginx/ssl/origin.crt;
    ssl_certificate_key /etc/nginx/ssl/origin.key;

    # Public download, no auth. The /download prefix is dropped from the URL:
    # dl.presets-adobe.com/<key>  ->  app /download/<key>
    location / {
        proxy_pass http://127.0.0.1:3005/download/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
