---
title: "Hyper-V Boot Loop Fix"
date: 2025-04-11
tags: [ogzprime, systems, trading]
---

# Hyper-V Boot Loop Fix

**User** (2025-04-11T09:18:45.973727):
Man that’s like divide or something so my comp is stuck in a boot loop before I exited windows I was running a thing that shuts down my comp and reboots it whenever it does what it does in the console I enabled hyper v windows hyper vision and virtual machine something or another restarted and it’s in the boot loop again the motherboard is posting I can hear it is this fixable also I can get into bios


---

**Assistant** (2025-04-11T09:18:47.501039):
It sounds like enabling Hyper-V has caused your system to enter a boot loop. This issue can occur due to hardware incompatibilities or conflicts with other virtualization features. Since you can access the BIOS, there are several steps you can take to resolve this problem.

---

### 🔧 Step-by-Step Recovery Guide

#### 1. **Boot into Safe Mode**
If you can interrupt the boot process three times, Windows should enter the Recovery Environment:
- Force shutdown your PC during the boot logo three times.
- On the fourth boot, Windows should enter the Recovery Environment.
- Navigate to **Advanced Options > Startup Settings > Restart**.
- After the restart, select **Safe Mode**.

#### 2. **Disable Hyper-V via Command Line**
Once in Safe Mode, open an elevated Command Prompt and execute:
```bash
bcdedit /set hypervisorlaunchtype off
```

This command prevents Hyper-V from launching during boot. citeturn0search10

#### 3. **Disable Hyper-V Features**
Still in Safe Mode, open PowerShell as Administrator and run:
```powershell
Disable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All
```

This command disables all Hyper-V components. citeturn0search10

#### 4. **Disable Related Features**
Some features depend on Hyper-V and can cause issues:
- Open **Control Panel > Programs > Turn Windows features on or off**.
- Uncheck the following:
  - **Virtual Machine Platform**
  - **Windows Hypervisor Platform**
  - **Hyper-V**
- Click **OK** and restart your PC.

#### 5. **Check BIOS Settings**
If the issue persists, check your BIOS settings:
- Enter BIOS/UEFI settings during startup (usually by pressing **F2**, **Del**, or **Esc**).
- Look for virtualization settings, such as **Intel VT-x** or **AMD-V**, and disable them.
- Save changes and exit BIOS.

---

### 🛠️ Additional Troubleshooting
- If you cannot access Safe Mode, you might need to create a Windows installation media on another computer and use it to boot into recovery mode.
- Consider performing a System Restore to revert your system to a state before Hyper-V was enabled.

---

If you need further assistance with any of these steps or encounter specific errors, feel free to provide more details, and I'll be glad to help you troubleshoot further.


---

**User** (2025-04-11T09:19:38.972684):
How do I get into safe mode without doing the restart three times or whatever


---

**Assistant** (2025-04-11T09:19:39.947463):
If your computer is stuck in a boot loop and you're unable to access Windows normally, there are alternative methods to enter Safe Mode without relying on interrupting the boot process multiple times. Here are some approaches you can try:

### 1. **Access Safe Mode via Windows Recovery Environment (WinRE)**

Windows is designed to enter the Windows Recovery Environment automatically after three consecutive failed boot attempts. However, if this doesn't occur, you can manually access it:

1. **Power On and Interrupt Boot**:
   - Turn on your computer.
   - As Windows attempts to boot, press and hold the power button for about 10 seconds until the system shuts down.
   - Repeat this process twice.
   - On the third attempt, allow the computer to boot normally. It should enter the **Windows Recovery Environment (WinRE)**.

2. **Navigate to Safe Mode**:
   - In WinRE, select **Troubleshoot** > **Advanced options** > **Startup Settings** > **Restart**.
   - After the system restarts, you'll see a list of options.
   - Press **4** or **F4** to start in Safe Mode. If you need network access, press **5** or **F5** for Safe Mode with Networking.

*Note*: This method is detailed in [TechRepublic's guide on accessing Safe Mode](https://www.techrepublic.com/article/pro-tip-7-ways-to-access-safe-mode-in-windows-10/).

### 2. **Using a Windows Installation Media**

If the above method doesn't work, you can use a Windows installation USB or DVD:

1. **Create Installation Media**:
   - On a different computer, download the [Windows Media Creation Tool](https://www.microsoft.com/software-download/windows10) from Microsoft's official site.
   - Use it to create a bootable USB drive or burn a DVD.

2. **Boot from Installation Media**:
   - Insert the USB or DVD into your malfunctioning computer.
   - Restart the computer and boot from the installation media. You might need to change the boot order in your BIOS/UEFI settings to do this.

3. **Access Safe Mode**:
   - In the Windows Setup screen, click **Next**, then select **Repair your computer**.
   - Choose **Troubleshoot** > **Advanced options** > **Command Prompt**.
   - In the Command Prompt window, type:
     ```
     bcdedit /set {default} safeboot minimal
     ```
   - Press Enter. After the command executes successfully, close the Command Prompt and restart your computer. It should boot into Safe Mode.

*Note*: Detailed steps are available in [Digital Citizen's guide on booting in Safe Mode](https://www.digitalcitizen.life/4-ways-boot-safe-mode-windows-10/).

### 3. **Utilize the BIOS/UEFI Firmware Settings**

Some systems allow you to boot into Safe Mode directly from the BIOS/UEFI settings:

1. **Enter BIOS/UEFI**:
   - Restart your computer.
   - Press the appropriate key (commonly **F2**, **Del**, or **Esc**) during startup to enter BIOS/UEFI settings.

2. **Change Boot Options**:
   - Look for an option related to boot modes or advanced startup.
   - Some systems provide an option to boot directly into Safe Mode from here.

*Note*: Access methods can vary based on the manufacturer. Refer to [Tom's Hardware guide on BIOS access keys](https://www.tomshardware.com/reviews/bios-keys-to-access-your-firmware%2C5732.html) for specific instructions.

**Caution**: Modifying BIOS/UEFI settings can affect system stability. Ensure you understand the changes you're making, and consult your motherboard's manual or manufacturer's website for guidance.

If you're still unable to access Safe Mode using these methods, it may indicate a more severe issue with your system. In such cases, consider seeking assistance from a professional technician or contacting your computer manufacturer's support.


---

**User** (2025-04-11T09:21:37.035209):
I’m sorry it’s not in a boot loop the motherboard posts that first screen comes up telling you like how to get into bios then black screen after that


---

**Assistant** (2025-04-11T09:21:37.873396):
If your PC displays the motherboard splash screen and then transitions to a black screen, it indicates that the BIOS is initializing correctly, but the system fails to proceed to the bootloader or operating system. This issue can stem from various causes, including misconfigured BIOS settings, hardware conflicts, or corrupted boot data. Here's a structured approach to diagnose and potentially resolve the problem:

---

### 🔍 Step-by-Step Troubleshooting

#### 1. **Verify Display Connections**
- **Monitor Input**: Ensure your monitor is set to the correct input source (e.g., HDMI, DisplayPort).
- **Cable Check**: Inspect video cables for damage and confirm secure connections.
- **Integrated Graphics**: If your CPU has integrated graphics, try connecting the monitor to the motherboard's video output. This can help determine if the discrete GPU is causing the issue. citeturn0search8

#### 2. **Access BIOS Settings**
- **Boot Order**: Enter the BIOS setup (commonly by pressing `Del`, `F2`, or `Esc` during startup) and verify that the primary boot device is correctly set (e.g., your SSD or HDD).
- **UEFI/Legacy Mode**: Ensure that the BIOS is configured to the appropriate mode (UEFI or Legacy) that matches your operating system installation.
- **Reset to Defaults**: Consider resetting BIOS settings to default to eliminate misconfigurations.

#### 3. **Disconnect External Devices**
- **Peripherals**: Unplug all non-essential peripherals (USB drives, external hard drives, printers) to rule out external hardware conflicts.
- **Internal Drives**: Temporarily disconnect secondary internal drives, leaving only the primary boot drive connected. citeturn0news24

#### 4. **Check for Hardware Issues**
- **RAM**: Reseat memory modules and try booting with one stick at a time to identify faulty RAM.
- **GPU**: If using a discrete GPU, reseat it or test with a different GPU if available.
- **Storage Devices**: A failing or corrupted drive can prevent booting. Disconnect all drives and see if the BIOS progresses past the splash screen. citeturn0search4

#### 5. **Attempt Recovery**
- **Windows Recovery Environment (WinRE)**: If the system attempts to boot but fails, it may enter WinRE. From here, you can try Startup Repair or System Restore.
- **Bootable Media**: Create a bootable USB with Windows installation media on another computer. Boot from this USB to access recovery tools or reinstall Windows if necessary.

---

### 🛠️ Additional Considerations

- **Recent Changes**: Reflect on any recent hardware or software changes, such as BIOS updates or driver installations, that could have introduced the issue.
- **BIOS Update**: If the BIOS was recently updated, ensure the update was successful. An incomplete or failed BIOS update can cause boot issues.
- **CMOS Reset**: Resetting the CMOS by removing the motherboard battery for a few minutes can clear potential BIOS-related problems.

---

If these steps don't resolve the issue, please provide additional details about your system's specifications, recent changes, or any error messages you've encountered. This information can help in offering more targeted assistance.


---

**User** (2025-04-11T09:22:40.603119):
Goddamnit man


---

**Assistant** (2025-04-11T09:22:41.491497):
I'm sorry to hear you're dealing with this frustrating issue. Given that your system displays the motherboard splash screen but then transitions to a black screen, it's likely that the BIOS is initializing correctly, but the system fails to proceed to the bootloader or operating system. Let's go through some steps to diagnose and potentially resolve the problem:

---

### 🔍 Step-by-Step Troubleshooting

#### 1. **Verify Display Connections**
- **Monitor Input**: Ensure your monitor is set to the correct input source (e.g., HDMI, DisplayPort).
- **Cable Check**: Inspect video cables for damage and confirm secure connections.
- **Integrated Graphics**: If your CPU has integrated graphics, try connecting the monitor to the motherboard's video output. This can help determine if the discrete GPU is causing the issue.

#### 2. **Access BIOS Settings**
- **Boot Order**: Enter the BIOS setup (commonly by pressing `Del`, `F2`, or `Esc` during startup) and verify that the primary boot device is correctly set (e.g., your SSD or HDD).
- **UEFI/Legacy Mode**: Ensure that the BIOS is configured to the appropriate mode (UEFI or Legacy) that matches your operating system installation.
- **Reset to Defaults**: Consider resetting BIOS settings to default to eliminate misconfigurations.

#### 3. **Disconnect External Devices**
- **Peripherals**: Unplug all non-essential peripherals (USB drives, external hard drives, printers) to rule out external hardware conflicts.
- **Internal Drives**: Temporarily disconnect secondary internal drives, leaving only the primary boot drive connected.

#### 4. **Check for Hardware Issues**
- **RAM**: Reseat memory modules and try booting with one stick at a time to identify faulty RAM.
- **GPU**: If using a discrete GPU, reseat it or test with a different GPU if available.
- **Storage Devices**: A failing or corrupted drive can prevent booting. Disconnect all drives and see if the BIOS progresses past the splash screen.

#### 5. **Attempt Recovery**
- **Windows Recovery Environment (WinRE)**: If the system attempts to boot but fails, it may enter WinRE. From here, you can try Startup Repair or System Restore.
- **Bootable Media**: Create a bootable USB with Windows installation media on another computer. Boot from this USB to access recovery tools or reinstall Windows if necessary.

---

### 🛠️ Additional Considerations

- **Recent Changes**: Reflect on any recent hardware or software changes, such as BIOS updates or driver installations, that could have introduced the issue.
- **BIOS Update**: If the BIOS was recently updated, ensure the update was successful. An incomplete or failed BIOS update can cause boot issues.
- **CMOS Reset**: Resetting the CMOS by removing the motherboard battery for a few minutes can clear potential BIOS-related problems.

---

If these steps don't resolve the issue, please provide additional details about your system's specifications, recent changes, or any error messages you've encountered. This information can help in offering more targeted assistance.


---

**User** (2025-04-11T09:23:06.216736):
I just told you what happened before this


---

**Assistant** (2025-04-11T09:23:07.622974):
I understand how frustrating this situation can be. Since enabling Hyper-V and related virtualization features, your system displays the motherboard splash screen but then transitions to a black screen, indicating that the BIOS is initializing correctly, but the system fails to proceed to the bootloader or operating system. Let's go through some steps to diagnose and potentially resolve the problem:

---

### 🔧 Step-by-Step Recovery Guide

#### 1. **Access BIOS Settings**
- **Enter BIOS**: Restart your computer and press the appropriate key (commonly `Del`, `F2`, or `Esc`) during startup to enter BIOS settings.
- **Reset to Defaults**: Within the BIOS, look for an option to reset settings to default or optimized defaults. This can eliminate misconfigurations.
- **Disable Virtualization Features**: Locate settings related to virtualization, such as **Intel VT-x**, **AMD-V**, or **SVM Mode**, and disable them.
- **Check Boot Order**: Ensure that the primary boot device is correctly set (e.g., your SSD or HDD).
- **Save and Exit**: After making changes, save the settings and exit the BIOS.

#### 2. **Create Windows Installation Media**
If the system still doesn't boot, you'll need to create a Windows installation media on another computer:
- **Download Media Creation Tool**: Visit the [Microsoft Download Center](https://www.microsoft.com/software-download/windows10) and download the Media Creation Tool.
- **Create Bootable USB**: Use the tool to create a bootable USB drive with the Windows installation files.

#### 3. **Boot from Installation Media**
- **Insert USB Drive**: Plug the bootable USB into your malfunctioning computer.
- **Enter Boot Menu**: Restart the computer and press the key to enter the boot menu (commonly `F12`, `F10`, or `Esc`).
- **Select USB Drive**: Choose the USB drive as the boot device.
- **Access Recovery Options**: Once booted, select **Repair your computer** > **Troubleshoot** > **Advanced options**.

#### 4. **Disable Hyper-V via Command Prompt**
- **Open Command Prompt**: In the Advanced options, select **Command Prompt**.
- **Execute Command**: Type the following command to prevent Hyper-V from launching during boot:
  ```bash
  bcdedit /set hypervisorlaunchtype off
  ```

- **Restart Computer**: Close the Command Prompt and restart your computer to see if it boots normally.

#### 5. **Perform System Restore (If Available)**
If disabling Hyper-V doesn't resolve the issue, you can attempt a system restore:
- **Access System Restore**: In the Advanced options, select **System Restore**.
- **Choose Restore Point**: Follow the prompts to restore your system to a point before the issue occurred.

---

### 🛠️ Additional Considerations

- **Graphics Card Issues**: A black screen error can sometimes be due to graphics card issues. If possible, try connecting your monitor to a different video output (e.g., switch from HDMI to DisplayPort) or use integrated graphics if available.
- **Hardware Conflicts**: Disconnect all non-essential peripherals (USB drives, external hard drives, printers) to rule out external hardware conflicts.
- **BIOS Update**: If the BIOS was recently updated, ensure the update was successful. An incomplete or failed BIOS update can cause boot issues.

---

If these steps don't resolve the issue, please provide additional details about your system's specifications, recent changes, or any error messages you've encountered. This information can help in offering more targeted assistance.


---

**User** (2025-04-11T09:23:35.103288):
It 100% has to do with turning on the hyper v windows


---

**Assistant** (2025-04-11T09:23:35.973382):
I understand how frustrating this situation can be. Since enabling Hyper-V and related virtualization features, your system displays the motherboard splash screen but then transitions to a black screen, indicating that the BIOS is initializing correctly, but the system fails to proceed to the bootloader or operating system. Let's go through some steps to diagnose and potentially resolve the problem:

---

### 🔧 Step-by-Step Recovery Guide

#### 1. **Access BIOS Settings**
- **Enter BIOS**: Restart your computer and press the appropriate key (commonly `Del`, `F2`, or `Esc`) during startup to enter BIOS settings.
- **Reset to Defaults**: Within the BIOS, look for an option to reset settings to default or optimized defaults. This can eliminate misconfigurations.
- **Disable Virtualization Features**: Locate settings related to virtualization, such as **Intel VT-x**, **AMD-V**, or **SVM Mode**, and disable them.
- **Check Boot Order**: Ensure that the primary boot device is correctly set (e.g., your SSD or HDD).
- **Save and Exit**: After making changes, save the settings and exit the BIOS.

#### 2. **Create Windows Installation Media**
If the system still doesn't boot, you'll need to create a Windows installation media on another computer:
- **Download Media Creation Tool**: Visit the [Microsoft Download Center](https://www.microsoft.com/software-download/windows10) and download the Media Creation Tool.
- **Create Bootable USB**: Use the tool to create a bootable USB drive with the Windows installation files.

#### 3. **Boot from Installation Media**
- **Insert USB Drive**: Plug the bootable USB into your malfunctioning computer.
- **Enter Boot Menu**: Restart the computer and press the key to enter the boot menu (commonly `F12`, `F10`, or `Esc`).
- **Select USB Drive**: Choose the USB drive as the boot device.
- **Access Recovery Options**: Once booted, select **Repair your computer** > **Troubleshoot** > **Advanced options**.

#### 4. **Disable Hyper-V via Command Prompt**
- **Open Command Prompt**: In the Advanced options, select **Command Prompt**.
- **Execute Command**: Type the following command to prevent Hyper-V from launching during boot:
  ```bash
  bcdedit /set hypervisorlaunchtype off
  ```

- **Restart Computer**: Close the Command Prompt and restart your computer to see if it boots normally.

#### 5. **Perform System Restore (If Available)**
If disabling Hyper-V doesn't resolve the issue, you can attempt a system restore:
- **Access System Restore**: In the Advanced options, select **System Restore**.
- **Choose Restore Point**: Follow the prompts to restore your system to a point before the issue occurred.

---

### 🛠️ Additional Considerations

- **Graphics Card Issues**: A black screen error can sometimes be due to graphics card issues. If possible, try connecting your monitor to a different video output (e.g., switch from HDMI to DisplayPort) or use integrated graphics if available.
- **Hardware Conflicts**: Disconnect all non-essential peripherals (USB drives, external hard drives, printers) to rule out external hardware conflicts.
- **BIOS Update**: If the BIOS was recently updated, ensure the update was successful. An incomplete or failed BIOS update can cause boot issues.

---

If these steps don't resolve the issue, please provide additional details about your system's specifications, recent changes, or any error messages you've encountered. This information can help in offering more targeted assistance.


---

**User** (2025-04-11T09:24:58.138130):
Is amd-v named anything else I’m running a search in bios and nothing is coming up


---

**Assistant** (2025-04-11T09:24:59.449697):
Yes, on AMD systems, the BIOS setting for virtualization is often labeled as **SVM Mode**, which stands for Secure Virtual Machine. This setting enables AMD-V (AMD Virtualization) technology. Depending on your motherboard manufacturer and BIOS version, the naming and location of this setting can vary.

**Common locations and labels for enabling AMD-V in BIOS:**

- **ASUS motherboards**: The setting is typically found under `Advanced > CPU Configuration` and labeled as **SVM Mode**. citeturn0search1

- **MSI motherboards**: Navigate to `OC > CPU Features`, where you'll find **SVM Mode**.

- **Gigabyte motherboards**: Look under `M.I.T. > Advanced Frequency Settings > Advanced CPU Core Settings` for the **SVM Mode** option.

- **ASRock motherboards**: The setting is usually located under `Advanced > CPU Configuration` as **SVM Mode**.

If you're unable to locate the **SVM Mode** or **AMD-V** setting:

1. **Check for BIOS Updates**: Ensure your BIOS is up to date, as newer versions may expose additional settings.

2. **Consult the Motherboard Manual**: Refer to your motherboard's user manual for specific instructions on enabling virtualization features.

3. **Contact Manufacturer Support**: If the setting is still not visible, reach out to your motherboard manufacturer's support for assistance.

Enabling **SVM Mode** should allow you to utilize virtualization features like Hyper-V. If you need further guidance, please provide your motherboard's make and model, and I can offer more tailored instructions.


---

**User** (2025-04-11T09:25:14.031383):
That’s disabled


---

**Assistant** (2025-04-11T09:25:15.861496):
I understand how frustrating this situation can be. Since enabling Hyper-V and related virtualization features, your system displays the motherboard splash screen but then transitions to a black screen, indicating that the BIOS is initializing correctly, but the system fails to proceed to the bootloader or operating system. Let's go through some steps to diagnose and potentially resolve the problem:

---

### 🔧 Step-by-Step Recovery Guide

#### 1. **Access BIOS Settings**
- **Enter BIOS**: Restart your computer and press the appropriate key (commonly `Del`, `F2`, or `Esc`) during startup to enter BIOS settings.
- **Reset to Defaults**: Within the BIOS, look for an option to reset settings to default or optimized defaults. This can eliminate misconfigurations.
- **Disable Virtualization Features**: Locate settings related to virtualization, such as **Intel VT-x**, **AMD-V**, or **SVM Mode**, and disable them.
- **Check Boot Order**: Ensure that the primary boot device is correctly set (e.g., your SSD or HDD).
- **Save and Exit**: After making changes, save the settings and exit the BIOS.

#### 2. **Create Windows Installation Media**
If the system still doesn't boot, you'll need to create a Windows installation media on another computer:
- **Download Media Creation Tool**: Visit the [Microsoft Download Center](https://www.microsoft.com/software-download/windows10) and download the Media Creation Tool.
- **Create Bootable USB**: Use the tool to create a bootable USB drive with the Windows installation files.

#### 3. **Boot from Installation Media**
- **Insert USB Drive**: Plug the bootable USB into your malfunctioning computer.
- **Enter Boot Menu**: Restart the computer and press the key to enter the boot menu (commonly `F12`, `F10`, or `Esc`).
- **Select USB Drive**: Choose the USB drive as the boot device.
- **Access Recovery Options**: Once booted, select **Repair your computer** > **Troubleshoot** > **Advanced options**.

#### 4. **Disable Hyper-V via Command Prompt**
- **Open Command Prompt**: In the Advanced options, select **Command Prompt**.
- **Execute Command**: Type the following command to prevent Hyper-V from launching during boot:
  ```bash
  bcdedit /set hypervisorlaunchtype off
  ```


- **Restart Computer**: Close the Command Prompt and restart your computer to see if it boots normally.

#### 5. **Perform System Restore (If Available)**
If disabling Hyper-V doesn't resolve the issue, you can attempt a system restore:
- **Access System Restore**: In the Advanced options, select **System Restore**.
- **Choose Restore Point**: Follow the prompts to restore your system to a point before the issue occurred.

---

### 🛠️ Additional Considerations

- **Graphics Card Issues**: A black screen error can sometimes be due to graphics card issues. If possible, try connecting your monitor to a different video output (e.g., switch from HDMI to DisplayPort) or use integrated graphics if available.
- **Hardware Conflicts**: Disconnect all non-essential peripherals (USB drives, external hard drives, printers) to rule out external hardware conflicts.
- **BIOS Update**: If the BIOS was recently updated, ensure the update was successful. An incomplete or failed BIOS update can cause boot issues.

---

If these steps don't resolve the issue, please provide additional details about your system's specifications, recent changes, or any error messages you've encountered. This information can help in offering more targeted assistance.


---

**User** (2025-04-11T09:25:41.134266):
Wait if I turn on svm I can utilize hyper v?


---

**Assistant** (2025-04-11T09:25:42.007834):
Yes, enabling **SVM Mode** in your BIOS is necessary to utilize Hyper-V on AMD systems. SVM (Secure Virtual Machine) corresponds to AMD's hardware-assisted virtualization technology, known as AMD-V. Hyper-V relies on such hardware virtualization features to function correctly.

According to Microsoft's official documentation, Hyper-V requires the following:

- A 64-bit processor with Second Level Address Translation (SLAT).
- VM Monitor Mode extensions.
- Hardware-assisted virtualization enabled in the BIOS or UEFI.
- Hardware-enforced Data Execution Prevention (DEP) enabled.

For AMD processors, hardware-assisted virtualization is provided by AMD-V, which is enabled through the SVM Mode setting in the BIOS. citeturn0search0

If SVM Mode is currently disabled in your BIOS, you'll need to enable it to use Hyper-V. After enabling SVM Mode, ensure that Hyper-V is installed and enabled in your Windows features.

Please note that enabling SVM Mode and Hyper-V can sometimes lead to compatibility issues with certain applications or system configurations. If you encounter problems after enabling these features, consider disabling them to see if the issue is resolved.

If you need assistance with enabling SVM Mode or configuring Hyper-V, feel free to ask for detailed instructions.


---

**User** (2025-04-11T09:26:06.254222):
If svm is off and hyper v is turned on and then you try to boot could it cause this issue


---

**Assistant** (2025-04-11T09:26:08.420693):
Yes, enabling Hyper-V in Windows while **SVM (Secure Virtual Machine)** is disabled in your BIOS can indeed cause boot issues, including black screens or boot loops. Hyper-V relies on hardware-assisted virtualization features provided by your CPU—**AMD-V** in the case of AMD processors—which are activated through the SVM setting in the BIOS.

When Hyper-V is enabled without the necessary hardware virtualization support, Windows may fail to boot properly. This issue has been reported by users who experienced boot failures after enabling Hyper-V while SVM was disabled. The only solution in such cases was to boot into Safe Mode and disable Hyper-V using the command:

```bash
bcdedit /set hypervisorlaunchtype off
```


To prevent such issues, ensure that SVM is enabled in your BIOS before activating Hyper-V in Windows. If you're currently unable to boot into Windows, you can use a Windows installation media to access the recovery environment and run the above command to disable Hyper-V.

If you need assistance with creating a bootable USB or accessing the recovery environment, feel free to ask.


---
