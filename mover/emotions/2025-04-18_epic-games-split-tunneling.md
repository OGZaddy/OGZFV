---
title: "Epic Games Split Tunneling"
date: 2025-04-18
tags: [emotions]
---

# Epic Games Split Tunneling

**User** (2025-04-18T17:23:23.942000):
how do i add the epic games launcher to split tunneling on proton vpn its giving me a login loop bug cause its trying to run through the vpn but i want to exclude it so i can play


---

**Assistant** (2025-04-18T17:23:24.056133):
Got you, Trey — here's exactly how to **exclude Epic Games Launcher from Proton VPN using split tunneling**, so it runs on your **regular connection** (not VPN) and avoids the login loop issue:

---

### ✅ Step-by-Step: Exclude Epic Games Launcher from Proton VPN (Windows)

#### 🛠 1. **Open Proton VPN**
- Launch the **Proton VPN desktop app** (make sure you're logged in).

#### 🧭 2. **Go to Settings > VPN Protocol**
- Click the **hamburger menu (☰)** in the top-left corner.
- Navigate to **Settings > Advanced**.
- Scroll down to find **Split Tunneling** and turn it **ON** if it isn't already.

#### 🔍 3. **Add Epic Games Launcher to the Split Tunneling List**
- Click **"Configure Split Tunneling"** or **"Split Tunneling Settings"** depending on your version.
- You’ll see 3 modes:
  - **Disable split tunneling** – not what you want.
  - **Exclude apps from VPN (recommended)** – this is what you want!
  - **Only use VPN for selected apps** – not what you want.

✔️ Select **"Exclude apps from VPN."**

#### ➕ 4. **Add Epic Games to the Exclusion List**
- Click **"Add application"**.
- Locate the Epic Games Launcher executable:
  - Usually found at:
    ```
    C:\Program Files (x86)\Epic Games\Launcher\Portal\Binaries\Win64\EpicGamesLauncher.exe
    ```
- Select that `.exe` file and confirm.

#### 💾 5. **Save & Restart**
- Click **Apply** or **Save**.
- **Restart Epic Games Launcher** to apply the change.

---

### 🔁 Bonus Tip: If it's still looping...
- Sometimes Epic caches your VPN IP — do this:
  1. Close Epic Games completely (check Task Manager for background tasks).
  2. Delete Epic’s `webcache` folder:
     ```
     %localappdata%\EpicGamesLauncher\Saved\webcache
     ```
  3. Restart your PC and **launch Epic with the VPN running and split tunneling properly applied.**

---

Let me know if you also want to exclude specific games (like Fortnite or RDR2) from VPN — sometimes they launch via separate `.exe` files. I can help you pin those down too.


---
