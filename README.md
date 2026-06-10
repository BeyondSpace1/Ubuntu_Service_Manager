<div align="center">

# ⚡ Service Commander

**A GNOME Shell extension that translates system services into plain English — with one-click start/stop controls.**

[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-45%20•%2046%20•%2047%20•%2048%20•%2049%20•%2050-blue?style=flat-square&logo=gnome&logoColor=white)](https://extensions.gnome.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Ubuntu%2022.04%2B-orange?style=flat-square&logo=ubuntu&logoColor=white)](https://ubuntu.com)
[![systemd](https://img.shields.io/badge/requires-systemd-red?style=flat-square)](https://systemd.io)

</div>

---

## What is this?

Most Linux users have no idea what `avahi-daemon.service`, `ModemManager.service`, or `systemd-resolved.service` actually do. **Service Commander** solves that.

It adds a **⚙ Services** button to your GNOME top bar. Click it and you get a clean panel showing every running (and stopped) system service in human-readable language — with a toggle to start or stop any of them instantly.

No terminal. No `sudo systemctl`. Just a clear list and a button.

---

## Features

- **Plain-language labels** — 35+ common services mapped to readable names (`NetworkManager.service` → *Wi-Fi & Network*, `docker.service` → *Docker*, etc.)
- **Live status indicators** — green dot for running, dimmed for stopped
- **Start / Stop toggle** — authenticated via polkit; prompts for password once per session
- **Search & filter** — type to instantly narrow down the list
- **Smart sort** — running services float to the top; everything else alphabetical
- **Auto-prettify** — unlabelled services get cleaned-up names automatically (e.g. `my-custom-app.service` → *My custom app*)

---

## Requirements

| Requirement | Version |
|---|---|
| GNOME Shell | 45 – 50.x |
| Ubuntu | 22.04+ (or any distro with GNOME + systemd) |
| systemd | any modern version |
| pkexec / polkit | pre-installed on all Ubuntu systems |

---

## Installation

### Option A — Install script (recommended)

```bash
git clone https://github.com/BeyondSpace1/service-commander.git
cd service-commander
chmod +x install.sh
./install.sh
```

Then restart GNOME Shell:

| Session type | How to restart |
|---|---|
| **Wayland** (Ubuntu 22.04+ default) | Log out → Log back in |
| **X11** | Press `Alt + F2`, type `r`, press `Enter` |

### Option B — Manual install

```bash
UUID="service-commander@beyondspace"

# 1. Copy extension files
mkdir -p ~/.local/share/gnome-shell/extensions/$UUID
cp extension.js metadata.json stylesheet.css ~/.local/share/gnome-shell/extensions/$UUID/

# 2. Install polkit policy (required for service toggling)
sudo cp org.beyondspace.servicecommander.policy /usr/share/polkit-1/actions/

# 3. Enable the extension
gnome-extensions enable $UUID
```

Then restart GNOME Shell as above.

---

## Verifying it works

After restarting, confirm the extension loaded:

```bash
gnome-extensions show service-commander@beyondspace | grep State
# Expected: State: ACTIVE
```

Then look for **⚙ Services** in your top panel.

---

## How service toggling works

Clicking **Start** or **Stop** runs:

```
pkexec systemctl start <service>
pkexec systemctl stop  <service>
```

`pkexec` triggers a standard polkit authentication dialog — you enter your password once and it stays authenticated for the session. No permanent root access is granted, and no passwords are stored.

---

## Adding custom service labels

Open `extension.js` and find the `SERVICE_LABELS` object near the top. Add your own entry:

```js
'myapp.service': { label: 'My Application', icon: '🚀' },
```

Save the file, disable and re-enable the extension, then log out and back in.

---

## Uninstalling

```bash
# Disable and remove extension
gnome-extensions disable service-commander@beyondspace
rm -rf ~/.local/share/gnome-shell/extensions/service-commander@beyondspace

# Remove polkit policy
sudo rm -f /usr/share/polkit-1/actions/org.beyondspace.servicecommander.policy
```

---

## Troubleshooting

**Extension shows `OUT OF DATE`**

Your GNOME Shell version isn't in `metadata.json`. Check your version and update the file:

```bash
gnome-shell --version
# Add the version string (e.g. "50.1") to shell-version in metadata.json
```

**Extension shows `ERROR` state**

Check the GNOME Shell journal for the exact error:

```bash
journalctl /usr/bin/gnome-shell --since "2 minutes ago" | grep -i "service-commander"
```

**Toggling a service does nothing**

Make sure the polkit policy is installed:

```bash
ls /usr/share/polkit-1/actions/org.beyondspace.servicecommander.policy
# If missing: sudo cp org.beyondspace.servicecommander.policy /usr/share/polkit-1/actions/
```

**⚙ Services button not visible in panel**

With many extensions installed (Vitals, Dash to Dock, AppIndicators), the panel can get crowded. Check the right side of the top bar carefully, or temporarily disable other extensions to locate it.

---

## GNOME version compatibility

| GNOME | Ubuntu | Status |
|---|---|---|
| 45 | 23.10 | ✅ Supported |
| 46 | 24.04 LTS | ✅ Supported |
| 47 | 24.10 | ✅ Supported |
| 48 | 25.04 | ✅ Supported |
| 49 | 25.10 | ✅ Supported |
| 50 / 50.1 | 26.04 | ✅ Supported |

---

## Project structure

```
service-commander@beyondspace/
├── extension.js          # Core extension logic
├── metadata.json         # GNOME Shell metadata & version compatibility
├── stylesheet.css        # Panel button styles
├── install.sh            # One-shot installer script
└── org.beyondspace.servicecommander.policy   # Polkit authentication policy
```

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built by [BeyondSpace1](https://github.com/BeyondSpace1) · Part of the AI & Security tools portfolio

</div>
