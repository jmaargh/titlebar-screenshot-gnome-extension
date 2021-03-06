/* prefs.js
 *
 * Copyright © 2021 John-Mark Allen & Titlebar Screenshot collaborators
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the “Software”), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 *
 * SPDX-License-Identifier: MIT OR GPL-2.0-only
 *
 * Licensed under either MIT (above) or GPL version 2 (attached) licenses, at
 * your option.
 */

'use strict';

const { Gtk, GLib, Gio } = imports.gi;
const gtkVersion = Gtk.get_major_version();

const ExtensionUtils = imports.misc.extensionUtils;
const extension = ExtensionUtils.getCurrentExtension();
globalThis.Imports = extension.imports;
globalThis.Uuid = extension.metadata.uuid;

function nativeWidget() {
  const PrefsWidget = globalThis.Imports.prefs_widget.PrefsWidget

  let widget = new PrefsWidget(ExtensionUtils.getSettings());
  widget.show_all();

  return widget;
}

function standalonePrefs() {
  // Destroy the window once the mainloop starts
  const widget = new Gtk.Box();

  GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
    widget.get_root().destroy();
    return false;
  });

  const launcher = Gio.SubprocessLauncher.new(Gio.SubprocessLauncher.NONE);
  launcher.set_cwd(extension.path);
  launcher.spawnv([`${extension.path}/preferences-standalone`, globalThis.Uuid]);

  return widget;
}

function init() {
  if (Gtk.get_major_version() === 3) {
    ExtensionUtils.initTranslations(globalThis.Uuid);
  }
}

function buildPrefsWidget() {
  if (Gtk.get_major_version() === 3) {
    return nativeWidget();
  } else {
    return standalonePrefs();
  }
}
