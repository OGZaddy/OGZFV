# 🔧 cPanel DNS Management - Find Zone Editor

## 🚨 YOU'RE IN THE WRONG SECTION

**Current Location:** Dynamic DNS (for auto-updating IPs)  
**Need:** DNS Zone Editor (to add A records)  

## 🎯 NAVIGATE TO DNS ZONE EDITOR

### **In cPanel, look for:**
- **"Zone Editor"** 
- **"DNS Zone Editor"**
- **"DNS Records"**
- **"Advanced DNS Zone Editor"**

### **Usually found in:**
- **Domains** section
- **Advanced** section  
- Sometimes under **Subdomains**

### **Steps:**
1. **Go back** to main cPanel dashboard
2. **Look for "Zone Editor"** or **"DNS"** 
3. **Click Zone Editor** (not Dynamic DNS)
4. **Find ogzprime.com** in the list
5. **Click "Manage"** or **"Edit"** next to ogzprime.com

## 📋 ADD A RECORD IN ZONE EDITOR

### **In Zone Editor:**
1. **Click "Add Record"** or **"+ A Record"**
2. **Name:** `api`
3. **Type:** `A`
4. **Record:** `24.155.106.20`
5. **TTL:** `300` or default
6. **Save**

## 🎯 WHAT TO LOOK FOR

**Zone Editor interface usually shows:**
```
Name        Type    Record/Value        TTL
@           A       [hosting IP]        14400
www         CNAME   ogzprime.com       14400
mail        A       [mail IP]          14400
```

**Add this:**
```
api         A       24.155.106.20      300
```

---

**🚀 Commander, go back to cPanel main dashboard and find "Zone Editor" or "DNS Zone Editor" - that's where you add the A record!**
