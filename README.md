<div align="center">

# ⚡ Service Commander v2
**The ultimate GNOME extension for effortless system service management.**

[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-45%20--%2048-blue?style=for-the-badge&logo=gnome&logoColor=white)](https://extensions.gnome.org)
[![Security](https://img.shields.io/badge/Security-DBus%20Native-green?style=for-the-badge&logo=shield-halved&logoColor=white)](https://github.com/BeyondSpace1)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

---

### Why Service Commander?
Forget terminal commands and cryptic systemd unit names. **Service Commander** translates your system into human language and gives you one-click control right from your top bar.

[Features] • [Installation] • [Security] • [Changelog]

</div>

---

## 🚀 Key Features

- **⚡ Native Performance**: Built on DBus for zero-lag service monitoring.
- **🛡️ Secure by Design**: Uses system-native authentication — no "hacks" or hidden root scripts.
- **🔍 Smart Search**: Instantly find services by their unit name or human-friendly label.
- **🎨 Beautifully Integrated**: Follows GNOME HIG (Human Interface Guidelines) with a modern dark aesthetic.
- **🏷️ Plain English**: `NetworkManager.service` → **Wi-Fi & Network**. Over 40 services pre-mapped.

---

## 🛠 Installation

### The One-Liner (Recommended)
```bash
curl -sSL https://raw.githubusercontent.com/BeyondSpace1/service-commander/main/install.sh | bash
```

### Manual Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/BeyondSpace1/service-commander.git
   ```
2. Run the installer:
   ```bash
   cd service-commander
   chmod +x install.sh
   ./install.sh
   ```

---

## 🛡 Security & Architecture

**Service Commander v2** is a major architectural leap. 

| Feature | v1 (Legacy) | v2 (Current) |
|---|---|---|
| **Communication** | Shell Subprocess (`spawn`) | **Native DBus Bus** |
| **Authentication** | `pkexec` Wrapper | **Systemd Polkit Agent** |
| **UI Blocking** | Synchronous (Freezes UI) | **Fully Asynchronous** |
| **Styling** | Inline JavaScript | **External CSS** |

By using the `org.freedesktop.systemd1` interface, the extension never executes shell commands. Instead, it sends structured requests that the system verifies using your local security policies.

---

## 📈 Roadmap & Versioning

We use [Semantic Versioning](https://semver.org/).
- **v2.x**: Current stable release (DBus Native).
- **v3.x**: (Upcoming) Custom service grouping and log viewing.

Check the [CHANGELOG.md](./CHANGELOG.md) for full history.

---

<div align="center">
Built with ❤️ by BeyondSpace1.
</div>
