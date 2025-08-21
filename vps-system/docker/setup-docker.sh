#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  OGZ Prime Docker Setup Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root${NC}" 
   exit 1
fi

# Function to install Docker
install_docker() {
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Install Docker Compose
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Start Docker service
    systemctl start docker
    systemctl enable docker
    
    echo -e "${GREEN}Docker installed successfully!${NC}"
}

# Function to install Supabase CLI
install_supabase() {
    echo -e "${YELLOW}Installing Supabase CLI...${NC}"
    curl -L https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar xz
    mv supabase /usr/local/bin/
    chmod +x /usr/local/bin/supabase
    echo -e "${GREEN}Supabase CLI installed!${NC}"
}

# Function to generate secure passwords
generate_passwords() {
    echo -e "${YELLOW}Generating secure passwords...${NC}"
    
    # Generate random passwords
    POSTGRES_PASS=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 45)
    REDIS_PASS=$(openssl rand -base64 24)
    GRAFANA_PASS=$(openssl rand -base64 16)
    
    # Update .env.docker file
    cp .env.docker .env
    sed -i "s/your-super-secret-password-change-this/$POSTGRES_PASS/g" .env
    sed -i "s/your-super-secret-jwt-token-with-at-least-32-characters-long-change-this/$JWT_SECRET/g" .env
    sed -i "s/your-redis-password-change-this/$REDIS_PASS/g" .env
    sed -i "s/admin-change-this/$GRAFANA_PASS/g" .env
    
    echo -e "${GREEN}Passwords generated and saved to .env${NC}"
    echo -e "${YELLOW}IMPORTANT: Save these credentials:${NC}"
    echo "Grafana Admin Password: $GRAFANA_PASS"
    echo "Database Password: $POSTGRES_PASS"
}

# Function to setup firewall rules
setup_firewall() {
    echo -e "${YELLOW}Setting up firewall rules...${NC}"
    
    # Install ufw if not present
    apt-get update && apt-get install -y ufw
    
    # Allow SSH
    ufw allow 22/tcp
    
    # Allow Docker ports
    ufw allow 3010/tcp  # Quantum Bot WebSocket
    ufw allow 3011/tcp  # Elite Bot WebSocket
    ufw allow 8080/tcp  # Dashboard
    ufw allow 3000/tcp  # Grafana
    ufw allow 7000/tcp  # Archon
    
    # Enable firewall
    echo "y" | ufw enable
    
    echo -e "${GREEN}Firewall configured!${NC}"
}

# Function to create SSL certificates
setup_ssl() {
    echo -e "${YELLOW}Setting up SSL certificates...${NC}"
    
    # Install certbot
    apt-get update && apt-get install -y certbot
    
    # Create self-signed certificate for now
    mkdir -p /etc/ssl/trading
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/trading/private.key \
        -out /etc/ssl/trading/certificate.crt \
        -subj "/C=US/ST=State/L=City/O=OGZPrime/CN=149.248.242.111"
    
    echo -e "${GREEN}SSL certificates created!${NC}"
}

# Main installation flow
echo -e "${YELLOW}Starting installation...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    install_docker
else
    echo -e "${GREEN}Docker already installed${NC}"
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    install_supabase
else
    echo -e "${GREEN}Supabase CLI already installed${NC}"
fi

# Generate passwords if .env doesn't exist
if [ ! -f .env ]; then
    generate_passwords
else
    echo -e "${YELLOW}Using existing .env file${NC}"
fi

# Setup firewall
read -p "Setup firewall rules? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    setup_firewall
fi

# Setup SSL
read -p "Setup SSL certificates? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    setup_ssl
fi

# Build and start containers
echo -e "${YELLOW}Building Docker containers...${NC}"
docker-compose build

echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to initialize...${NC}"
sleep 30

# Check service status
echo -e "${YELLOW}Checking service status...${NC}"
docker-compose ps

# Display access information
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "Access your services at:"
echo -e "  Dashboard: ${GREEN}http://149.248.242.111:8080${NC}"
echo -e "  Grafana: ${GREEN}http://149.248.242.111:3000${NC}"
echo -e "  Archon: ${GREEN}http://149.248.242.111:7000${NC}"
echo -e ""
echo -e "WebSocket Endpoints:"
echo -e "  Quantum Bot: ${GREEN}ws://149.248.242.111:3010${NC}"
echo -e "  Elite Bot: ${GREEN}ws://149.248.242.111:3011${NC}"
echo -e ""
echo -e "Database Connection:"
echo -e "  Host: ${GREEN}149.248.242.111${NC}"
echo -e "  Port: ${GREEN}5432${NC}"
echo -e "  Database: ${GREEN}postgres${NC}"
echo -e ""
echo -e "${YELLOW}Run 'docker-compose logs -f' to view logs${NC}"
echo -e "${YELLOW}Run 'docker-compose down' to stop all services${NC}"