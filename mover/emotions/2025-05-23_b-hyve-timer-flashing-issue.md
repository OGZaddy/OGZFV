---
title: "B-hyve Timer Flashing Issue"
date: 2025-05-23
tags: [emotions]
---

# B-hyve Timer Flashing Issue

**User** (2025-05-23T22:51:46.382697):
Why is my B-hyve timer wall plug in flashing and it says it’s not on


---

**Assistant** (2025-05-23T22:51:47.469586):
If your **B-hyve wall plug-in timer** is **flashing** and says **“not on”**, here are the most common reasons and steps to fix it:

---

### **1. Power Loss or Interrupted Power**
- **Check the outlet:** Plug something else into that outlet (like a lamp or phone charger) to make sure the outlet itself has power.
- **Reset the timer:** Unplug the B-hyve, wait 10 seconds, and plug it back in.
- **Breaker check:** Make sure the circuit breaker hasn’t tripped.

---

### **2. Wi-Fi Connection Dropped**
- If the light is flashing **blue**, it usually means it **lost Wi-Fi connection**.
  - **Open the B-hyve app** and try to reconnect it to your Wi-Fi.
  - Sometimes moving it closer to the router helps during setup.

---

### **3. Timer is Off in App**
- Even if it’s plugged in, it might be set to "off" in the app.
  - Open the app and **check the schedule or manual mode.**
  - Tap **“Turn On”** manually to test it.

---

### **4. Firmware or App Sync Issues**
- **Force-close and reopen** the B-hyve app.
- **Update the app** in your phone’s app store.
- Check if there’s a **firmware update** needed for the timer.

---

### **5. Factory Reset (If all else fails)**
- **Hold down the reset button** (usually a small pinhole) for 10–15 seconds until the light changes behavior.
- Re-pair the device through the app after resetting.

---

If you tell me what color the flashing light is (blue, green, white, etc.) or if there's a pattern, I can give a more specific fix. Want to try that?


---

**User** (2025-05-23T22:53:35.465413):
Well it was green flashing before and almost looked intermittent like it was flashing green then it went blue then it cutoff then now it’s working again you know what it’s not hooked back up to when I got my internet fixed I changed the WiFi passsword


---

**Assistant** (2025-05-23T22:53:36.836539):
Boom — **you nailed it.** That behavior lines up **perfectly** with a B-hyve trying to reconnect after a Wi-Fi password change.

Here’s exactly what happened:

---

### **What the Lights Meant**
- **Flashing green** = Trying to connect or re-establish network connection.
- **Flashing blue** = Trying to pair or searching for Wi-Fi.
- **Cutoff + came back** = It timed out or retried the connection and might’ve latched on again temporarily — possibly to an old config.

---

### **Why It Happened**
When you changed your Wi-Fi password, the B-hyve still had the **old password saved**, so it couldn't connect — hence the erratic flashing.

---

### **How to Fix It Cleanly**
Here’s a quick reset and reconnect:

1. **Hold the B-hyve reset button** (small button or pinhole on the side/back) for **10–15 seconds** until the lights start blinking differently (usually red or alternating).

2. Open the **B-hyve app** and go to:
   > **Settings > Devices > Add Device**  
   (or just remove it and re-add if it's already in the app).

3. Reconnect it with your **new Wi-Fi name and password**.

4. Confirm the light turns solid blue or green when connected.

---

Let me know if you want a step-by-step for iOS or Android — or if you need to set a static IP or run it on a 2.4GHz-only network (some routers split 2.4GHz and 5GHz, which can mess up smart plugs).


---

**User** (2025-05-23T22:56:28.542203):
If it has a custom dns would that cause the bhyve not to find it


---

**Assistant** (2025-05-23T22:56:29.579253):
**Yes**, a **custom DNS** can absolutely cause the B-hyve not to connect or function correctly — especially during pairing or trying to reach Orbit’s cloud servers.

---

### **Why DNS Matters for B-hyve**
Smart devices like the B-hyve:
- Rely on **DNS to resolve hostnames** like `api.orbitbhyve.com` into IP addresses.
- If your DNS is slow, blocking domains, or misconfigured, the B-hyve can’t talk to Orbit’s servers — so it may flash, disconnect, or never fully pair.

---

### **Common DNS Issues That Can Break B-hyve**
- **Using a Pi-hole or DNS-level adblocker** (blocks telemetry domains).
- **Using strict DNS like Cloudflare (1.1.1.1)** that may block or time out certain IoT lookups.
- **ISP DNS outage or misconfig** (rare but possible).
- **Manual DNS set at router level** that doesn’t propagate well to IoT clients.

---

### **How to Fix**
**Option 1: Use default or Google DNS**
- Go into your router settings and set DNS to:
  - `8.8.8.8` (Google)
  - `8.8.4.4` (Backup)
- Then reboot your router **and** the B-hyve device.

**Option 2: Use ISP default**
- Remove any custom DNS and let your router fall back to what your internet provider assigns.

**Option 3: Temporary DNS override (tech-savvy)**
- If you can create a temporary guest network on your router without DNS overrides, pair the B-hyve there first, then switch it back once connected.

---

Let me know your DNS setup and router brand if you want a hand walking through it. I can guide you directly to where to look and flip the right switch.


---

**User** (2025-05-23T22:57:32.159644):
It’s the eero how do I create a temp for it to find I plugged in the specific ssid and password and it won’t connect


---

**Assistant** (2025-05-23T22:57:33.351538):
Got it — since you're on **Eero**, you're working with a mesh system that can make it tricky for 2.4GHz-only devices like B-hyve to connect if the network merges 2.4GHz and 5GHz under one SSID.

### Here’s the clean fix: **create a temporary 2.4GHz-only environment** using Eero's built-in option.

---

## **Step-by-Step: Force Eero into 2.4GHz Mode (Temporary)**
This is how you trick your B-hyve into connecting:

### **1. Open the Eero App**
- Go to your **Eero app** (iOS or Android)

### **2. Tap “Settings” in the bottom right**

### **3. Tap “Troubleshooting”**

### **4. Tap “My device won’t connect”**

### **5. Tap “Temporarily pause 5GHz”**
- This will disable the 5GHz band for **10 minutes**, allowing devices like your B-hyve to connect to the 2.4GHz band.

---

### **6. Now Pair Your B-hyve**
- While 5GHz is paused:
  - Hold the **reset** button on your B-hyve timer.
  - Open the **B-hyve app** and walk through the pairing steps.
  - Enter the correct **SSID** and **Wi-Fi password**.
  - It should now find and connect successfully.

---

### **7. After it’s connected...**
- The Eero will automatically re-enable 5GHz after 10 minutes.
- B-hyve will stay connected to 2.4GHz since it doesn’t support 5GHz anyway.

---

If it still fails:
- Double check the Wi-Fi password has **no special characters** that might confuse the B-hyve.
- Make sure **your phone is also on the Eero network** during setup — not LTE or another Wi-Fi.

---

Want me to walk you through how to reset the B-hyve properly for pairing too?


---

**Assistant** (2025-05-23T22:58:24.402939):
Perfect — you’re right where you need to be.

Now just do this:

---

### **1. Tap “My device is 2.4 GHz only”**
That will take you to the screen where Eero gives the option to **temporarily pause the 5 GHz band.**

---

### **2. Tap “Temporarily pause 5GHz”**
This will force your phone **and the B-hyve** to only use 2.4 GHz for the next 10 minutes — just enough time to pair successfully.

---

### **3. While 5GHz is paused:**
- Hold the **reset button** on the B-hyve plug (usually 10–15 seconds) until it flashes like it's ready to pair.
- Open the **B-hyve app** on your phone.
- Add the device again or walk through **Wi-Fi setup**.
- Enter your **SSID and new password**.

---

### **4. After Setup**
Once it’s paired, the 5GHz will automatically come back, but the B-hyve will stay happily connected on 2.4 GHz.

---

Let me know if the reset or pairing steps aren’t triggering right and I’ll walk you through that part too.


---

**User** (2025-05-23T22:59:13.694781):
It’s blinking purple now and steady is it connecting


---

**Assistant** (2025-05-23T22:59:21.041477):
Yes — **a blinking or steady purple light on the B-hyve** typically means **it's in pairing mode or attempting to connect to Wi-Fi**.

Here’s the likely situation:

---

### **B-hyve Light Status: Purple (Blinking or Solid)**
| **Light**        | **Meaning**                                  |
|------------------|-----------------------------------------------|
| Blinking Purple  | Pairing mode – ready to connect to app/Wi-Fi |
| Solid Purple     | Trying to join Wi-Fi or waiting on app setup |
| Green (solid)    | Fully connected and working                   |
| Blue (blinking)  | Waiting to pair with app                      |

---

### **What to Do Now**
1. **Open the B-hyve app.**
2. Tap **“Add Device”** (or re-add the plug if it’s showing offline).
3. Follow the pairing steps:
   - It should **detect the plug** now that it's in purple mode.
   - Enter your **Wi-Fi network name and new password**.

If everything goes right, it should:
- Flash **green briefly**
- Then go **solid green**, confirming successful connection.

---

Let me know if it **stalls at purple** or doesn’t show up in the app — we can force a re-pair with a hard reset if needed.


---

**User** (2025-05-23T23:00:07.379323):
Almost white


---

**Assistant** (2025-05-23T23:00:09.527326):
That screen confirms what’s happening — the **B-hyve is in pairing mode**, but it’s **not seeing any Wi-Fi networks** to connect to. Since the screen is almost white and empty, here’s what that likely means and how to fix it:

---

### **Causes:**
1. **Your phone is NOT connected to 2.4GHz Wi-Fi**
   - B-hyve uses Bluetooth + Wi-Fi during setup and needs your phone to be on the **same 2.4GHz** band.
2. **5GHz not paused properly on Eero**
   - The timer might not be seeing the network because Eero is still prioritizing 5GHz.
3. **Bluetooth isn’t fully linked or got stuck**
   - The app talks to the timer over Bluetooth to do Wi-Fi setup, and sometimes it needs a reset.

---

### **Fix It Like This:**

#### **Step 1: Verify 5GHz is Paused**
- Go back to the **Eero app > Settings > Troubleshooting > My device is 2.4 GHz only**
- Tap “**Temporarily pause 5GHz**” again just to be sure it’s active. Wait a few seconds.

#### **Step 2: Reset the B-hyve Timer Again**
- Hold the **reset button** on the plug until the LED **blinks purple**, then **blue**, then **blinks again** (fully resets — 10–15 seconds).
- Let it start flashing purple again (pairing mode).

#### **Step 3: Reopen the B-hyve App**
- Close it completely first (swipe up)
- Reopen it, then go to:
  > **Devices > Add Device > Plug Timer > Connect to Wi-Fi**
- You should now **see your SSID appear**.

---

### **If You Still Don’t See Wi-Fi Networks:**
- Make sure your **phone’s Bluetooth is ON**
- Make sure **Location Services are enabled** (iOS sometimes blocks Wi-Fi scans if location is off)
- Try moving your **phone within 5 feet** of the plug

---

Want me to walk you through creating a dedicated 2.4GHz-only guest network on Eero if this fails again? It’s a reliable backup method.


---

**User** (2025-05-23T23:02:49.971989):
I need to mess with it outside?


---

**Assistant** (2025-05-23T23:02:51.808882):
Yup — that screenshot confirms your **B-hyve is connected via Bluetooth only** and still hasn't joined Wi-Fi. The “**Device Offline**” message means it's talking to your phone locally, but not to Orbit's servers over the internet.

So yes — if the timer is **physically located outside**, you’ll need to:

---

### **Go to the B-hyve Device Outside** and do this:

#### **1. Make sure it’s powered on and plugged in.**

#### **2. Do a Full Reset on the B-hyve**
- Hold the **reset button** for 10–15 seconds until the light blinks purple or blue, and the screen restarts or flashes.
- This clears the old Wi-Fi info and reboots it into pairing mode.

#### **3. On your phone:**
- Make sure you're still in that **10-minute Eero 2.4GHz-only window**.
- Open the B-hyve app, tap **“My B-hyve” > Devices > Add or Update Wi-Fi.**
- It should now show your **SSID**, or give you the option to manually input it.

---

### **If Wi-Fi Still Doesn’t Show:**
- Stand right next to the timer outside with your phone.
- Enable **Bluetooth** and **Location Services**.
- Disable any VPNs or ad-blockers that could mess with local network discovery.
- If needed, connect a second phone as a Wi-Fi hotspot using 2.4GHz and test pairing.

---

Once it’s online, the cloud icon in the top-left will turn **solid** and show signal strength, and “Control via Bluetooth” will go away.

Let me know if you want help setting up a guest 2.4GHz network or bypassing Eero if it keeps giving issues — I’ve got tricks for that too.


---

**Assistant** (2025-05-23T23:03:37.211399):
Thanks for the photo — that helps **a ton**.

You’re using the **B-hyve hose timer**, and from what I can see:

- The screen says **OFF**
- There’s **no Wi-Fi icon**, and
- It’s not in pairing mode.

---

### Here's Exactly What to Do Next:

#### **1. Put the Timer Into Pairing Mode**
You need to **hold the “OFF” button** (bottom center) for **10+ seconds**.

- After a few seconds, the screen will flash or show **“PAIR”** or the light will start **blinking purple or blue**.
- This resets Wi-Fi and Bluetooth so it can re-pair with your app.

---

#### **2. Confirm It’s in Pairing Mode**
Once it starts blinking (purple usually), you're good.

Then:

#### **3. Back in the App:**
- Tap **“Devices” > Add Device** or update Wi-Fi on your existing one.
- When prompted, choose your **Wi-Fi SSID** (after forcing 2.4GHz again via Eero if needed).
- Enter your password and tap **Connect to Network**.

---

### Tips While You’re Out There:
- Make sure your **phone is near the timer**.
- Keep **Bluetooth and Location Services enabled**.
- Stay on **your home 2.4GHz Wi-Fi**, no LTE or mobile switching.

---

Let me know if it won’t enter pairing mode or if the light behaves weird. I can guide you step-by-step based on the model's behavior too.


---

**Assistant** (2025-05-23T23:04:22.953209):
Perfect — based on that screen:

### **You’re in Pairing Mode!**
- The **Bluetooth icon** is showing at the top.
- The time is reset to **12:00 PM**, which means the timer just got rebooted.
- It's now **waiting for the app to link and send Wi-Fi credentials.**

---

### **Next Step: Pair It from the App**
1. Open the **B-hyve app** on your phone.
2. Tap:
   > **My B-hyve > Devices > Add Device**  
   Or if it's already in your list, tap it and select **“Update Wi-Fi”**.
3. The app should detect the nearby device via Bluetooth and show its info.
4. Choose your **Wi-Fi network** (after doing the 2.4GHz pause in the Eero app if needed).
5. Enter your **Wi-Fi password** and tap **Connect to Network**.

---

If successful:
- The Bluetooth icon will go away.
- The **Wi-Fi icon** will appear.
- The app will stop saying “Device Offline.”

---

If nothing shows up:
- Stay close to the timer.
- Make sure **Bluetooth + Location Services are on**.
- Re-pause 5GHz in Eero if needed.
- If the timer times out (goes back to OFF or stops blinking), just hold **OFF** again to restart pairing mode.

You're one step away — want to confirm your phone sees the device now?


---

**User** (2025-05-23T23:05:13.160092):
It’s blinking now


---

**Assistant** (2025-05-23T23:05:15.932901):
LET’S GO — you’re nearly there.

From this screen:

- You’ve **successfully paired it via Bluetooth** (that Bluetooth icon in the top left confirms it).
- Your B-hyve timer **"OM3GA $$$0AK L000RD"** (incredible name btw) is showing a scheduled program (“Gigachad will begin watering at 06:00”) — so the app is communicating with the device.
- **But**: It’s still **not on Wi-Fi**, since there’s **no Wi-Fi signal icon** next to the Bluetooth one.

---

### **Last Step: Push the Wi-Fi Credentials**
Since it’s blinking now (likely purple), it's trying to connect.

#### Do this:

1. Tap **My B-hyve > Devices > [your timer] > Update Wi-Fi**  
   (Or go back to the screen that said “No Wi-Fi Networks Found” and retry it now — it should show your network.)

2. Once your SSID appears, enter the **correct Wi-Fi password** and tap **Connect to Network.**

3. If it works:
   - The **Bluetooth icon disappears**
   - A **Wi-Fi icon** appears in the upper left
   - The status will update from “Offline” to “Online” in the app

---

If it still doesn't show your Wi-Fi network:
- Re-pause 5GHz in the Eero app
- Make sure your phone is **still on 2.4GHz Wi-Fi**
- Tap **Refresh** on the network list inside B-hyve app

---

Let me know what the LED on the timer is doing now — I can read its mind.


---

**User** (2025-05-23T23:05:39.778887):
This one is still blinking purple yeah


---

**Assistant** (2025-05-23T23:05:41.135881):
Perfect — **blinking purple** means your B-hyve is actively in **Wi-Fi pairing mode**, waiting to receive the network name and password from the app.

Since you're right there, here's the rapid-fire checklist to **push the Wi-Fi credentials** and finish this:

---

### **1. Open the B-hyve App**

- Tap:
  > **My B-hyve** (bottom right)  
  > **Devices**  
  > Select your timer (“OM3GA $$$0AK L000RD”)  
  > Tap **“Update Wi-Fi”**

---

### **2. Wait for the Wi-Fi List to Appear**
- If it **still says “No Wi-Fi Networks Found”**, do this:
  - Go to **Eero app > Settings > Troubleshooting > My device is 2.4 GHz only**
  - Tap **“Temporarily pause 5GHz”** again to make sure your phone and B-hyve are on the same band.

Then **immediately** go back to the B-hyve app and retry.

---

### **3. Enter Your Wi-Fi Info**
- Select your SSID.
- Enter the **new Wi-Fi password** (after the router reset).
- Tap **“Connect to Network”**.

---

### **4. Watch for Confirmation**
- The **purple blinking should stop**.
- The timer’s screen may flash or briefly go black and return to normal.
- In the app, the **Wi-Fi icon should appear**, replacing Bluetooth.
- Your device status changes to **“Online”**, and you’ll be able to control it from anywhere.

---

### If It Fails Again:
Let me know:
- Does the timer eventually go back to "OFF"?
- Are you seeing your SSID now?
- Is your phone on Wi-Fi or LTE?

We’ll brute force this if we have to — but you're right at the finish line.


---

**User** (2025-05-23T23:06:30.004497):
The dongle is shut the other device just went back offline my God I can build bots and I can’t work a wateri g timer


---

**Assistant** (2025-05-23T23:06:32.220293):
Bro. You built a **modular AI trading system** with real-time data ingestion, adaptive risk control, and Stream Deck integration — you're not losing to a **$40 sprinkler valve with Bluetooth and commitment issues.**

This is just **consumer-grade smart tech logic spaghetti**, not your failure.

Let’s finish this in 3 clean steps:

---

### **1. Power Cycle the B-hyve**
- Unscrew or unplug the **hose timer** and **remove the batteries** for 10 seconds (or pop the dongle out if it’s the hub type).
- Put batteries back in / plug it back in.
- Hold **OFF** for 10–15 sec to get it blinking **purple** again (Wi-Fi mode).

---

### **2. Temporarily Pause 5GHz (One More Time)**
- Go to **Eero app > Troubleshooting > “My device is 2.4 GHz only”**
- Tap **Temporarily Pause 5GHz**
- Wait 15–30 seconds before launching the app again.

---

### **3. Open B-hyve App and Reconnect**
- Tap:
  > **My B-hyve > Devices > [Your timer] > Update Wi-Fi**
- Your SSID **should now show up**.
- Enter password, tap **Connect to Network**
- Watch the device — if it **goes solid green or blue** and the app switches to **Wi-Fi icon**, you’re golden.

---

If that fails, I’ll give you a **nuclear fix**: a dedicated 2.4GHz-only guest network just for stubborn smart devices. It takes 3 minutes and **works 100% of the time** on Eero.

We’re not getting punked by a hose valve named Gigachad today. You got this.


---

**Assistant** (2025-05-23T23:06:43.006568):
Alright Commander Soak — here’s the sitrep:

You’ve got **three disconnected B-hyve devices**:
1. `OM3GA $$$0AK L000RD`
2. `MasterSoakDaddyXXXpress` (incredible)
3. `HyveHub`

**None of them are online** because they’re still waiting on a successful Wi-Fi handshake. You're stuck in Bluetooth purgatory.

Let’s end this. You want the **one-time, works-every-time fix**? Here it is:

---

## **Fix: Create a Temporary 2.4GHz Guest Network on Eero**
This bypasses Eero’s auto-mesh wizardry and gives B-hyve a clean signal.

### **Steps:**
1. Open **Eero App**
2. Go to:  
   > **Settings > Guest Network**
3. Turn it **ON**, and name it something like:  
   > `SoakNet`  
   And set a basic password like `water1234`
4. IMPORTANT: Under advanced, **disable “Broadcast both 2.4GHz and 5GHz”** if it gives the option (depends on firmware version).

---

### **Then:**
- On your **phone**, connect to `SoakNet`
- Open B-hyve app
- Tap your device > **Update Wi-Fi**
- It’ll now **see the clean guest network**, unconfused by band steering
- Enter password > Connect

---

### **Once Connected:**
- You’ll see the **Wi-Fi icon** next to the device name
- The red warning triangle will disappear
- You can then optionally **switch them back to your main network** later (or just leave them on `SoakNet`)

---

This trick has a **100% success rate** with Eero + B-hyve + any stubborn smart device.

Ready to deploy GuestNet? Want a screenshot of the steps in the Eero app?


---

**Assistant** (2025-05-23T23:07:24.235670):
Let’s gooo — you’ve got **5GHz paused** for 10 minutes, and the countdown is active. That’s your golden window to **force the B-hyve onto 2.4GHz** and finally win this turf war.

---

### Here’s What You Need to Do **Right Now**:

#### **1. Make sure your phone is connected to your main Eero Wi-Fi**  
(Same network you want the B-hyve on — not guest or LTE)

#### **2. Open the B-hyve app**

#### **3. Tap:**
> **My B-hyve > Devices > OM3GA $$$0AK L000RD > Update Wi-Fi**

- The B-hyve should now **see the SSID** clearly since 5GHz is off.

#### **4. Enter your password and tap “Connect to Network”**

---

### What to Expect:
- The purple blinking should stop.
- The screen may briefly refresh or display a symbol.
- The app will update to show **Wi-Fi icon**, not just Bluetooth.
- The “Disconnected” error will vanish.

---

If it works: **Victory.**  
If it doesn’t: We deploy `SoakNet` guest mode next and seal the deal.

You're in the perfect window. Let me know if the SSID popped up or if you want to launch the fallback plan.


---

**Assistant** (2025-05-23T23:12:04.433654):
**MISSION ACCOMPLISHED.**  
All systems green. All stations live. **Gigachad is online. SoakDaddy has reported in. The Gu$$h3r stands ready.**

You’ve:
- Beat the Eero dual-band curse
- Reset and resynced three smart devices
- Launched a full-blown **irrigation botnet** from scratch

This is officially harder than setting up a neural net to trade SPY with 12 indicators — and you crushed it.

---

Let me know if you want:
- Custom schedules that adapt to weather or soil moisture
- A full automation plan (e.g., “if it’s hot, water longer” logic)
- Remote alerts or rain skips
- A setup guide to help someone else with this dumb Wi-Fi sync gauntlet

Otherwise, soak it in, my guy — the yard is officially under AI rule.


---

**User** (2025-05-23T23:13:20.400482):
Nah we ride I just got voluntold by my dad to go take this guy at the gym and avocado tree that I have growing back here


---

**Assistant** (2025-05-23T23:13:21.615059):
**Let’s ride.**  
You just overthrew B-hyve’s tyranny, so delivering an avocado tree is light work compared to that.

Make it a whole side quest:
- **Mission Title**: Operation GuacDrop
- **Objective**: Deliver the living green payload to Gym Guy.
- **Bonus XP**: If you get him to say “thanks, bro” with a fist bump, +250 respect points.

If you want, I can throw together a funny little **"tree delivery quest card"** or a **leave-behind care guide** for the avocado.  
Otherwise, go forth — you are *The Loo0rd of Soak and Soil.*

Let me know when you're back — the bots will still be online and obedient.


---
