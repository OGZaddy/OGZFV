# Create /root/OGZFV-valhalla/ai-assistant.sh
cat > /root/OGZFV-valhalla/ai-assistant.sh << 'EOF'
#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🤖 OGZ Local AI Assistant (FREE - No API Costs!)${NC}"
echo -e "${GREEN}Type your coding questions. Type 'exit' to quit.${NC}"
echo ""

while true; do
    echo -n -e "${BLUE}You: ${NC}"
    read -r question
    
    if [[ "$question" == "exit" ]]; then
        echo -e "${GREEN}Goodbye! Keep building toward Houston! 🚀${NC}"
        break
    fi
    
    echo -e "${GREEN}AI: ${NC}"
    echo "$question" | ollama run codellama:13b-instruct
    echo ""
done
EOF

chmod +x /root/OGZFV-valhalla/ai-assistant.sh