import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

// ── Human-readable labels for common systemd services ──────────────────────
const SERVICE_LABELS = {
  'NetworkManager.service':        { label: 'Wi-Fi & Network',          icon: '📡' },
  'bluetooth.service':             { label: 'Bluetooth',                 icon: '🔵' },
  'cups.service':                  { label: 'Printing (CUPS)',           icon: '🖨️' },
  'ssh.service':                   { label: 'SSH Server',                icon: '🔐' },
  'sshd.service':                  { label: 'SSH Daemon',                icon: '🔐' },
  'ufw.service':                   { label: 'Firewall (UFW)',            icon: '🛡️' },
  'snapd.service':                 { label: 'Snap Packages',            icon: '📦' },
  'docker.service':                { label: 'Docker',                    icon: '🐳' },
  'postgresql.service':            { label: 'PostgreSQL Database',       icon: '🗄️' },
  'mysql.service':                 { label: 'MySQL Database',            icon: '🗄️' },
  'mariadb.service':               { label: 'MariaDB Database',         icon: '🗄️' },
  'redis.service':                 { label: 'Redis Cache',               icon: '⚡' },
  'nginx.service':                 { label: 'NGINX Web Server',          icon: '🌐' },
  'apache2.service':               { label: 'Apache Web Server',        icon: '🌐' },
  'cron.service':                  { label: 'Scheduled Tasks (Cron)',    icon: '⏰' },
  'avahi-daemon.service':          { label: 'Local Network Discovery',  icon: '🔍' },
  'ModemManager.service':          { label: 'Mobile Broadband',         icon: '📶' },
  'gdm.service':                   { label: 'Login Screen (GDM)',       icon: '🖥️' },
  'lightdm.service':               { label: 'Login Screen (LightDM)',   icon: '🖥️' },
  'pulseaudio.service':            { label: 'Audio (PulseAudio)',       icon: '🔊' },
  'pipewire.service':              { label: 'Audio/Video (PipeWire)',   icon: '🔊' },
  'flatpak.service':               { label: 'Flatpak Apps',             icon: '📦' },
  'containerd.service':            { label: 'Container Runtime',        icon: '📦' },
  'systemd-resolved.service':      { label: 'DNS Resolver',             icon: '🌍' },
  'systemd-timesyncd.service':     { label: 'Clock Sync (NTP)',         icon: '🕐' },
  'thermald.service':              { label: 'CPU Thermal Control',      icon: '🌡️' },
  'tlp.service':                   { label: 'Battery Optimizer (TLP)',  icon: '🔋' },
  'fwupd.service':                 { label: 'Firmware Updater',         icon: '🔧' },
  'packagekit.service':            { label: 'Software Updates',        icon: '🔄' },
  'udisks2.service':               { label: 'Disk Manager',             icon: '💾' },
  'upower.service':                { label: 'Power Management',         icon: '⚡' },
  'colord.service':                { label: 'Color Profiles',           icon: '🎨' },
  'geoclue.service':               { label: 'Location Services',        icon: '📍' },
  'accounts-daemon.service':       { label: 'User Accounts',            icon: '👤' },
  'polkit.service':                { label: 'Permission Manager',       icon: '🔑' },
  'rtkit-daemon.service':          { label: 'Realtime Audio Priority',  icon: '🎵' },
  'wpa_supplicant.service':        { label: 'Wi-Fi Authentication',     icon: '🔒' },
};

function humanReadable(name) {
  if (SERVICE_LABELS[name]) return SERVICE_LABELS[name];
  // strip .service suffix and prettify
  let clean = name.replace(/\.service$/, '').replace(/[-_]/g, ' ');
  clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  return { label: clean, icon: '⚙️' };
}

// ── Run shell command, return stdout ────────────────────────────────────────
function runCommand(argv) {
  try {
    const [ok, stdout] = GLib.spawn_sync(
      null, argv, null,
      GLib.SpawnFlags.SEARCH_PATH,
      null
    );
    if (!ok) return null;
    return new TextDecoder().decode(stdout).trim();
  } catch (_) { return null; }
}

// ── Fetch active/enabled services via systemctl ─────────────────────────────
function fetchServices() {
  const out = runCommand([
    'systemctl', 'list-units',
    '--type=service',
    '--state=active,inactive,failed',
    '--no-pager', '--no-legend',
    '--plain'
  ]);
  if (!out) return [];

  const services = [];
  for (const line of out.split('\n')) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) continue;
    const [unitName, load, active] = parts;
    if (!unitName.endsWith('.service')) continue;
    if (load !== 'loaded') continue;

    const isRunning = (active === 'active');
    const { label, icon } = humanReadable(unitName);
    services.push({ unitName, label, icon, isRunning });
  }

  // Sort: running first, then alphabetically
  services.sort((a, b) => {
    if (a.isRunning !== b.isRunning) return a.isRunning ? -1 : 1;
    return a.label.localeCompare(b.label);
  });

  return services;
}

// ── Toggle a service (requires pkexec / polkit) ─────────────────────────────
function toggleService(unitName, enable, callback) {
  const action = enable ? 'start' : 'stop';
  const proc = new Gio.Subprocess({
    argv: ['pkexec', 'systemctl', action, unitName],
    flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
  });
  proc.init(null);
  proc.wait_async(null, (source, res) => {
    try {
      source.wait_finish(res);
      callback(source.get_successful());
    } catch (_) {
      callback(false);
    }
  });
}

// ── Panel Button ─────────────────────────────────────────────────────────────
const ServiceCommanderIndicator = GObject.registerClass(
class ServiceCommanderIndicator extends PanelMenu.Button {

  _init(ext) {
    super._init(0.0, 'Service Commander');
    this._ext = ext;
    this._services = [];
    this._filter = '';
    this._refreshTimeout = null;
    this._toggleItems = new Map();

    // ── Top-bar label ─────────────────────────────────────────────────────
    const hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
    hbox.add_child(new St.Label({
      text: '⚙ Services',
      y_align: Clutter.ActorAlign.CENTER,
      style: 'font-weight: bold; font-size: 12px; padding: 0 4px;'
    }));
    this.add_child(hbox);

    this._buildMenu();

    // Refresh on open
    this.menu.connect('open-state-changed', (menu, open) => {
      if (open) this._refresh();
    });
  }

  _buildMenu() {
    const menu = this.menu;
    menu.actor.style = `
      min-width: 420px;
      background-color: #0d0d0d;
      border: 1px solid #1a1a1a;
      border-radius: 8px;
    `;

    // ── Header ────────────────────────────────────────────────────────────
    const headerItem = new PopupMenu.PopupBaseMenuItem({
      reactive: false,
      style_class: '',
    });
    const headerBox = new St.BoxLayout({
      vertical: true,
      style: 'padding: 10px 14px 6px 14px;'
    });
    const titleLabel = new St.Label({
      text: '⚡ SERVICE COMMANDER',
      style: `
        font-family: monospace;
        font-size: 13px;
        font-weight: bold;
        color: #00ff88;
        letter-spacing: 1px;
      `
    });
    this._statusLabel = new St.Label({
      text: 'Loading…',
      style: 'font-size: 11px; color: #555; font-family: monospace; margin-top: 2px;'
    });
    headerBox.add_child(titleLabel);
    headerBox.add_child(this._statusLabel);
    headerItem.add_child(headerBox);
    menu.addMenuItem(headerItem);

    // ── Search box ────────────────────────────────────────────────────────
    const searchItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
    const searchBox = new St.BoxLayout({
      style: 'padding: 4px 14px 8px 14px;'
    });
    this._searchEntry = new St.Entry({
      hint_text: '🔍  filter services…',
      style: `
        background-color: #111;
        border: 1px solid #222;
        border-radius: 6px;
        color: #ccc;
        font-family: monospace;
        font-size: 12px;
        padding: 6px 10px;
        width: 370px;
      `
    });
    this._searchEntry.get_clutter_text().connect('text-changed', () => {
      this._filter = this._searchEntry.get_text().toLowerCase();
      this._renderList();
    });
    searchBox.add_child(this._searchEntry);
    searchItem.add_child(searchBox);
    menu.addMenuItem(searchItem);

    menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    // ── Scrollable list ───────────────────────────────────────────────────
    const scrollItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
    const scrollBox = new St.ScrollView({
      style: 'max-height: 380px; min-width: 390px;',
      overlay_scrollbars: true,
    });
    scrollBox.set_policy(St.PolicyType.NEVER, St.PolicyType.AUTOMATIC);

    this._listBox = new St.BoxLayout({
      vertical: true,
      style: 'padding: 4px 14px 8px 14px;'
    });
    scrollBox.set_child(this._listBox);
    scrollItem.add_child(scrollBox);
    menu.addMenuItem(scrollItem);

    menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    // ── Footer: refresh ───────────────────────────────────────────────────
    const footerItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
    const footerBox = new St.BoxLayout({
      style: 'padding: 6px 14px 8px 14px; justify-content: space-between;'
    });
    this._refreshBtn = new St.Button({
      label: '↻  Refresh',
      style: `
        background-color: #111;
        border: 1px solid #222;
        border-radius: 5px;
        color: #888;
        font-family: monospace;
        font-size: 11px;
        padding: 5px 14px;
        cursor: pointer;
      `
    });
    this._refreshBtn.connect('clicked', () => this._refresh());
    this._lastRefreshLabel = new St.Label({
      text: '',
      style: 'font-size: 10px; color: #333; font-family: monospace; align-self: center;'
    });
    footerBox.add_child(this._refreshBtn);
    footerBox.add_child(this._lastRefreshLabel);
    footerItem.add_child(footerBox);
    menu.addMenuItem(footerItem);
  }

  _refresh() {
    this._statusLabel.set_text('Scanning services…');
    this._listBox.remove_all_children();
    this._toggleItems.clear();

    // Run in an idle callback so UI doesn't freeze
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      this._services = fetchServices();
      this._renderList();
      const now = new Date();
      const t = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
      this._lastRefreshLabel.set_text(`Last scan: ${t}`);
      return GLib.SOURCE_REMOVE;
    });
  }

  _renderList() {
    this._listBox.remove_all_children();
    this._toggleItems.clear();

    const filtered = this._services.filter(s => {
      if (!this._filter) return true;
      return s.label.toLowerCase().includes(this._filter) ||
             s.unitName.toLowerCase().includes(this._filter);
    });

    const running = filtered.filter(s => s.isRunning).length;
    this._statusLabel.set_text(`${running} running · ${filtered.length} total`);

    if (filtered.length === 0) {
      const empty = new St.Label({
        text: 'No services match your search.',
        style: 'color: #444; font-family: monospace; font-size: 12px; padding: 12px 0;'
      });
      this._listBox.add_child(empty);
      return;
    }

    for (const svc of filtered) {
      this._listBox.add_child(this._makeRow(svc));
    }
  }

  _makeRow(svc) {
    const row = new St.BoxLayout({
      style: `
        padding: 7px 0;
        border-bottom: 1px solid #161616;
        justify-content: space-between;
      `
    });

    // Left: icon + name + unit
    const left = new St.BoxLayout({ vertical: true });

    const nameRow = new St.BoxLayout();
    const iconLabel = new St.Label({
      text: svc.icon + '  ',
      style: 'font-size: 13px; color: #ccc;'
    });
    const nameLabel = new St.Label({
      text: svc.label,
      style: `
        font-size: 13px;
        color: ${svc.isRunning ? '#e8e8e8' : '#555'};
        font-weight: ${svc.isRunning ? 'bold' : 'normal'};
      `
    });
    nameRow.add_child(iconLabel);
    nameRow.add_child(nameLabel);

    const unitLabel = new St.Label({
      text: svc.unitName,
      style: 'font-size: 10px; color: #333; font-family: monospace; margin-top: 1px;'
    });

    left.add_child(nameRow);
    left.add_child(unitLabel);

    // Right: status dot + toggle
    const right = new St.BoxLayout({
      style: 'align-self: center; padding-left: 12px;',
    });

    const dot = new St.Label({
      text: svc.isRunning ? '●' : '○',
      style: `
        font-size: 11px;
        color: ${svc.isRunning ? '#00ff88' : '#444'};
        margin-right: 8px;
        align-self: center;
      `
    });

    const toggle = new St.Button({
      label: svc.isRunning ? 'Stop' : 'Start',
      style: `
        background-color: ${svc.isRunning ? '#1a0000' : '#001a0a'};
        border: 1px solid ${svc.isRunning ? '#4a0000' : '#005522'};
        border-radius: 4px;
        color: ${svc.isRunning ? '#ff4444' : '#00cc66'};
        font-family: monospace;
        font-size: 11px;
        padding: 4px 12px;
        cursor: pointer;
      `
    });

    toggle.connect('clicked', () => {
      toggle.set_label('…');
      toggle.set_reactive(false);
      toggle.style = `
        background-color: #111;
        border: 1px solid #333;
        border-radius: 4px;
        color: #666;
        font-family: monospace;
        font-size: 11px;
        padding: 4px 12px;
      `;
      toggleService(svc.unitName, !svc.isRunning, (success) => {
        if (success) {
          // Refresh after a short delay
          GLib.timeout_add(GLib.PRIORITY_DEFAULT, 800, () => {
            this._refresh();
            return GLib.SOURCE_REMOVE;
          });
        } else {
          // Revert label on failure
          toggle.set_label(svc.isRunning ? 'Stop' : 'Start');
          toggle.set_reactive(true);
        }
      });
    });

    right.add_child(dot);
    right.add_child(toggle);

    row.add_child(left);
    row.add_child(right);
    return row;
  }

  destroy() {
    if (this._refreshTimeout) {
      GLib.source_remove(this._refreshTimeout);
      this._refreshTimeout = null;
    }
    super.destroy();
  }
});

// ── Extension entry point ────────────────────────────────────────────────────
export default class ServiceCommanderExtension extends Extension {
  enable() {
    this._indicator = new ServiceCommanderIndicator(this);
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._indicator?.destroy();
    this._indicator = null;
  }
}
