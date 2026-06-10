# ⚡ Service Commander

> A GNOME Shell extension that lists all running system services in plain English — with a one-click toggle to start or stop each one.

---

## What it does

- **Plain-language names** — "Wi-Fi & Network" instead of `NetworkManager.service`, "Docker" instead of `docker.service`, etc.
- **Live status** — green dot for running, dim for stopped
- **Search/filter** — instantly filter by service name
- **Toggle** — Start/Stop any service with one click (polkit password prompt keeps it secure)
- **Sorted** — Running services appear first; everything alphabetical within

---

## Requirements

- Ubuntu 22.04+ (or any distro with GNOME 45–48)
- `systemd` (standard on all modern Ubuntu)
- `pkexec` / polkit (standard — for authenticated service toggling)

---

## Install

```bash
chmod +x install.sh
./install.sh
```

Then:
- **Wayland** (Ubuntu 22.04+ default): Log out and log back in
- **X11**: Press `Alt+F2`, type `r`, hit Enter

Look for **⚙ Services** in the top bar.

---

## Manual install (no script)

```bash
# 1. Copy extension
UUID="service-commander@beyondspace"
mkdir -p ~/.local/share/gnome-shell/extensions/$UUID
cp extension.js metadata.json stylesheet.css ~/.local/share/gnome-shell/extensions/$UUID/

# 2. Install polkit policy
sudo cp org.beyondspace.servicecommander.policy /usr/share/polkit-1/actions/

# 3. Enable
gnome-extensions enable $UUID

# 4. Restart GNOME Shell (X11 only — Wayland requires log out)
# Alt+F2 → r → Enter
```

---

## How toggling works

Clicking **Start** or **Stop** runs:
```
pkexec systemctl start/stop <service>
```
`pkexec` triggers a polkit authentication dialog — you enter your password once per session. No permanent root access is granted.

---

## Adding custom service labels

Edit `extension.js` and add entries to the `SERVICE_LABELS` object at the top:

```js
'myapp.service': { label: 'My Custom App', icon: '🚀' },
```

---

## Uninstall

```bash
gnome-extensions disable service-commander@beyondspace
rm -rf ~/.local/share/gnome-shell/extensions/service-commander@beyondspace
sudo rm -f /usr/share/polkit-1/actions/org.beyondspace.servicecommander.policy
```

---

## GNOME version support

| GNOME | Ubuntu    | Status  |
|-------|-----------|---------|
| 45    | 23.10     | ✅      |
| 46    | 24.04 LTS | ✅      |
| 47    | 24.10     | ✅      |
| 48    | 25.04     | ✅      |

---

Built by [BeyondSpace1](https://github.com/BeyondSpace1)
