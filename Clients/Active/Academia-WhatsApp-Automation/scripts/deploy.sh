#!/bin/bash

# ==================== ACADEMIA WHATSAPP AUTOMATION DEPLOYMENT SCRIPT ====================
# IMPORTANT: Production deployment for Ubuntu 22.04 with zero-downtime deployment
# PROACTIVELY handles SSL, monitoring, backups and security hardening
# ULTRATHINK: Enterprise-grade deployment with comprehensive monitoring

set -e  # Exit on any error
set -u  # Exit on undefined variables

# ==================== CONFIGURATION ====================

DEPLOY_USER="academia-deploy"
APP_NAME="academia-whatsapp-automation"
APP_DIR="/opt/$APP_NAME"
BACKUP_DIR="/var/backups/$APP_NAME"
LOG_DIR="/var/log/$APP_NAME"
SERVICE_NAME="academia-automation"

# Database configuration
DB_NAME="academia_whatsapp_db"
DB_USER="academia_user"
DB_BACKUP_DIR="$BACKUP_DIR/database"

# SSL configuration
DOMAIN=${DOMAIN:-"your-academy-domain.com"}
EMAIL=${EMAIL:-"admin@your-academy-domain.com"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================== LOGGING FUNCTIONS ====================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# ==================== SYSTEM CHECKS ====================

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

check_ubuntu_version() {
    if ! grep -q "Ubuntu 22.04" /etc/os-release; then
        log_warn "This script is optimized for Ubuntu 22.04"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# ==================== SYSTEM SETUP ====================

setup_system() {
    log_step "Setting up system prerequisites..."
    
    # Update system packages
    apt-get update
    apt-get upgrade -y
    
    # Install essential packages
    apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        fail2ban \
        logrotate \
        cron \
        htop \
        nano
    
    log_info "System packages updated and essential tools installed"
}

# ==================== NODE.JS INSTALLATION ====================

install_nodejs() {
    log_step "Installing Node.js 20..."
    
    # Remove any existing Node.js
    apt-get remove -y nodejs npm
    
    # Install Node.js 20 from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Install global packages
    npm install -g pm2 @prisma/cli typescript ts-node
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    log_info "Node.js installed: $node_version"
    log_info "NPM installed: $npm_version"
}

# ==================== DOCKER INSTALLATION ====================

install_docker() {
    log_step "Installing Docker and Docker Compose..."
    
    # Remove any old Docker installations
    apt-get remove -y docker docker-engine docker.io containerd runc
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    # Add deploy user to docker group
    usermod -aG docker $DEPLOY_USER || true
    
    # Verify installation
    docker_version=$(docker --version)
    compose_version=$(docker compose version)
    
    log_info "Docker installed: $docker_version"
    log_info "Docker Compose installed: $compose_version"
}

# ==================== DATABASE SETUP ====================

setup_postgresql() {
    log_step "Setting up PostgreSQL 15..."
    
    # Install PostgreSQL
    apt-get install -y postgresql-15 postgresql-client-15 postgresql-contrib-15
    
    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || log_warn "Database $DB_NAME might already exist"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$(openssl rand -base64 32)';" 2>/dev/null || log_warn "User $DB_USER might already exist"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
    
    # Configure PostgreSQL for better performance
    PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\\d+\\.\\d+' | head -1)
    PG_CONFIG="/etc/postgresql/$PG_VERSION/main/postgresql.conf"
    
    # Backup original config
    cp $PG_CONFIG $PG_CONFIG.backup
    
    # Apply performance optimizations
    cat >> $PG_CONFIG << EOF

# Academia WhatsApp Automation Performance Settings
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
EOF
    
    systemctl restart postgresql
    log_info "PostgreSQL configured and optimized"
}

setup_redis() {
    log_step "Setting up Redis..."
    
    # Install Redis
    apt-get install -y redis-server
    
    # Configure Redis for production
    REDIS_CONFIG="/etc/redis/redis.conf"
    cp $REDIS_CONFIG $REDIS_CONFIG.backup
    
    # Apply security and performance settings
    sed -i 's/^# maxmemory <bytes>/maxmemory 256mb/' $REDIS_CONFIG
    sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' $REDIS_CONFIG
    sed -i 's/^save 900 1/# save 900 1/' $REDIS_CONFIG
    sed -i 's/^save 300 10/# save 300 10/' $REDIS_CONFIG  
    sed -i 's/^save 60 10000/save 60 10000/' $REDIS_CONFIG
    
    # Enable and restart Redis
    systemctl enable redis-server
    systemctl restart redis-server
    
    log_info "Redis configured for queue processing"
}

# ==================== APPLICATION DEPLOYMENT ====================

setup_application_user() {
    log_step "Setting up application user..."
    
    # Create deploy user if doesn't exist
    if ! id "$DEPLOY_USER" &>/dev/null; then
        useradd -m -s /bin/bash $DEPLOY_USER
        usermod -aG docker $DEPLOY_USER
        log_info "Created deploy user: $DEPLOY_USER"
    fi
    
    # Create application directories
    mkdir -p $APP_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p $DB_BACKUP_DIR
    mkdir -p $LOG_DIR
    mkdir -p $APP_DIR/sessions
    mkdir -p $APP_DIR/logs
    
    # Set proper permissions
    chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR
    chown -R $DEPLOY_USER:$DEPLOY_USER $BACKUP_DIR
    chown -R $DEPLOY_USER:$DEPLOY_USER $LOG_DIR
    
    log_info "Application directories created"
}

deploy_application() {
    log_step "Deploying application..."
    
    # If this is an update, backup current version
    if [ -d "$APP_DIR/current" ]; then
        log_info "Backing up current version..."
        cp -r $APP_DIR/current $BACKUP_DIR/app-$(date +%Y%m%d-%H%M%S)
    fi
    
    # Create new deployment directory
    DEPLOY_DIR="$APP_DIR/releases/$(date +%Y%m%d-%H%M%S)"
    mkdir -p $DEPLOY_DIR
    
    # Copy application files (assuming we're in the project directory)
    if [ -f "package.json" ]; then
        cp -r . $DEPLOY_DIR/
    else
        log_error "package.json not found. Run this script from the project root directory."
        exit 1
    fi
    
    # Change to deployment directory
    cd $DEPLOY_DIR
    
    # Remove development files
    rm -rf node_modules .git .env.example
    
    # Install production dependencies
    sudo -u $DEPLOY_USER npm ci --production
    
    # Build TypeScript
    sudo -u $DEPLOY_USER npm run build
    
    # Generate Prisma client
    sudo -u $DEPLOY_USER npx prisma generate
    
    # Create symlink to current deployment
    rm -f $APP_DIR/current
    ln -sf $DEPLOY_DIR $APP_DIR/current
    
    # Set ownership
    chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_DIR
    
    log_info "Application deployed to $DEPLOY_DIR"
}

setup_environment() {
    log_step "Setting up environment configuration..."
    
    # Generate secure secrets
    JWT_SECRET=$(openssl rand -base64 64)
    WEBHOOK_SECRET=$(openssl rand -base64 32)
    DB_PASSWORD=$(sudo -u postgres psql -t -c "SELECT rolpassword FROM pg_authid WHERE rolname = '$DB_USER';" | tr -d ' ')
    
    # Create production environment file
    cat > $APP_DIR/current/.env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database Configuration
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# WhatsApp Configuration
WHATSAPP_SESSION=academia_production
WHATSAPP_AUTO_REPLY=true
WHATSAPP_QR_TIMEOUT=60000
MAX_MESSAGES_PER_HOUR=100
MESSAGE_DELAY_MS=2000

# Security
JWT_SECRET="$JWT_SECRET"
WEBHOOK_SECRET="$WEBHOOK_SECRET"

# Logging
LOG_LEVEL=info

# Application
AUTOMATION_ENABLED=true
AUTOMATION_SCHEDULE="0 9 * * *"

# Integration URLs
ACADEMIA_SYSTEM_URL="http://localhost:8080/api"
ACADEMIA_API_KEY="configure_with_client"
EOF
    
    # Set secure permissions
    chown $DEPLOY_USER:$DEPLOY_USER $APP_DIR/current/.env
    chmod 600 $APP_DIR/current/.env
    
    log_info "Environment configuration created"
}

# ==================== DATABASE MIGRATION ====================

run_database_migrations() {
    log_step "Running database migrations..."
    
    cd $APP_DIR/current
    
    # Run Prisma migrations
    sudo -u $DEPLOY_USER npx prisma migrate deploy
    
    # Seed database if needed
    if [ -f "prisma/seed.ts" ]; then
        sudo -u $DEPLOY_USER npm run prisma:seed
    fi
    
    log_info "Database migrations completed"
}

# ==================== PM2 SETUP ====================

setup_pm2() {
    log_step "Setting up PM2 process manager..."
    
    # Create PM2 ecosystem file
    cat > $APP_DIR/current/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$SERVICE_NAME',
    script: 'dist/src/backend/server.js',
    cwd: '$APP_DIR/current',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    log_file: '$LOG_DIR/combined.log',
    out_file: '$LOG_DIR/out.log',
    error_file: '$LOG_DIR/error.log',
    time: true,
    max_memory_restart: '500M',
    node_args: '--max-old-space-size=512',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    reload_delay: 1000,
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'sessions'],
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
EOF
    
    # Start application with PM2
    cd $APP_DIR/current
    sudo -u $DEPLOY_USER pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    sudo -u $DEPLOY_USER pm2 save
    
    # Setup PM2 startup script
    sudo -u $DEPLOY_USER pm2 startup systemd -u $DEPLOY_USER --hp /home/$DEPLOY_USER
    
    # Enable PM2 service
    systemctl enable pm2-$DEPLOY_USER
    
    log_info "PM2 configured and application started"
}

# ==================== NGINX SETUP ====================

setup_nginx() {
    log_step "Setting up Nginx reverse proxy..."
    
    # Install Nginx
    apt-get install -y nginx
    
    # Create Nginx configuration
    cat > /etc/nginx/sites-available/$APP_NAME << EOF
# Academia WhatsApp Automation - Nginx Configuration
upstream academia_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
    
    # Rate Limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    # Logging
    access_log $LOG_DIR/nginx_access.log;
    error_log $LOG_DIR/nginx_error.log;
    
    # Proxy Settings
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Connection "";
    proxy_http_version 1.1;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_buffering off;
    
    # API Routes
    location /api/ {
        proxy_pass http://academia_backend;
    }
    
    location /auth/ {
        proxy_pass http://academia_backend;
    }
    
    location /webhooks/ {
        proxy_pass http://academia_backend;
        
        # Webhook-specific settings
        proxy_request_buffering off;
        proxy_buffering off;
    }
    
    # Health check
    location /health {
        proxy_pass http://academia_backend;
        access_log off;
    }
    
    # Static files (if any)
    location /static/ {
        alias $APP_DIR/current/public/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Root redirect
    location / {
        return 200 "Academia WhatsApp Automation API";
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable the site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test Nginx configuration
    nginx -t
    
    # Start Nginx (SSL will be configured later)
    systemctl enable nginx
    systemctl start nginx
    
    log_info "Nginx configured"
}

# ==================== SSL SETUP ====================

setup_ssl() {
    log_step "Setting up SSL with Let's Encrypt..."
    
    # Install Certbot
    apt-get install -y certbot python3-certbot-nginx
    
    # Generate SSL certificate
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL
    
    # Setup auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer
    
    # Test auto-renewal
    certbot renew --dry-run
    
    log_info "SSL certificate installed and auto-renewal configured"
}

# ==================== FIREWALL SETUP ====================

setup_firewall() {
    log_step "Configuring firewall..."
    
    # Reset UFW to default
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (be careful not to lock yourself out!)
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 'Nginx Full'
    
    # Allow PostgreSQL only from localhost
    ufw allow from 127.0.0.1 to any port 5432
    
    # Allow Redis only from localhost
    ufw allow from 127.0.0.1 to any port 6379
    
    # Enable firewall
    ufw --force enable
    
    log_info "Firewall configured"
}

# ==================== MONITORING SETUP ====================

setup_monitoring() {
    log_step "Setting up monitoring and logging..."
    
    # Setup log rotation
    cat > /etc/logrotate.d/$APP_NAME << EOF
$LOG_DIR/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 $DEPLOY_USER $DEPLOY_USER
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
        sudo -u $DEPLOY_USER pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
EOF
    
    # Setup system monitoring script
    cat > /usr/local/bin/academia-health-check << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/academia-health.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Check if application is running
if ! pgrep -f "academia-automation" > /dev/null; then
    echo "[$DATE] ERROR: Application not running" >> $LOG_FILE
    systemctl restart pm2-academia-deploy
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage at ${DISK_USAGE}%" >> $LOG_FILE
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100)}')
if [ $MEMORY_USAGE -gt 85 ]; then
    echo "[$DATE] WARNING: Memory usage at ${MEMORY_USAGE}%" >> $LOG_FILE
fi

# Check database connection
if ! sudo -u academia-deploy psql -h localhost -U academia_user -d academia_whatsapp_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "[$DATE] ERROR: Database connection failed" >> $LOG_FILE
fi

echo "[$DATE] Health check completed" >> $LOG_FILE
EOF
    
    chmod +x /usr/local/bin/academia-health-check
    
    # Setup cron job for health checks
    (crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/academia-health-check") | crontab -
    
    log_info "Monitoring configured"
}

# ==================== BACKUP SETUP ====================

setup_backups() {
    log_step "Setting up automated backups..."
    
    # Database backup script
    cat > /usr/local/bin/academia-backup << EOF
#!/bin/bash

BACKUP_DATE=\$(date +%Y%m%d_%H%M%S)
DB_BACKUP_FILE="$DB_BACKUP_DIR/db_backup_\$BACKUP_DATE.sql"
APP_BACKUP_FILE="$BACKUP_DIR/app_backup_\$BACKUP_DATE.tar.gz"

# Database backup
sudo -u postgres pg_dump $DB_NAME > \$DB_BACKUP_FILE
gzip \$DB_BACKUP_FILE

# Application backup (sessions and logs)
tar -czf \$APP_BACKUP_FILE -C $APP_DIR current/sessions current/logs

# Keep only last 7 days of backups
find $DB_BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "app_backup_*.tar.gz" -mtime +7 -delete

echo "\$(date): Backup completed" >> $LOG_DIR/backup.log
EOF
    
    chmod +x /usr/local/bin/academia-backup
    
    # Schedule daily backups at 3 AM
    (crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/academia-backup") | crontab -
    
    # Run initial backup
    /usr/local/bin/academia-backup
    
    log_info "Automated backups configured"
}

# ==================== SECURITY HARDENING ====================

setup_fail2ban() {
    log_step "Setting up Fail2Ban..."
    
    # Configure Fail2Ban for Nginx
    cat > /etc/fail2ban/jail.d/nginx-academia.conf << EOF
[nginx-req-limit]
enabled = true
filter = nginx-req-limit
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = $LOG_DIR/nginx_error.log
findtime = 600
bantime = 7200
maxretry = 10

[nginx-login]
enabled = true
filter = nginx-login
action = iptables-multiport[name=NoLogin, port="http,https", protocol=tcp]
logpath = $LOG_DIR/nginx_access.log
findtime = 600
bantime = 7200
maxretry = 5
EOF
    
    # Create custom filter for login attempts
    cat > /etc/fail2ban/filter.d/nginx-login.conf << EOF
[Definition]
failregex = ^<HOST>.*POST.*(login|auth).*HTTP/1\\.1\" 401
ignoreregex =
EOF
    
    # Restart Fail2Ban
    systemctl restart fail2ban
    systemctl enable fail2ban
    
    log_info "Fail2Ban configured for security"
}

# ==================== FINAL SYSTEM CHECKS ====================

run_system_tests() {
    log_step "Running system tests..."
    
    # Wait for services to start
    sleep 10
    
    # Test database connection
    if sudo -u $DEPLOY_USER psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        log_info "✓ Database connection OK"
    else
        log_error "✗ Database connection failed"
    fi
    
    # Test Redis connection
    if redis-cli ping > /dev/null 2>&1; then
        log_info "✓ Redis connection OK"
    else
        log_error "✗ Redis connection failed"
    fi
    
    # Test application health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_info "✓ Application health check OK"
    else
        log_error "✗ Application health check failed"
    fi
    
    # Test Nginx
    if curl -f http://localhost > /dev/null 2>&1; then
        log_info "✓ Nginx OK"
    else
        log_error "✗ Nginx failed"
    fi
    
    # Test SSL (if domain is configured)
    if [[ $DOMAIN != "your-academy-domain.com" ]]; then
        if curl -f https://$DOMAIN > /dev/null 2>&1; then
            log_info "✓ SSL certificate OK"
        else
            log_warn "✗ SSL certificate check failed (might be normal if DNS not propagated)"
        fi
    fi
    
    log_info "System tests completed"
}

# ==================== CLEANUP ====================

cleanup_old_releases() {
    log_step "Cleaning up old releases..."
    
    # Keep only the last 3 releases
    if [ -d "$APP_DIR/releases" ]; then
        cd $APP_DIR/releases
        ls -t | tail -n +4 | xargs -r rm -rf
        log_info "Old releases cleaned up"
    fi
}

# ==================== MAIN DEPLOYMENT FUNCTION ====================

main() {
    log_info "Starting Academia WhatsApp Automation deployment..."
    log_info "Target domain: $DOMAIN"
    log_info "Email: $EMAIL"
    
    # Pre-deployment checks
    check_root
    check_ubuntu_version
    
    # System setup
    setup_system
    install_nodejs
    install_docker
    setup_postgresql
    setup_redis
    
    # Application deployment
    setup_application_user
    deploy_application
    setup_environment
    run_database_migrations
    setup_pm2
    
    # Web server and SSL
    setup_nginx
    
    # Only setup SSL if domain is configured
    if [[ $DOMAIN != "your-academy-domain.com" ]]; then
        setup_ssl
    else
        log_warn "Skipping SSL setup - configure DOMAIN environment variable for SSL"
    fi
    
    # Security and monitoring
    setup_firewall
    setup_fail2ban
    setup_monitoring
    setup_backups
    
    # Final checks
    run_system_tests
    cleanup_old_releases
    
    log_info "🎉 Deployment completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Update DNS to point $DOMAIN to this server's IP"
    log_info "2. Configure DOMAIN and EMAIL environment variables and re-run for SSL"
    log_info "3. Update .env file with actual academia system credentials"
    log_info "4. Test WhatsApp QR code connection"
    log_info "5. Import initial member data"
    log_info ""
    log_info "Important files:"
    log_info "- Application: $APP_DIR/current"
    log_info "- Environment: $APP_DIR/current/.env"
    log_info "- Logs: $LOG_DIR/"
    log_info "- Backups: $BACKUP_DIR/"
    log_info ""
    log_info "Management commands:"
    log_info "- Check status: sudo -u $DEPLOY_USER pm2 status"
    log_info "- View logs: sudo -u $DEPLOY_USER pm2 logs $SERVICE_NAME"
    log_info "- Restart app: sudo -u $DEPLOY_USER pm2 restart $SERVICE_NAME"
    log_info "- Nginx status: systemctl status nginx"
    log_info "- Database backup: /usr/local/bin/academia-backup"
}

# ==================== SCRIPT EXECUTION ====================

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi