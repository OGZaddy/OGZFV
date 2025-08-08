---
title: "Create System Image Hyper-V"
date: 2025-04-11
tags: [training]
---

# Create System Image Hyper-V

**User** (2025-04-11T23:43:28.497000):
okay how do i create the system image and what do i need to do to get my comp ready to enable hyper v for this code


---

**Assistant** (2025-04-11T23:43:28.864563):
Alright Edward — let’s walk through both parts of your question **step-by-step** so we don’t miss anything:

---

## 🧱 PART 1: Create a System Image Backup (Windows)

This saves a full copy of your system — so if anything breaks while enabling Hyper-V, you can restore it **exactly** as it was.

### ✅ Step-by-Step (System Image Backup)

1. **Plug in External Drive**  
   Use a USB hard drive or large SSD (should be at least the same size as your system drive).

2. **Open Control Panel**  
   - Press `Win + R`, type `control panel`, and hit Enter.

3. **Go to Backup Settings**
   - Navigate to:  
     `Control Panel > Backup and Restore (Windows 7)`  
     *(Yes, even in Windows 11 — this is still where it lives.)*

4. **Create System Image**
   - Click **"Create a system image"** from the left sidebar.
   - Choose **"On a hard disk"** and select your external drive.
   - Click **Next**, then **Start backup**.

5. **Create System Repair Disc (Optional)**
   - It'll ask if you want to make a recovery disc — optional if you already have a Windows install USB.

🛡️ After this finishes, you're backed up like a boss.

---

## 🧠 PART 2: Prep for Enabling Hyper-V

Before you enable Hyper-V, **make sure your system is compatible and won’t boot-loop again.**

### ✅ Pre-checks Before Enabling Hyper-V

1. **Check CPU Virtualization Support**
   - Open Task Manager (`Ctrl + Shift + Esc`)
   - Go to the **Performance** tab > **CPU**
   - Look for “Virtualization: Enabled” in bottom right.

2. **If Disabled, Enable Virtualization in BIOS**
   - Restart your PC and enter BIOS (`Del`, `F2`, or `Esc` — varies by system).
   - Look for:
     - **Intel**: VT-x, VT-d
     - **AMD**: SVM Mode
   - Enable it and save changes.

3. **Ensure These Features Are Enabled (Windows Features)**
   - Open **Windows Features** (type it in Start Menu).
   - Check the following:
     - ✅ Hyper-V
     - ✅ Hyper-V Management Tools
     - ✅ Hyper-V Platform *(this one requires virtualization to be enabled in BIOS)*
     - ✅ Virtual Machine Platform
     - ✅ Windows Hypervisor Platform

4. **Disable Conflicts if Needed**
   - **Do NOT enable Hyper-V alongside other 3rd party hypervisors** like VirtualBox/VMware — they conflict.
   - You may also want to temporarily disable Core Isolation in Windows Security if issues persist.

5. **Restart**
   - Reboot and see if everything stays stable.

---

## ❗ If Hyper-V Causes a Boot Loop

If you turn on Hyper-V and your system blackscreens again:

- Boot into **Advanced Recovery** (via install USB > Repair your computer)
- Go to **Command Prompt** and run:

```bash
bcdedit /set hypervisorlaunchtype off
```

That disables Hyper-V and brings your system back.

---

### You good to proceed? Want help building the `.bat` file to re-enable or disable Hyper-V with a click too?


---
