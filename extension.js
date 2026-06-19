import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

// ── Service Labels & Icons ──────────────────────────────────────────────────
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
    let clean = name.replace(/\.service$/, '').replace(/[-_]/g, ' ');
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    return { label: clean, icon: '⚙️' };
}

// ── Panel Indicator ─────────────────────────────────────────────────────────
const ServiceCommanderIndicator = GObject.registerClass(
class ServiceCommanderIndicator extends PanelMenu.Button {
    _init(ext) {
        super._init(0.0, 'Service Commander');
        this._ext = ext;
        this._services = [];
        this._filter = '';
        this._proxy = null;

        this.add_style_class_name('sc-panel-button');
        
        const hbox = new St.BoxLayout({ style_class: 'panel-status-menu-box' });
        hbox.add_child(new St.Label({
            text: '⚙ Services',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'sc-panel-label'
        }));
        this.add_child(hbox);

        this._initProxy();
        this._buildMenu();

        this.menu.connect('open-state-changed', (menu, open) => {
            if (open) this._refresh();
        });
    }

    async _initProxy() {
        console.log("Service Commander: Initializing Proxy...");
        try {
            this._proxy = await new Promise((resolve, reject) => {
                Gio.DBusProxy.new_for_bus(
                    Gio.BusType.SYSTEM,
                    Gio.DBusProxyFlags.NONE,
                    null,
                    'org.freedesktop.systemd1',
                    '/org/freedesktop/systemd1',
                    'org.freedesktop.systemd1.Manager',
                    null,
                    (proxy, res) => {
                        try {
                            const p = Gio.DBusProxy.new_for_bus_finish(res);
                            resolve(p);
                        } catch (e) {
                            reject(e);
                        }
                    }
                );
            });
            console.log("Service Commander: DBus Proxy Ready");
            this._refresh();
        } catch (e) {
            console.error("Service Commander: Proxy Init Failed", e);
        }
    }

    _buildMenu() {
        this.menu.box.add_style_class_name('sc-menu');

        // ── Header ────────────────────────────────────────────────────────────
        const headerItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
        const headerBox = new St.BoxLayout({ vertical: true, style_class: 'sc-header' });
        
        const titleLabel = new St.Label({
            text: '⚡ SERVICE COMMANDER',
            style_class: 'sc-title'
        });
        this._statusLabel = new St.Label({
            text: 'Initializing…',
            style_class: 'sc-status'
        });
        
        headerBox.add_child(titleLabel);
        headerBox.add_child(this._statusLabel);
        headerItem.add_child(headerBox);
        this.menu.addMenuItem(headerItem);

        // ── Search ────────────────────────────────────────────────────────────
        const searchItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
        this._searchEntry = new St.Entry({
            hint_text: '🔍  Filter services…',
            style_class: 'sc-search-entry',
            can_focus: true
        });
        this._searchEntry.get_clutter_text().connect('text-changed', () => {
            this._filter = this._searchEntry.get_text().toLowerCase();
            this._renderList();
        });
        searchItem.add_child(this._searchEntry);
        this.menu.addMenuItem(searchItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // ── Scrollable List ───────────────────────────────────────────────────
        const scrollItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
        const scrollBox = new St.ScrollView({
            style_class: 'sc-scroll-view',
            overlay_scrollbars: true,
        });
        scrollBox.set_policy(St.PolicyType.NEVER, St.PolicyType.AUTOMATIC);

        this._listBox = new St.BoxLayout({ vertical: true, style_class: 'sc-list-box' });
        scrollBox.set_child(this._listBox);
        scrollItem.add_child(scrollBox);
        this.menu.addMenuItem(scrollItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // ── Footer ────────────────────────────────────────────────────────────
        const footerItem = new PopupMenu.PopupBaseMenuItem({ reactive: false });
        const footerBox = new St.BoxLayout({ style_class: 'sc-footer' });
        
        this._refreshBtn = new St.Button({
            label: '↻  Refresh',
            style_class: 'sc-refresh-btn'
        });
        this._refreshBtn.connect('clicked', () => this._refresh());
        
        this._lastRefreshLabel = new St.Label({
            text: '',
            style_class: 'sc-last-refresh'
        });
        
        footerBox.add_child(this._refreshBtn);
        footerBox.add_child(this._lastRefreshLabel);
        footerItem.add_child(footerBox);
        this.menu.addMenuItem(footerItem);
    }

    async _refresh() {
        if (!this._proxy) {
            console.log("Service Commander: Refresh ignored - Proxy not ready");
            this._statusLabel.set_text('Error: DBus Proxy not ready');
            return;
        }

        console.log("Service Commander: Refreshing unit list...");
        this._statusLabel.set_text('Scanning system services…');
        
        try {
            const result = await new Promise((resolve, reject) => {
                this._proxy.call(
                    'ListUnits',
                    null,
                    Gio.DBusCallFlags.ALLOW_INTERACTIVE_AUTHORIZATION,
                    -1,
                    null,
                    (proxy, res) => {
                        try {
                            const variant = proxy.call_finish(res);
                            resolve(variant.recursiveUnpack());
                        } catch (e) {
                            reject(e);
                        }
                    }
                );
            });

            this._services = result[0]
                .filter(u => u[0].endsWith('.service') && u[2] === 'loaded')
                .map(u => {
                    const name = u[0];
                    const isRunning = (u[3] === 'active');
                    const { label, icon } = humanReadable(name);
                    return { unitName: name, label, icon, isRunning };
                });

            this._services.sort((a, b) => {
                if (a.isRunning !== b.isRunning) return a.isRunning ? -1 : 1;
                return a.label.localeCompare(b.label);
            });

            this._renderList();
            
            const now = new Date();
            this._lastRefreshLabel.set_text(`Last scan: ${now.toLocaleTimeString()}`);
            console.log(`Service Commander: Scanned ${this._services.length} services`);
        } catch (e) {
            console.error("Service Commander: Refresh failed", e);
            this._statusLabel.set_text('Scan failed. Check logs.');
        }
    }

    _renderList() {
        this._listBox.remove_all_children();

        const filtered = this._services.filter(s => {
            if (!this._filter) return true;
            return s.label.toLowerCase().includes(this._filter) ||
                   s.unitName.toLowerCase().includes(this._filter);
        });

        const runningCount = filtered.filter(s => s.isRunning).length;
        this._statusLabel.set_text(`${runningCount} running · ${filtered.length} total`);

        if (filtered.length === 0) {
            this._listBox.add_child(new St.Label({
                text: 'No services match your search.',
                style_class: 'sc-empty-label'
            }));
            return;
        }

        for (const svc of filtered) {
            this._listBox.add_child(this._makeRow(svc));
        }
    }

    _makeRow(svc) {
        const row = new St.BoxLayout({ style_class: 'sc-row' });

        // Left info
        const left = new St.BoxLayout({ vertical: true, x_expand: true });
        const nameRow = new St.BoxLayout();
        
        nameRow.add_child(new St.Label({ text: svc.icon + '  ', style_class: 'sc-row-icon' }));
        nameRow.add_child(new St.Label({ 
            text: svc.label, 
            style_class: svc.isRunning ? 'sc-row-name-running' : 'sc-row-name-stopped' 
        }));

        left.add_child(nameRow);
        left.add_child(new St.Label({ text: svc.unitName, style_class: 'sc-row-unit' }));

        // Right controls
        const right = new St.BoxLayout({ style_class: 'sc-row-controls' });
        
        const dot = new St.Label({
            text: svc.isRunning ? '●' : '○',
            style_class: svc.isRunning ? 'sc-dot-active' : 'sc-dot-inactive'
        });

        const toggle = new St.Button({
            label: svc.isRunning ? 'Stop' : 'Start',
            style_class: svc.isRunning ? 'sc-btn-stop' : 'sc-btn-start',
            can_focus: true,
            reactive: true
        });

        toggle.connect('clicked', () => {
            console.log(`Service Commander: Toggle clicked for ${svc.unitName}`);
            this._toggleService(svc, toggle);
        });

        right.add_child(dot);
        right.add_child(toggle);

        row.add_child(left);
        row.add_child(right);
        return row;
    }

    async _toggleService(svc, button) {
        if (!this._proxy) {
            console.warn("Service Commander: Toggle ignored - Proxy not ready");
            return;
        }

        button.set_label('…');
        button.set_reactive(false);
        button.add_style_class_name('sc-btn-pending');

        try {
            const method = svc.isRunning ? 'StopUnit' : 'StartUnit';
            console.log(`Service Commander: Calling ${method} for ${svc.unitName}`);

            await new Promise((resolve, reject) => {
                this._proxy.call(
                    method,
                    new GLib.Variant('(ss)', [svc.unitName, 'replace']),
                    Gio.DBusCallFlags.ALLOW_INTERACTIVE_AUTHORIZATION,
                    -1,
                    null,
                    (proxy, res) => {
                        try {
                            const r = proxy.call_finish(res);
                            resolve(r);
                        } catch (e) {
                            reject(e);
                        }
                    }
                );
            });

            console.log(`Service Commander: ${method} call successful`);

            // Wait a bit for status to propagate
            GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
                this._refresh();
                return GLib.SOURCE_REMOVE;
            });
        } catch (e) {
            console.error(`Service Commander: Toggle failed for ${svc.unitName}`, e);
            button.set_label(svc.isRunning ? 'Stop' : 'Start');
            button.set_reactive(true);
            button.remove_style_class_name('sc-btn-pending');
        }
    }
});

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
