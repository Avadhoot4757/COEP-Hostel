#!/bin/bash

# Paths
PROJECT_NAME=COEP-Hostel
USER=avadhootsghewade4757
BASE_DIR=/home/$USER/COEP-Hostel
BACKEND_DIR=$BASE_DIR/backend
FRONTEND_DIR=$BASE_DIR/frontend
GUNICORN_SOCKET=/run/gunicorn.sock
DOMAIN_OR_IP=34.47.203.13

echo "Updating system & installing packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv nginx nodejs npm -y

echo "Setting up virtualenv for Django..."
cd $BACKEND_DIR
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Migrating DB..."
python manage.py migrate

echo "Setting up Gunicorn socket & service..."
sudo tee /etc/systemd/system/gunicorn.socket > /dev/null <<EOF
[Unit]
Description=gunicorn socket

[Socket]
ListenStream=$GUNICORN_SOCKET

[Install]
WantedBy=sockets.target
EOF

sudo tee /etc/systemd/system/gunicorn.service > /dev/null <<EOF
[Unit]
Description=gunicorn daemon
Requires=gunicorn.socket
After=network.target

[Service]
User=$USER
Group=www-data
WorkingDirectory=$BACKEND_DIR
ExecStart=$BACKEND_DIR/env/bin/gunicorn --access-logfile - --workers 3 --bind unix:$GUNICORN_SOCKET backend.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

echo "Starting Gunicorn..."
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
sudo systemctl start gunicorn.socket
sudo systemctl enable gunicorn.socket

echo "Building frontend..."
cd $FRONTEND_DIR
npm install
npm run build

echo "Running frontend via PM2 (standalone output)..."
sudo npm install -g pm2
pm2 delete frontend || true
pm2 start "node .next/standalone/server.js" --name frontend
pm2 save
pm2 startup systemd
sudo env PATH=$PATH:/home/$USER/.nvm/versions/node/*/bin pm2 startup systemd -u $USER --hp /home/$USER

echo "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/$PROJECT_NAME > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location = /favicon.ico { access_log off; log_not_found off; }

    location /static/ {
        alias $BACKEND_DIR/staticfiles/;
    }

    location /media/ {
        alias $BACKEND_DIR/media/;
    }

    location /api/ {
        include proxy_params;
        proxy_pass http://unix:$GUNICORN_SOCKET;
        proxy_set_header Host \$host;
        proxy_set_header Authorization \$http_authorization;
        proxy_pass_request_headers on;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_pass_request_headers on;
        proxy_set_header Authorization \$http_authorization;
    }
}
EOF

echo "Enabling Nginx config..."
sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

echo "Deployment complete!"
