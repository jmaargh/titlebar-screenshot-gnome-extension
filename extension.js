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

const iconName = "org.gnome.Screenshot";
const errorIconName = "error";

const Action = {
    COPY: 0,
    FILE: 1,
    INTERACTIVE: 2,
};

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
                case Action.INTERACTIVE:
                    this.addInteractiveScreenshotAction(itemPosition);
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

    addInteractiveScreenshotAction(position) {
        this.addScreenshotAction(position, "Screenshot tool", () => {
            Gio.Subprocess.new(["gnome-screenshot", "-w", "-i"], Gio.SubprocessFlags.NONE);
        });
    }

    addScreenshotAction(position, label, callback) {
        const icon = settings.iconInMenu ? state.gicon : undefined;
        const item = this.addAction(label, callback, icon);
        this.moveMenuItem(item, position);
    }
}

function notify(title, message, directory_action, is_error = false) {
    let source = new MessageTray.SystemNotificationSource();
    imports.ui.main.messageTray.add(source);

    let params = {
        gicon: state.gicon,
        secondaryGIcon: null,
    };
    if (is_error) {
        params.secondaryGIcon = state.errorGIcon;
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

let state = {
    originalWindowMenu: null,
    gicon: null,
    errorGIcon: null,
};
let settings = {
    actions: [
        Action.COPY,
        Action.FILE,
        Action.INTERACTIVE,
    ],
    menuPosition: 10,
    useSeparators: true,
    iconInMenu: true,
    screenshotDirUri: null,
};

function loadAndConnectSettings() {
    // TODO: pull from org.gnome.gnome-screenshot.auto-save-directory
    const directory = GLib.get_user_special_dir(GLib.UserDirectory.DIRECTORY_PICTURES);
    settings.screenshotDirUri = Gio.File.new_for_path(directory).get_uri();
}

function init() {
    state.gicon = Gio.ThemedIcon.new(iconName);
    state.errorGIcon = Gio.ThemedIcon.new(errorIconName);
    loadAndConnectSettings();
}

function enable() {
    state.originalWindowMenu = imports.ui.windowMenu.WindowMenu;
    imports.ui.windowMenu.WindowMenu = CustomWindowMenu;
}


function disable() {
    if (state.originalWindowMenu !== null) {
        imports.ui.windowMenu.WindowMenu = this.originalWindowMenu;
        state.originalWindowMenu = null;
    }
}
