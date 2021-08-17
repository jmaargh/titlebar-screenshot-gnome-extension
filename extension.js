/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

'use strict';

const { GLib, Gio } = imports.gi;
const PopupMenu = imports.ui.popupMenu;
const MessageTray = imports.ui.messageTray;
const ExtensionUtils = imports.misc.extensionUtils;

const extension = ExtensionUtils.getCurrentExtension();
const { iconName, errorIconName, Key } = extension.imports.vars;
const { Action, getCurrentActions } = extension.imports.actions;

class CustomWindowMenu extends imports.ui.windowMenu.WindowMenu {
    constructor(...args) {
        super(...args);

        let itemPosition = Math.min(Math.max(settings.menuPosition, 0), this.numMenuItems);

        // First separator (if required)
        if (settings.useSeparators) {
            if (itemPosition > 0) { // Not required for first position
                if (!(this._getMenuItems()[itemPosition - 1] instanceof PopupMenu.PopupSeparatorMenuItem)) { // Not required if separator exists here
                    this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem, itemPosition);
                    itemPosition += 1;
                }
            }
        }

        for (const action of settings.actions) {
            switch (action) {
                case Action.COPY:
                    this.addCopyScreenshotAction(itemPosition);
                    break;
                case Action.FILE:
                    this.addFileScreenshotAction(itemPosition);
                    break;
                case Action.TOOL:
                    this.addToolScreenshotAction(itemPosition);
                    break;
                default:
                    continue;
            }
            itemPosition += 1;

        }

        // Second separator (if required)
        if (settings.useSeparators) {
            if (itemPosition > 0 && itemPosition < this.numMenuItems - 1) { // Not required for first or last position
                if (!(this._getMenuItems[itemPosition + 1] instanceof PopupMenu.PopupSeparatorMenuItem)) { // Not required if separator exists here
                    this.addMenuItem(new PopupMenu.PopupSeparatorMenuItem, itemPosition);
                    itemPosition += 1;
                }
            }
        }
    }

    addCopyScreenshotAction(position) {
        const callback = () => {
            let process = Gio.Subprocess.new(["gnome-screenshot", "-w", "-c"], Gio.SubprocessFlags.STDERR_PIPE);
            process.wait_async(null, (process, result) => {
                try {
                    process.wait_finish(result);

                    if (process.get_successful()) {
                        notify("Screenshot captured", "Image copied to clipboard", false);
                    } else {
                        let error_message = errorFromSubprocess(process);
                        error_message.push(`STATUS: ${process.get_exit_status()}`);

                        notify("Screenshot failed", error_message.join('\n'), false, true);
                    }
                } catch (error) {
                    logError(error);
                }
            });
        };

        this.addScreenshotAction(position, "Copy screenshot", callback);
    }

    addFileScreenshotAction(position) {
        const callback = () => {
            let process = Gio.Subprocess.new(["gnome-screenshot", "-w"], Gio.SubprocessFlags.STDERR_PIPE);
            process.wait_async(null, (process, result) => {
                try {
                    process.wait_finish(result);

                    if (process.get_successful()) {
                        notify("Screenshot captured", "Click to open containing directory", true);
                    } else {
                        let error_message = errorFromSubprocess(process);
                        error_message.push(`STATUS: ${process.get_exit_status()}`);

                        notify("Screenshot failed", error_message.join('\n'), false, true);
                    }
                } catch (error) {
                    logError(error);
                }
            });
        };

        this.addScreenshotAction(position, "Screenshot to file", callback);
    }

    addToolScreenshotAction(position) {
        this.addScreenshotAction(position, "Screenshot tool", () => {
            Gio.Subprocess.new(["gnome-screenshot", "-w", "-i"], Gio.SubprocessFlags.NONE);
        });
    }

    addScreenshotAction(position, label, callback) {
        const icon = settings.iconInMenu ? res.gicon : undefined;
        const item = this.addAction(label, callback, icon);
        this.moveMenuItem(item, position);
    }
}

function notify(title, message, directory_action, is_error = false) {
    let source = new MessageTray.SystemNotificationSource();
    imports.ui.main.messageTray.add(source);

    let params = {
        gicon: res.gicon,
        secondaryGIcon: null,
    };
    if (is_error) {
        params.secondaryGIcon = res.errorGIcon;
    }

    let notification = new MessageTray.Notification(source, title, message, params);
    notification.setTransient(true);
    if (directory_action) {
        notification.addAction("Open containing directory", () => {
            Gio.AppInfo.launch_default_for_uri(settings.screenshotDirUri, null);
        });
    }

    source.showNotification(notification);
}

function errorFromSubprocess(subprocess) {
    const stderr = subprocess.get_stderr_pipe();
    if (stderr == null) {
        return [];
    }

    let message = [];
    const stream = Gio.DataInputStream.new(stderr);
    while (true) {
        let [line, _length] = stream.read_line_utf8(null);
        if (line == null) {
            break;
        }
        message.push(line);
    }

    return message;
}

function pathToUri(path) {
    if (path === null || !(path.trim())) {
        path = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES);
    }

    Gio.File.new_for_path(path).get_uri()
}

// Set on init, never unset
let res = {
    gicon: null,
    errorGIcon: null,
};
// Set and unset on enable/disable
let state = {
    originalWindowMenu: null,
};
// Dynamic settings
let settings = {
    actions: [],
    menuPosition: 0,
    useSeparators: true,
    iconInMenu: true,
    screenshotDirUri: null,
};
let gsettings = null;
let gsettings_callback = null;
let gsettings_gs = null;
let gsettings_gs_callback = null;

function updateSettings(gsettings, key) {
    if (key === null || key === Key.COPY_ACTION || key === Key.FILE_ACTION || key === Key.TOOL_ACTION) {
        settings.actions = getCurrentActions(gsettings);
    }
    if (key === null || key === Key.MENU_POSITION) {
        settings.menuPosition = gsettings.get_uint(Key.MENU_POSITION);
    }
    if (key === null || key === Key.USE_SEPARATORS) {
        settings.useSeparators = gsettings.get_boolean(Key.USE_SEPARATORS);
    }
    if (key === null || key === Key.ICON_IN_MENU) {
        settings.iconInMenu = gsettings.get_boolean(Key.ICON_IN_MENU);
    }
}

function updateGsSettings(gsettings, key) {
    const KEY = "auto-save-directory";
    if (key === KEY || key === null) {
        settings.screenshotDirUri = pathToUri(gsettings.get_string(KEY));
    }
}

function initSettings() {
    gsettings = ExtensionUtils.getSettings();
    updateSettings(gsettings, null);
    gsettings_callback = gsettings.connect("changed", updateSettings);

    gsettings_gs = ExtensionUtils.getSettings('org.gnome.gnome-screenshot');
    updateGsSettings(gsettings_gs, null);
    gsettings_gs_callback = gsettings_gs.connect("changed", updateGsSettings);
}

function init() {
    res.gicon = Gio.ThemedIcon.new(iconName);
    res.errorGIcon = Gio.ThemedIcon.new(errorIconName);
}

function enable() {
    initSettings();

    state.originalWindowMenu = imports.ui.windowMenu.WindowMenu;
    imports.ui.windowMenu.WindowMenu = CustomWindowMenu;
}


function disable() {
    if (state.originalWindowMenu !== null) {
        imports.ui.windowMenu.WindowMenu = state.originalWindowMenu;
        state.originalWindowMenu = null;
    }

    if (gsettings_gs_callback !== null) {
        gsettings_gs.disconnect(gsettings_gs_callback);
        gsettings_gs_callback = null;
    }
    if (gsettings_gs !== null) {
        gsettings_gs = null;
    }

    if (gsettings_callback !== null) {
        gsettings.disconnect(gsettings_callback);
        gsettings_callback = null;
    }
    if (gsettings !== null) {
        gsettings = null;
    }

    for (const key in settings) {
        settings[key] = null;
    }
}
