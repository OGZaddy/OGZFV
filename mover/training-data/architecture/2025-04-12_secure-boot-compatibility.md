---
title: "Secure Boot Compatibility"
date: 2025-04-12
tags: [architecture, systems]
---

# Secure Boot Compatibility

**User** (2025-04-12T02:31:22.315268):
Do I want secure boot on or off when delploying  the walls have eyes softwsre


---

**Assistant** (2025-04-12T02:31:23.535553):
The term "The Walls Have Eyes" refers to multiple entities, including a quest in the game *Escape from Tarkov* and a book by Petra Molnar on surveillance technologies. Neither of these appears to be software that requires deployment on a computer system.

However, if you're referring to deploying software that involves surveillance or security features, the decision to enable or disable Secure Boot depends on the software's compatibility and your security requirements.

**Understanding Secure Boot:**

Secure Boot is a UEFI firmware feature that ensures only trusted software is loaded during the boot process. It helps protect against rootkits and unauthorized bootloaders by verifying digital signatures of the boot software.

**Considerations for Enabling or Disabling Secure Boot:**

- **Enable Secure Boot if:**
  - The software you're deploying is signed with a trusted certificate recognized by your system's firmware.
  - You want to maintain a high level of security to prevent unauthorized code from running during startup.

- **Disable Secure Boot if:**
  - The software requires loading unsigned drivers or components that Secure Boot would block.
  - You're using custom or legacy software that isn't compatible with Secure Boot's verification process.

**Steps to Determine Compatibility:**

1. **Check Software Documentation:**
   - Review the software's installation guide or official documentation to see if Secure Boot needs to be disabled.

2. **Test in a Controlled Environment:**
   - If documentation is unclear, consider testing the software installation in a virtual machine or non-critical system with Secure Boot enabled to observe any issues.

3. **Consult Support Channels:**
   - Reach out to the software's support team or user community forums for guidance on Secure Boot compatibility.

**Final Recommendation:**

If the software is compatible with Secure Boot, it's advisable to keep it enabled to benefit from the added security. However, if compatibility issues arise, and after thorough testing and consideration of security implications, you may choose to disable Secure Boot to facilitate the software deployment.

If you can provide more specific information about the software in question, I can offer more tailored advice.


---

**User** (2025-04-12T02:31:47.345191):
I’m talking about esp in a game


---

**Assistant** (2025-04-12T02:31:48.533349):
When deploying ESP (Extra Sensory Perception) software—commonly used in games to display information like player positions or item locations—you'll typically need to **disable Secure Boot** in your system's BIOS or UEFI settings.

### Why Disable Secure Boot?

Secure Boot is a security feature designed to ensure that only trusted, signed software can run during the system's boot process. While this protects against unauthorized code execution, it also prevents unsigned or custom drivers and tools—like many ESP cheats—from loading.

Many cheat providers explicitly instruct users to disable Secure Boot to ensure their software functions correctly. For instance, certain Call of Duty: Warzone cheats require Secure Boot to be turned off in the BIOS citeturn0search6.

### Steps to Disable Secure Boot

1. **Access BIOS/UEFI Settings**: Restart your computer and enter the BIOS/UEFI setup (usually by pressing a key like F2, F10, or Del during startup).
2. **Locate Secure Boot Option**: Navigate to the "Security" or "Boot" tab to find the Secure Boot setting.
3. **Disable Secure Boot**: Change the setting to "Disabled."
4. **Save and Exit**: Save your changes and exit the BIOS/UEFI setup.

### Important Considerations

- **Security Risks**: Disabling Secure Boot reduces your system's protection against certain types of malware and unauthorized software.
- **Game Integrity**: Using cheats can violate game terms of service, potentially leading to bans or other penalties.
- **System Stability**: Running unsigned code can affect system stability and performance.

Always weigh the risks and benefits before proceeding.

If you need assistance with disabling Secure Boot on your specific system, please provide your motherboard or laptop model, and I can guide you through the process.


---

**User** (2025-04-12T02:33:05.505425):
Btw I accidentally restarted my computer and I forgot it was backing up oops


---

**Assistant** (2025-04-12T02:33:06.822458):
No worries—accidentally restarting your computer during a backup is a common hiccup, and most modern backup tools are designed to handle such interruptions gracefully.

### What Happens After an Interrupted Backup?

Most backup software, including tools like Backblaze, rsync, Duplicati, and Restic, can resume from where they left off:

- **Backblaze**: Typically resumes from the last successful upload. In rare cases, it might re-upload a portion of a large file, but overall progress is preserved. citeturn0search0

- **rsync**: By default, it skips files that have already been copied. To resume partially transferred files, use the `--partial` and `--append-verify` flags. citeturn0search1

- **Duplicati**: Handles interruptions by resuming uploads and cleaning up incomplete files upon the next run. citeturn0search5

- **Restic**: Automatically resumes backups from the point of interruption. citeturn0search3

### What You Should Do

1. **Restart the Backup**: Open your backup application and initiate the backup process again. Most tools will detect the previous state and continue from where they left off.

2. **Check for Errors**: After the backup resumes, monitor the process for any error messages or warnings to ensure everything is proceeding smoothly.

3. **Review Logs**: If your backup tool provides logs or reports, review them to confirm that all intended files are being backed up correctly.

If you let me know which backup software you're using, I can provide more specific guidance tailored to that tool.


---

**User** (2025-04-12T02:33:46.795673):
We should definitely not restart the backup wait I think I bricked my comp again maybe


---

**Assistant** (2025-04-12T02:33:48.491208):
I'm sorry to hear you're experiencing issues with your computer. Let's work through some steps to diagnose and potentially resolve the problem.

**Understanding the Situation:**

- **Interrupted Backup:** Restarting your computer during a backup can sometimes lead to system instability, especially if critical system files were being copied or modified.

- **Secure Boot Settings:** Disabling Secure Boot to run certain software can expose your system to unsigned or potentially harmful code, which might lead to system issues.

**Steps to Troubleshoot:**

1. **Attempt Safe Mode Boot:**

   - **Purpose:** Safe Mode starts Windows with a minimal set of drivers and services, which can help in diagnosing issues.

   - **How to Access:**

     - Power off your computer completely.

     - Power it back on and immediately start pressing the **F8** key (on some systems, it might be **Shift + F8**) repeatedly.

     - If successful, you'll see the Advanced Boot Options menu.

     - Select **Safe Mode** and press Enter.

   - **If You Can Boot into Safe Mode:**

     - Consider performing a **System Restore** to revert your system to a previous stable state:

       - Press **Windows + R**, type `rstrui.exe`, and press Enter.

       - Follow the prompts to choose a restore point before the issues began.

2. **Use Windows Recovery Environment (WinRE):**

   - **Purpose:** WinRE provides tools to repair common causes of unbootable operating systems.

   - **How to Access:**

     - Turn off your computer.

     - Turn it back on and, as soon as the Windows logo appears, press and hold the power button to force a shutdown. Repeat this process 2-3 times. On the next startup, Windows should enter WinRE.

   - **In WinRE:**

     - Select **Troubleshoot** > **Advanced options**.

     - Try **Startup Repair** first.

     - If that doesn't work, consider using **System Restore** from this menu.


---

**User** (2025-04-12T02:34:00.262847):
Oh no we’re good


---

**Assistant** (2025-04-12T02:34:01.300622):
I'm glad to hear your computer is functioning properly again! If you have any further questions or need assistance with anything else, feel free to ask.


---
