# Changelog

All notable changes to **Service Commander** will be documented in this file.

## [2.0.1] - 2026-06-19
### 🔧 Fixed
- **UI Row Alignment**: Added horizontal expansion to service row metadata, ensuring Start/Stop buttons and status dots align neatly on the right side of the dropdown.
- **Proxy Ready Eager Refresh**: Eagerly refreshes the service list when the DBus proxy initializes, avoiding temporary "Error: DBus Proxy not ready" states when opening the menu for the first time.
- **Installer Version Sync**: Synchronized version identifiers to v2.0.1.

## [2.0.0] - 2026-06-13
### ✨ Added
- **Native DBus Integration**: Migrated unit fetching and toggling to `org.freedesktop.systemd1`. This removes the dependency on `pkexec systemctl` for most operations.
- **Async Architecture**: All system calls are now non-blocking, ensuring a butter-smooth GNOME Shell UI.
- **Modern UI Refresh**: Completely refactored stylesheet with support for rounded corners, hover states, and better typography.

### 🛡️ Security
- **Secure Communication**: Replaced shell spawning with structured DBus messages.
- **Policy Compliance**: Aligned unit management with system-native Polkit handling.

### 🎨 UI/UX
- Moved all hardcoded styles to `stylesheet.css`.
- Added high-contrast status dots.
- Improved search responsiveness.

## [1.0.0] - 2026-05-10
### Added
- Initial release with `pkexec` support.
- Basic service mapping for 35+ services.
- Search and filter functionality.
