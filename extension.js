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

const Gio = imports.gi.Gio;
const PopupMenu = imports.ui.popupMenu;
const MessageTray = imports.ui.messageTray;
const ExtensionUtils = imports.misc.extensionUtils;

const extension = ExtensionUtils.getCurrentExtension();

const iconName = "org.gnome.Screenshot";
const errorIconName = "error";

class CustomWindowMenu extends imports.ui.windowMenu.WindowMenu {
    constructor(...args) {
        super(...args);
        this.addScreenshotAction();
    }

    addScreenshotAction() {
        const callback = () => {
            // TODO: other options
            let process = Gio.Subprocess.new(["gnome-screenshot", "-w", "-c"], Gio.SubprocessFlags.STDERR_PIPE);
            process.wait_async(null, (process, result) => {
                try {
                    process.wait_finish(result);

                    if (process.get_successful()) {
                        notify("Screenshot captured", "Image copied to clipboard");
                    } else {
                        let error_message = errorFromSubprocess(process);
                        error_message.push(`STATUS: ${process.get_exit_status()}`);

                        notify("Screenshot failed", error_message.join('\n'));
                    }
                } catch (error) {
                    logError(error);
                }
            });
        };

        // TODO: other labels
        const item = this.addAction("Copy screenshot", callback, state.gicon);
        this.moveMenuItem(item, this.numMenuItems - 2);
        const separator = new PopupMenu.PopupSeparatorMenuItem();
        this.addMenuItem(separator, this.numMenuItems - 1);
    }
}

function notify(title, message, is_error = false) {
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
let settings = {};

function init() {
    state.gicon = Gio.ThemedIcon.new(iconName);
    state.errorGIcon = Gio.ThemedIcon.new(errorIconName);
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
