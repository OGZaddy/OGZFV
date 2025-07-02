# OGZ Prime WebSocket Port Mapping & Conflict Resolution

## 🎯 **STANDARDIZED PORT ALLOCATION**

### **Main Trading Bot (OGZPrimeV10.2.js)**
- Data WebSocket: **3001** ✅
- GUI WebSocket: **3002** ✅  
- Control WebSocket: **3003** ✅

### **SSL Server (ogzprime_ssl_server.js)**
- Regular WebSocket: **3012** ✅
- Secure WebSocket: **3013** ✅
- Regular API: **3010** ✅
- Secure API: **3011** ✅

### **Transparency System**
- WebSocket: **3009** ✅
- API: **3008** ✅

### **Mobile API**
- REST API: **5000** ✅
- WebSocket: **5001** ✅

### **Development/Testing Services**
- Historical Data Server: **3021** (CHANGED from 3001)
- Backtester Data: **3022** (CHANGED from 3001)
- Control Server: **3023** (CHANGED from 3003)

## 🚨 **CONFLICTS RESOLVED**

### **BEFORE (Conflicts):**
- Port 3001: Main bot + Historical loader + Backtester ❌
- Port 3003: Main bot + Control server ❌

### **AFTER (No Conflicts):**
- Port 3001: Main bot only ✅
- Port 3003: Main bot only ✅
- Port 3021: Historical loader only ✅
- Port 3022: Backtester only ✅
- Port 3023: Control server only ✅

## 📋 **IMPLEMENTATION CHECKLIST**

- [ ] Update historical-data-loader.js port
- [ ] Update control-server.js port  
- [ ] Update backtester port
- [ ] Update dashboard connection URLs
- [ ] Test all services independently
- [ ] Verify no port conflicts remain