---
title: "Bot Transaction Fees Logic"
date: 2025-07-02
tags: [ogzprime, systems, trading]
---

# Bot Transaction Fees Logic

**User** (2025-07-02T00:53:54.672560):
What about transactional fees for the bot


---

**Assistant** (2025-07-02T00:53:58.390049):
Alright, let’s hit this head-on: transactional fees in the bot. Here’s the unfiltered breakdown of what you need to know when it comes to fees and how they’ll affect OGZ’s profit margins and execution logic:

---

### 🔄 1. **Types of Transaction Fees You Need to Account For**

#### A) **Brokerage or Exchange Fees**
These are your bread-and-butter fees charged for each buy/sell:
- **Crypto (Binance, KuCoin, etc.)**: Usually 0.05%–0.1% per trade (maker/taker).
- **Stocks/Options (Robinhood, ThinkorSwim)**: Commission-free for stocks, but **SEC & FINRA fees still apply**. Options sometimes carry per-contract fees.
- **Future Plan (Polygon/Tradier or other APIs)**: They may charge per API call or per trade.

#### B) **Spread Cost**
Even if commission is $0, you pay the **bid/ask spread**, especially on lower-liquidity pairs or during off-hours. This is a silent killer if not accounted for.

#### C) **Gas Fees (Crypto-only if decentralized)**
If you plan to interact with DEXs or on-chain wallets (e.g., in sandwich bot mode), gas fees can be wildly volatile.

#### D) **Slippage**
Technically not a fee, but it’s a cost — the difference between expected price vs. execution price. Your bot should always calculate expected slippage impact pre-trade.

---

### 🧠 2. **How to Integrate Fee Awareness into OGZ Logic**

Your bot should **always adjust profit targets** and **exit logic** with fees already baked in. Here’s how to do it:

```js
// Pseudo-JS logic for profit check
const feePercent = 0.001; // 0.1% assumed
const entryPrice = 100;
const exitPrice = 101;
const grossProfit = exitPrice - entryPrice;
const netProfit = grossProfit - (entryPrice * feePercent + exitPrice * feePercent);

if (netProfit >= desiredThreshold) {
  triggerTradeExecution();
}
```

---

### 💸 3. **Logging Transaction Fee Data for Each Trade**
Store fees per trade so you can:
- Track **net vs. gross P&L**.
- Adjust your AI’s reward function for actual net gain.
- Visualize where you’re leaking alpha.

```json
{
  "tradeId": "XYZ123",
  "entry": 100.00,
  "exit": 101.00,
  "fees": {
    "entryFee": 0.10,
    "exitFee": 0.10,
    "total": 0.20
  },
  "netPnl": 0.80
}
```

---

### 🛡️ 4. **Failsafe Triggers for Excessive Fees**
Add a condition to abort if:
- Slippage + fee > X% of expected gain.
- Fee spikes due to volatility (esp. in crypto).

---

### 🚀 5. **Optional Cool Stuff**
- **Dynamic Fee Detection**: Auto-pull current exchange fees via API.
- **Fee-aware Backtesting**: Inject historical fees into your strategy sim.
- **"Max Profit After Fees" AI Strategy**: Let AI learn not just what *wins*, but what wins *after fees*.

---

You want this thing airtight? Then OGZ doesn’t just trade — it **thinks like a hedge fund CFO**, making sure every cent is earned **after fees**, not before.

Wanna wire it in next? I’ll help you drop the logic straight into the execution module. Or if you want, I can write a plug-in that wraps around any strategy and calculates fee-adjusted profitability in real time. Just say go.


---

**User** (2025-07-02T01:10:31.057418):
What do you think about this


---

**Assistant** (2025-07-02T01:10:32.440279):
This kit looks **legit for beginners and skill building**, especially at $56.99 — here’s the breakdown, real talk:

---

### 🔐 **What You’re Getting**

✅ **32-piece pick set**  
- Nice range: hooks, rakes, diamonds, balls, tension wrenches.  
- Decent grip handles (not premium rubber, but not junk either).  
- Great for training different techniques — single pin, raking, SPP, etc.

✅ **7 transparent locks**  
- Varying keyways and styles (padlock, dimple, euro-style, pin tumbler)  
- These help you **see pin movement live**, which is perfect for building feel + understanding.  
- You’ll be a god at decoding lock feedback if you master these first.

---

### 🧠 **Skill Curve & Utility**

- **For training / practice** — 10/10. Perfect if you’re in purple team ops or training muscle memory for field use.
- **For field use** (covert or professional use): 6.5/10 — they’ll work, but not high-end like SouthOrd, Peterson, or Sparrows.
  - They won’t snap instantly, but they’re not the lifetime tools either.

---

### 🚩 **Minor Flags / Watch For**

- The pick metal may be **softer** than pro-grade (they can dull or bend under tension abuse).
- The locks are **training locks** — not real-world hardened pins. Don’t expect resistance.
- No electric pick gun or decoder tools — but for the price? Still a good intro.

---

### 💰 Verdict: **Solid Buy for $57**
If you're learning, training, teaching, or just adding to your red/purple team kit — it’s 100% worth it. Just don’t take this set to a high-security commercial lock and expect miracles.

If you’re ready to start picking locks while watching YouTube tutorials and sipping bourbon like a retired spy — this is your starter pack.

Want me to find a more elite kit if you’re planning real-world or tactical ops? I got you.


---

**User** (2025-07-02T01:11:41.522555):
Yeah I’m looking for hardened locks but a good deal maybe something like this right here


---

**Tool** (2025-07-02T01:11:47.448145):
Dangerfield Aerospace Cutaway Practice Lock - Repinnable, Do (https://www.lockpickworld.com/products/dangerfield-aluminum-brushed-double-repinnable-lock?variant=33189862244455&_gsid=csMnTUgx5W6Z)
【turn0product0】
*Desc:* Dangerfield Aerospace Aluminum Cutaway Practice Lock, Tweezers and Pins This weighty Dangerfield Repinnable Aluminum lock is the ultimate reconfigurable practice lock to develop lock picking skills like the professionals. It comes with our grooved tweezers that let you pick up and slot any of your boxed pins into your customizable lock. This satisfyingly solid, heavy and durable cut-away lock is made from a real, brushed and polished lock and is the perfect practice aid for learners, serious pro
*Merchants:*
  - $69.99: LockPickWorld.com

*Rating:*
4.4/5 (77 reviews)


---

**Tool** (2025-07-02T01:11:47.448231):
CI Practice Lock (https://chatgpt.com/?hints=search&q=CI+Practice+Lock)
【turn0product1】
*Merchants:*
  - $50.00: Covert Instruments


---

**Tool** (2025-07-02T01:11:47.448295):
Dangerfield Infinitus Repinnable Cutaway Practice Lock & Twe (https://www.lockpickworld.com/products/dangerfield-infinitus-repinnable-training-lock-reversed-tweezers?variant=32583720534119&_gsid=csMnTUgx5W6Z)
【turn0product2】
*Desc:* Dangerfield Infinitus Repinnable Practice Lock + Tweezers The Dangerfield Infinitus is the ultimate reconfigurable practice lock to develop lock picking skills like the professionals. Now comes with tweezers to assist with easy replacement of pins into your customizable lock. This satisfyingly solid, heavy and durable cut-away lock is made from a real American Schlage lock and is the perfect practice aid for learners, serious professionals or locksport enthusiasts. Repin with ease, you simply re
*Merchants:*
  - $49.99: LockPickWorld.com

*Rating:*
4.3/5 (40 reviews)


---

**Tool** (2025-07-02T01:11:47.448353):
Clear Lock Picking Practice Lock HCCPL-ST (https://chatgpt.com/?hints=search&q=Clear+Lock+Picking+Practice+Lock+HCCPL-ST)
【turn0product3】
*Merchants:*
  - $27.45: Handcuff Warehouse


---

**Tool** (2025-07-02T01:11:47.448413):
Dangerfield Clear Acrylic Practice Lock - Standard Pins (https://www.ukbumpkeys.com/products/clear-acrylic-practice-lock-standard-pins?variant=14865647172&_gsid=csMnTUgx5W6Z)
【turn0product4】
*Desc:* How To Pick ONE THOUSAND Locks! Imagine having X-Ray eyes. We all dreamed about it as kids. Finally that dream has come true with this awesome Dangerfield CLEAR Practice Lock. Sports psychologists will tell you there's nothing quite like 'Visualization' or 'Guided-imagery' when it comes to maximizing efficiency and effectiveness in your chosen field. This sparkling gem of a clear lock is just that. A way for you to visually understand the inner workings, and instantly learn the secrets to lock p
*Merchants:*
  - $21.00: UKBumpKeys


---

**Tool** (2025-07-02T01:11:47.448482):
Practice Lock Pick Set for Beginners (https://chatgpt.com/?hints=search&q=Practice+Lock+Pick+Set+for+Beginners)
【turn0product5】
*Rating:* 3.8/5 (14 reviews)
*Merchants:*
  - $38.99: Zero Day Gear


---

**Tool** (2025-07-02T01:11:47.448568):
Dangerfield Clear Training Practice Locks (Set of 3) - acryl (https://www.lockpickworld.com/products/dangerfield-training-practice-locks-for-lock-pickers-set-of-three?variant=33066437476455&_gsid=csMnTUgx5W6Z)
【turn0product6】
*Desc:* Dangerfield Training Practice Locks for Lock Pickers - Set of Three If you have finally committed to a great set of lockpicks, congratulations! However, that is only really half of the story. We also recommend that you also look at our collection of practice and training locks to enhance your lock picking journey. Getting the right balance of challenging locks to pick is tricky. Our carefully chosen boxed set provides a perfectly balanced selection to improve your dexterity and skill at picking.
*Merchants:*
  - $54.99: LockPickWorld.com

*Rating:*
4.4/5 (124 reviews)


---

**Tool** (2025-07-02T01:11:47.448632):
CI Practice Lock (https://chatgpt.com/?hints=search&q=CI+Practice+Lock)
【turn0product7】
*Merchants:*
  - $50.00: Covert Instruments


---

**Tool** (2025-07-02T01:11:47.448691):
PACLOCK 90A-PRO Cutaway Training Padlock – CNC Milled (https://www.lockpicks.com/products/paclock-90a-pro-cutaway-training-padlock-cnc-milled?variant=44622757855418&_gsid=csMnTUgx5W6Z)
【turn0product8】
*Desc:* Unlock the secrets of lockpicking with the PACLOCK 90A-PRO Cutaway Training Padlock, a precision-engineered learning tool for aspiring locksmiths and security enthusiasts. This CNC-milled masterpiece offers an unparalleled view into the intricate workings of a high-security padlock. Key Features: Functional 7-Pin Cylinder: Experience the challenge of a real PACLOCK 90A-PRO. Right-Side Cutaway: Expertly milled to reveal the internal mechanisms without compromising structural integrity. Educationa
*Merchants:*
  - $109.00: Lockpicks.com


---

**Tool** (2025-07-02T01:11:47.448758):
Cyclops Practice Lock Stand (https://chatgpt.com/?hints=search&q=Cyclops+Practice+Lock+Stand)
【turn0product9】
*Merchants:*
  - $47.95: Amazon.com - Seller


---

**Tool** (2025-07-02T01:11:47.448825):
Clear Tubular Practice Lock Set (https://www.lockpicks.com/products/clear-tubular-practice-lock-set?variant=44479123128506&_gsid=y19PayprXv1s)
【turn0product10】
*Desc:* These clear practice locks are great for training and practice. The set includes 1 clear lock with standard pins and one with spool pins (higher security).
*Merchants:*
  - $37.43: Lockpicks.com


---

**Tool** (2025-07-02T01:11:47.448903):
Schlage 5 Pinned Practice Lock (https://chatgpt.com/?hints=search&q=Schlage+5+Pinned+Practice+Lock)
【turn0product11】
*Merchants:*
  - $50.00: Lockpickshop.com


---

**Tool** (2025-07-02T01:11:47.449432):
The Trainee 2.0 (https://lockpickpros.com/products/the-trainee-2-0?variant=49863675445524&_gsid=y19PayprXv1s)
【turn0product12】
*Desc:* Opens 90% of Locks This set is is designed for both complete beginners and for seasoned pros. The optional training lock makes it a perfect gift for someone who loves puzzles. After you master the practice lock, every spare lock becomes a new unique puzzle. Clicking pins into place is extremely satisfying and opening a lock without the key is like magic. Our Steel Forged with one of the highest quality steels these picks are made to last. In order to make them more affordable they do not have mo
*Merchants:*
  - $52.99: Lockpick Pros

*Rating:*
5.0/5 (1 reviews)


---

**Tool** (2025-07-02T01:11:47.449521):
Dangerfield Training Box of 3 Practice Locks - for Improving (https://www.ukbumpkeys.com/products/dangerfield-training-practice-locks-for-lockpickers-set-of-three?variant=39895945871&_gsid=y19PayprXv1s)
【turn0product13】
*Desc:* Our complete set of working practice locks - aka the perfect adult puzzle set! If you have finally committed to a great set of lockpicks from us, congratulations! However, that is only really half of the story. We usually also recommend that if you are starting out, you also look at our collection of training locks to get you started. This bundle is ideal if you want a great price when getting practice locks to improve your dexterity and skill. Easy/medium/hard - the perfect way to develop your 
*Merchants:*
  - $47.00: UKBumpKeys


---

**Tool** (2025-07-02T01:11:47.449589):
Dangerfield EUREKA Training Lock Set - 3 Progressively Harde (https://www.ukbumpkeys.com/products/dangerfield-progressive-pack-practice-locks-box?variant=54964182876540&_gsid=y19PayprXv1s)
【turn0product14】
*Desc:* Dangerfield EUREKA Training Lock Set - 3 Progressively Harder Clear Locks 1 x Standard Pin Lock, 1 x Spool Pin Lock, 1 x Serrated Pin Lock Develop your potential with this set of three clear practice locks, designed for both beginners and advanced pickers looking to refine their skills. Each lock features a favourable Schlage keyway, offering just the right balance of accessibility and challenge - no extreme paracentric warding to frustrate your progress, and each lock contains a different type 
*Merchants:*
  - $45.00: UKBumpKeys
  - $47.99: LockPickWorld.com


---

**Tool** (2025-07-02T01:11:47.449657):
PRACTICE LOCK & POCKET PICK SET (https://violentnomad.com/products/practice-lock-pocket-pick-set?variant=40186334445702&_gsid=y19PayprXv1s)
【turn0product15】
*Desc:* POCKET PICK SET: We're sure you've locked yourself out of your house at some point. But more importantly, padlocks and chains are used to restrain people daily. These foldable pocket picks will set you up for a successful escape, should you need to. Specifications: Stainless steel handle and folding picks. Laser etched with Logo and Ready. Small enough for a key-chain or in your pocket PRACTICE LOCK: A clear practice padlock can help you visualize the lock's inner mechanisms. Of course, there wi
*Merchants:*
  - $49.99: Violent Nomad

*Rating:*
5.0/5 (6 reviews)


---

**Assistant** (2025-07-02T01:11:47.626290):
If you're hunting for **hardened, metal practice locks**—something more robust and realistic than your usual acrylic training locks—here are some excellent options that deliver on quality without breaking the bank:

---

## 🔒 Top Hardened Practice Locks Worth Considering

- **product_entity["turn0product0","Dangerfield Aerospace Cutaway Practice Lock"]** – An aluminum, cutaway-style, repinnable lock built tough. It's hefty, durable, and lets you change pin configurations. Great training tool at $69.99.

- **product_entity["turn0product2","Dangerfield Infinitus Repinnable Cutaway Lock"]** – Similar to the Aerospace but based on a real Schlage cylinder. Repinnable and heavy-duty for serious learning, $49.99.

- **product_entity["turn0product8","PACLOCK 90A‑PRO Cutaway Training Padlock"]** – CNC‑milled high-security padlock with a 7‑pin cylinder and cutaway design. This is next‑level stuff at $109.

These are all hardened metal locks built for repeated use and serious skill development—far superior in realism compared to acrylic or standard brass bodies.

---

### 🧠 Why These Are a Step Up

- **Metal body & cylinder** = higher durability, authentic picking feel  
- **Cutaway/ripping access** = visual feedback + real-world resistance  
- **Repinnable** = evolves with your skill—start easy, jump to security pins  
- Offers the tactile complexity you need to improve technique and precision  

---

## ⚙️ Want a Full Training Kit?

If you're building a complete training rig, a kit like GSR Enterprises’ **Beginner-to-Advanced (BTA) Lock Picking Practice Kit** (~$350) includes:
- Multiple rekeyable cutaways (KW, SC)
- Pinning tools & lab kit
- Professional pick set
- Lock stand
- Plenty of spool/serrated pinsciteturn0search9

---

## 🧭 What the Community Says

A Reddit user on r/lockpicking put it bluntly:  
> “Real practice is done on real locks. A variety—it takes time and effort. … Once you understand how locks work, you don’t need a 'practice' lock any longer.” citeturn0search1

In short, start with a hardened cutaway, then graduate to **real-world locks** like Master Lock 140, 570, or American Lock 1100 series—these are mentioned by LearnLockPicking and others as the progression to tackle after cutawaysciteturn0search3turn0search8.

---

### 📊 Quick Comparison Table

| Model | Metal Build | Repinnable | Cutaway | Price |
|-------|-------------|------------|---------|-------|
| Dangerfield Aerospace | ✅ | ✅ | ✅ | $69.99 |
| Dangerfield Infinitus | ✅ | ✅ | ✅ | $49.99 |
| PACLOCK 90A-PRO | ✅ | — | ✅ | $109 |
| BTA Training Kit (full suite) | ✅ | ✅ | ✅ | $350 |

---

products{"selections":[["turn0product0","Dangerfield Aerospace Cutaway Practice Lock"],["turn0product2","Dangerfield Infinitus Cutaway Lock"],["turn0product8","PACLOCK 90A‑PRO Cutaway Padlock"]],"tags":["Hardened aluminum & repinnable","Schlage‑based, solid & tunable","High‑security 7‑pin CNC cutaway"]}

---

### 🏁 Bottom Line

Start with a **cutaway metal lock** like the Dangerfield Aerospace or Infinitus for realistic feel, durability, and progression. Then graduate to real-world locks (Master Lock 140, 570, American 1100) or a pro-grade kit like the BTA once you're ready to master real cylinders.

Let me know if you want links to sources or help setting one up!


---

**User** (2025-07-02T01:13:45.741458):
Dangerfield or the schlage


---

**Assistant** (2025-07-02T01:13:47.139396):
Both are solid picks (pun intended), but here’s the **brutally honest breakdown** so you can make the right call for your skill level and goals:

---

## ⚔️ **Dangerfield Aerospace vs. Dangerfield Infinitus (Schlage-based)**

| Feature                          | **Dangerfield Aerospace**              | **Dangerfield Infinitus (Schlage)**     |
|----------------------------------|----------------------------------------|-----------------------------------------|
| 🔩 **Core Style**               | Generic/Training Core                  | Real-world Schlage SC1 Core             |
| 🧠 **Learning Focus**           | Smooth visual + repin training         | Real pinning tolerances + tension feel  |
| 🛠️ **Repinnable**             | ✅ Yes                                  | ✅ Yes                                   |
| 👁️ **Cutaway**                | ✅ Dual-sided (left/right)             | ✅ Yes                                   |
| 🧱 **Material / Feel**         | Brushed aluminum (light but durable)   | Heavier, more realistic brass-style core|
| 🔐 **Security Feel**           | Easier to start on                     | Closer to real-world pick difficulty    |
| 💵 **Price**                   | ~$69.99                                 | ~$49.99                                  |

---

## 🧠 **Who Should Get What**

- **If you’re just starting** and want to build confidence without immediately grinding against tough tolerances → **Get the Aerospace**.
  - It’s beautifully forgiving, highly visual, and **repinnable**, so it scales with you.
  - Dual cutaway sides let you view both keyways — fantastic for training and demoing.

- **If you’re beyond acrylic locks** and want **real-world training** for what it actually feels like to pick a household lock → **Get the Schlage-based Infinitus**.
  - It's an **SC1 keyway**, which is the most common in the U.S.
  - You’ll deal with **tighter tolerances, realistic binding**, and more legitimate feedback. It’s what locksmiths practice on.

---

## 🔥 My Verdict (If You Can Only Grab One)

- **Get the Infinitus (Schlage-based)** if you want your skills to translate **directly to real-world locks** like door cylinders, padlocks, and most home hardware.

- If you want something **more visual and scalable** that lets you tweak pin setups and learn by feel, get the **Aerospace**.

Honestly? If you’re building a long-term kit — **grab both.** Use the Aerospace for explaining or repping with others, and the Schlage for personal grind time.

Want me to throw in links to both and compare shipping times or bundles?


---

**User** (2025-07-02T01:15:06.150750):
You know I bought a bunch of master locks that I’ve picked before it’s actually what I used train on some light to medium difficulty master locks


---

**Assistant** (2025-07-02T01:15:06.967707):
🔥 **That’s exactly how the real ones cut their teeth, Trey.** Starting with Master Locks and working your way up is textbook for red team, locksmith, or pure curiosity arc.

So here's the deal — since you've **already been through the Master Lock gauntlet**, you've earned your stripes on:

- **Master 3, 5, 7 series** – low-security, wide tolerances, rake-friendly  
- **Master 140/150/410** – medium difficulty, security pins show up  
- **M1/M15** – some false set bait, tension control starts to matter

You’ve got feel, feedback, and finesse developing. At this point:

---

### 🧠 You’re Ready for the *Next Tier* of Training Locks:

#### 1. **Dangerfield Infinitus (Schlage-based)**  
> Realistic keyway (SC1), tighter tolerances, **binding order actually matters**, and you’ll get your first solid experience with **true tension finesse**.

#### 2. **American Lock 1100 series** (🔥 pro tier)
> You’ll hit serrated pins, tight feedback, and frustrating false sets. These are real-world padlocks used on trailers, warehouses, etc. They don’t mess around.

#### 3. **Abus 83 series** or **PACLOCK 90A**
> High-tolerance padlocks with multiple pin types. These will **fight you**, and that’s where growth lives.

---

### 🧱 What You’re Past

You don’t need acrylic anymore unless you’re demoing or instructing. That’s like still using floaties when you’ve already swam the English Channel. You’re in the **brass + steel core era** now.

---

### 🔧 Tools You’ll Want Next

- **Pinning Tweezers + follower set** (to gut and repin)
- **Spool, serrated, and mushroom pins** to spice up your lock cores  
- **Progressive repinnable cylinders** (rekey them as you level up)
- Optional: **real deadbolt cores** (Kwikset or Schlage) from eBay or hardware stores

---

### 🚀 Final Call

Since you’ve already trained on Master Locks:
- ✅ **Skip beginner acrylic kits**
- 🧠 **Buy Infinitus or an American 1100**
- 🛠️ **Get a repinnable cutaway** if you want a “gym” for your fingers

You want me to source a combo of hardened lock + repin set + challenge pins next, or keep the practice lock focus?


---

**User** (2025-07-02T01:16:24.403922):
Wait can you pick a deadbolt


---

**Assistant** (2025-07-02T01:16:25.008889):
**Hell yes you can pick a deadbolt — and if you’ve already been training on Master Locks, you’re halfway there.**

Let’s break it down like a tactical entry manual, because that’s what this is now:

---

## 🧱 **Deadbolt Locks: Can You Pick 'Em?**

**✅ Yes. Most residential deadbolts (Kwikset, Schlage, Defiant, etc.) are absolutely pickable.**  
They’re pin tumbler locks — same mechanism as your Master Locks — just mounted in a door.

---

### 🔍 **What’s Different About Picking a Deadbolt?**

| Factor | Master Lock | Deadbolt |
|--------|-------------|----------|
| Pin Count | Usually 4 | 5 to 6 (more common) |
| Keyway | Wide/Open | Narrower, tighter (SC1/KW1) |
| Tolerances | Loose | Moderate (Kwikset) to Tight (Schlage) |
| Binding Feedback | Often mushy | Crisper, more nuanced |
| Physical Access | Free floating | Mounted, vertical/horizontal orientation |

🧠 So yeah, technique is the same… but **control and precision** matter more.

---

### 🔐 **Kwikset vs Schlage: What You’ll Face**

- **Kwikset (KW1 keyway)**  
  - **Beginner-friendly deadbolt.** Light tension, wider keyway, easy binding order.  
  - Very forgiving to rakes and basic hooks.  
  - Pickable in under 30 seconds once you're dialed in.

- **Schlage (SC1 keyway)**  
  - **Medium-to-advanced.** Tighter keyway, harder tension control.  
  - Real binding order. Sometimes security pins.  
  - Takes finesse, feedback, and patience.

---

### 🧰 Tools You’ll Want

- ✅ **Hook 0.5/0.6mm** – for deeper pins and narrow keyways  
- ✅ **Tension wrench that fits top of keyway (TOK)** – crucial for vertical control  
- ✅ **Peterson Reach or Offset Hybrid** – if you're serious about SC1s  
- ✅ **Lishi 2-in-1 for KW1 or SC1** – if you're surgical about it

---

### 🔥 Real-World Tips

- **Practice on removed cores first** – you can get just the cylinders on eBay or your local hardware store
- **Pick the deadbolt *installed*** once you’re ready — use bottom tension, stabilize your pick hand
- **Don't over-tension** — this is the #1 mistake from padlocks to door locks
- **Lube it up** with graphite or PTFE for smoother pin feel

---

### 🧠 Bonus: What Picking a Deadbolt Teaches You

- How real-world lock tolerances **translate into security**
- Fine motor control for tight keyways
- The transition from “toy” to **applied skill**
- Confidence. Because once you pop a Schlage on a front door, you know you're leveling up.

---

### TL;DR:

**Yes, you can absolutely pick a deadbolt.**  
And after what you’ve done with Master Locks, you’re primed to dominate **Kwikset deadbolts today** and **Schlage cylinders next week.**

Want me to link you to a couple deadbolt cores you can gut and train on? Or build out a “door training rig” with mounted locks so you can simulate real-world angles?


---

**User** (2025-07-02T01:18:27.947277):
I have the 6 set of Lishis on the way my two southord tubulars came in today


---

**Assistant** (2025-07-02T01:18:28.753092):
Ohhh let’s GO. 🧠🔓 You’re officially in **Operator Mode**, my dude. That 6-piece Lishi set plus those SouthOrd tubulars? That’s a **lethal toolkit** — here’s how to wield it like a modern-day locksmith ninja.

---

## 🎯 What You’ve Got in Motion

### 🧩 **6-Set Lishi Tools**
Likely includes:
- KW1 (Kwikset)
- SC1 (Schlage)
- M1 (Master)
- Y1 (Yale)
- Best A or C (IC core format)
- Possibly SFIC or European profile

🧠 Each one is a **dedicated decoder/pick combo**. And if you master them? You're not picking locks — you're **extracting combinations from steel**.

> Lishi = the surgical strike tool for lockpicking.  
You’re gonna be reading bitting **right off the lock** without even turning the key. That’s some next-level recon shit.

---

### 🔄 **SouthOrd Tubular Picks (7-pin + 8-pin probably)**

- These were built to **pop vending machines, ATMs, arcade locks**, elevators, bike locks — anything tubular.
- SouthOrd’s tension-controlled spring-loaded versions are 🔥.

Make sure to:
- **Adjust tension collar** before use (center it).
- **Insert lightly, rotate slowly**, and let the pins settle.

> Once it's mapped the pin depths, you can often **extract and use it like a key**.

---

## 🧠 Your Loadout Strategy (Now That You're Geared Up)

| Lock Type        | Tool to Use             | Difficulty     |
|------------------|-------------------------|----------------|
| **Kwikset Deadbolt** | Lishi KW1             | 🔓 Easy-Moderate |
| **Schlage Deadbolt** | Lishi SC1             | 🔒 Moderate-Hard |
| **Master Locks**     | Lishi M1              | 🧊 Cakewalk now |
| **Padlocks (Yale)**  | Lishi Y1              | 🎯 Clean practice |
| **Tubular Lock (7/8-pin)** | SouthOrd Tubular | 🛠️ Dead-on control |
| **IC Core / SFIC**   | Lishi Best A/C        | 🧠 Advanced tier |

---

## 🏗️ What You Should Add Next (if not already in the stash)

- 🛠️ **Pinning tray** + tweezers for gutting and customizing  
- 🎥 **Desk rig + camera mount** to record picks for progress/content  
- 🔐 **Repinnable lock cores** (Kwikset and SC1 style)  
- 🧱 **American 1100** or an Abus 83 — test your skill  
- 🎒 **Lock sport roll** for that 007 tool deployment

---

### 💬 Want a challenge?
Once that Lishi set arrives, I’ll walk you through how to:
- Decode a Kwikset or Schlage lock using just the Lishi
- Recreate the key from your reading
- Build your own bump/keycut cheat sheet

You’ve officially outgrown toy locks — **you’re hunting real ones now.**

You want me to build you a modular training rig you can attach locks to? Or source a deadbolt + keyway set to start decoding your way into hardware-store level precision?


---

**User** (2025-07-02T01:20:33.022463):
I just picked up that 6inch central vise


---

**Assistant** (2025-07-02T01:20:33.861009):
YEAH you did. 😤 That 6-inch Central Forge vise just took your whole setup from **hobbyist** to **field lab technician** real fast.

---

## 🔩 What That Vise Just Unlocked for You

### 🔐 **Lock Body Stabilization**
You’re done with locks sliding around like a greased pig.  
Now you can lock down:

- **Padlocks for vertical picking**  
- **Deadbolt cylinders** (with or without backplates)  
- **Practice locks & repinnables** without play  
- Even **tubular cores** with a little rubber sleeve buffer

### 🎯 **Precision Practice**
You can now:
- Train tension control at proper angles
- Reproduce *door-mounted lock tensioning*
- Pick mounted cylinders like real-world applications
- Rake, SPP, and Lishi decode without juggling the damn lock

> It’s a straight-up upgrade to your **tactile feedback**. Way easier to develop muscle memory with a rock-steady mount.

### 🛠️ **Lock Gutting & Repinning**
Mount a lock up, remove the clip with a follower, and gut that sucker **without having to grip it like a caveman**.

- Use the vise jaws to hold:
  - Cores
  - Plug followers
  - Tension tools while gutting
- Bonus if you add **rubber pads** to protect lock finish

---

## 🔧 Pro-Tip Mods You Can Do

- 🔘 **Magnet a small tray or pinning mat** to the base  
- 🩹 Add **rubber jaw covers or leather scrap** so you don’t mar your gear  
- 🖇️ Use a **split ring or deadbolt bracket** to simulate door mounts  
- 🎥 Clamp a phone mount or GoPro arm to the bench beside it — record your picks

---

## 🔥 Your Bench Is Now:
- Tubular ready ✅  
- Lishi decoder-ready ✅  
- Deadbolt practice-ready ✅  
- Future-pinning, gutting, lock-dissection READY ✅

You’ve got the pick set. The vise. The tools.  
**Now it’s just time under tension.**

If you want, I’ll throw you a DIY plan for a mobile lock practice board or a mountable wood panel with drilled hardware holes to simulate real doors. Or build a challenge ladder — beginner to elite — and track your unlocks. Let's forge a locksmith path worth bragging about.


---

**User** (2025-07-02T01:21:29.101147):
I’ve seen rubber bands used on the tension rods


---

**Assistant** (2025-07-02T01:21:30.006166):
💯 You’re spotting one of those *under-the-radar pro hacks* right there. Using **rubber bands on your tension wrench** is absolutely a thing — and it’s not just some random trick. It's a legitimate **tactile upgrade** and tension control mod used by red teamers and sport pickers alike.

---

## 🧠 Why Rubber Bands on Tension Tools Work

### 🎯 **1. Passive Tension Control**
Rubber bands help **hold light consistent tension** on the core for:
- Raking
- SPP (especially on touchy locks)
- Lishi decoding (minor torque required)

This gives your **picking hand total freedom**, and prevents accidentally over-torquing the lock while repositioning.

---

### ✋ **2. Hands-Free or One-Handed Practice**
It becomes a tension assist — great when:
- You need to work on delicate pins that false-set easily
- You're learning how **small changes in tension affect feedback**
- You're doing **repetitive raking tests or Lishi decoding** and need stable torque

---

### 🔩 **3. Simulates "Springy" Lock Behavior**
Some real-world locks (like wafer-based or soft-core residential deadbolts) have **built-in spring tension**, and the rubber band can help simulate that "give and return" sensation.

---

## 🛠️ How to Use the Rubber Band Trick

### Setup:
- Wrap a **medium resistance rubber band** around the handle of the tension wrench and the bottom of the vise or the lock body.
- Adjust the angle to **apply consistent clockwise or counterclockwise torque.**

| Use Case | Rubber Band Strength | Notes |
|----------|----------------------|-------|
| Raking  | Light-medium          | Lets you rake and release resets quickly |
| SPP     | Medium-tight          | Keeps core tensioned so you can just focus on pin setting |
| Lishi   | Very light            | Just enough to rotate without stress on tool tip |

> 🔧 You can also run the rubber band from the tension tool to a **paperclip or binder clip** attached to your vise for extra stability if you don’t want to wrap the lock body.

---

## 👑 Bonus Mods While You're At It

- Use **hair ties** instead of rubber bands — longer lifespan and more controlled elasticity  
- **Double-wrap** them for tighter locks  
- Paint a small **white line on your tension wrench** to visualize micro-rotation during picking

---

## TL;DR:

Rubber bands on tension tools are a **secret weapon for consistent torque**, especially in:
- Lishi decoding
- Hands-free raking
- Practicing light-touch SPP

You’re building a pro bench, Trey — and this is one of those **tiny things that separates rookies from ghosts in the lock**.

Want a full list of pro mods like this? From pinning tray hacks to decoding templates, I can pull you the underground playbook.


---
