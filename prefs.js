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

const { Gtk, Gio, GObject, Pango } = imports.gi;
// const ExtensionUtils = imports.misc.extensionUtils;  // FIXME: revert

// const extension = ExtensionUtils.getCurrentExtension();  // FIXME: revert
// const Gettext = imports.gettext.domain(extension.metadata.uuid);  // FIXME: revert
const Gettext = imports.gettext.domain("titlebar-screenshot@jmaargh.github.com");  // FIXME: revert
const _ = Gettext.gettext;

imports.searchPath.unshift(".");  // FIXME: revert
const { Key, iconName } = imports.vars;  // FIXME: revert
// const { Key, iconName } = extension.imports.vars;  // FIXME: revert
const {
  Action,
  getCurrentActions,
  saveActions,
  toActionKey,
  toTextKey,
  getDefaultText,
  // } = extension.imports.actions;  // FIXME: revert
} = imports.actions;
const {
  IS_GTK4,
  gtkShowAll,
  gtkBoxAdd,
  gtkBoxGetChildren,
  gtkBoxPackStart,
  gtkBoxPackEnd,
  gtkWidgetMargin,
  gtkSetChild,
  gtkLabelSetWrap,
  gtkButtonSetHasFrame,
  // } = extension.imports.compat;  // FIXME: revert
} = imports.compat;

// TODO: replace all button contents controls with manual GtkBox children
// and provide functions in .compat to control setting labels, images, and
// alignment
// TODO: work out what the hell is going on with popovers in GTK4

const SettingsWidget = GObject.registerClass(
  class TitlebarScreenshotSettingsWidget extends Gtk.Box {
    _init(...args) {
      super._init(...args);

      gtkWidgetMargin(this, 32);
      this.spacing = 12;
      this.fill = true;
      this.set_orientation(Gtk.Orientation.HORIZONTAL);

      // FIXME: revert
      // this.gsettings = ExtensionUtils.getSettings();
      let gschema = Gio.SettingsSchemaSource.new_from_directory(
        "schemas",
        Gio.SettingsSchemaSource.get_default(),
        false
      );
      this.gsettings = new Gio.Settings({
        settings_schema: gschema.lookup(
          "org.gnome.shell.extensions.titlebar-screenshot",
          true
        ),
      });


      this.positionSpinner = null;
      this.separatorsSwitch = null;
      this.iconsSwitch = null;
      this.addButton = null;
      this.menuItems = null;

      gtkBoxAdd(this, this.makeConfigurationBox());
      gtkBoxAdd(this, this.makeMenuItems());

      this.connectSettingsChanged();
      this.onSettingsChanged(this.gsettings, null);
    }

    makeConfigurationBox() {
      const box = Gtk.Box.new(Gtk.Orientation.VERTICAL, 6);
      const title = Gtk.Label.new(`<b>${_("Configuration")}</b>`);
      title.set_use_markup(true);
      title.set_xalign(0.0);
      gtkBoxAdd(box, title);

      const configuration = this.makeConfigurationOptions();
      gtkBoxAdd(box, configuration);

      const testingLabel = Gtk.Label.new(_("Configured immediately. To test, right-click the titlebar of the current window."));
      testingLabel.set_xalign(0.0);
      gtkLabelSetWrap(testingLabel, true);
      gtkBoxAdd(box, testingLabel);

      return box;
    }

    makeConfigurationOptions() {
      const box = Gtk.ListBox.new();
      box.set_valign(Gtk.Align.START);
      box.set_selection_mode(Gtk.SelectionMode.NONE);

      this.positionSpinner = new Gtk.SpinButton();
      this.positionSpinner.set_valign(Gtk.Align.CENTER);
      this.positionSpinner.set_halign(Gtk.Align.CEEND);
      this.positionSpinner.set_range(0, 1024);
      this.positionSpinner.set_increments(1, 1);
      this.positionSpinner.connect("value-changed", (spinner) =>
        this.gsettings.set_uint(Key.MENU_POSITION, spinner.get_value_as_int())
      );
      const positionRow = this.makeConfigurationRow(
        _("Position in menu"),
        _("Number of items before screenshot actions\n(including separators)"),
        this.positionSpinner,
      );
      gtkBoxAdd(box, positionRow);

      this.separatorsSwitch = Gtk.Switch.new();
      this.separatorsSwitch.set_valign(Gtk.Align.CENTER);
      this.separatorsSwitch.set_halign(Gtk.Align.END);
      this.separatorsSwitch.connect("notify::active", (widget) =>
        this.gsettings.set_boolean(Key.USE_SEPARATORS, widget.active)
      );
      const separatorsRow = this.makeConfigurationRow(
        _("Add separators"),
        _("Insert separators around screenshot actions in menu"),
        this.separatorsSwitch,
      );
      gtkBoxAdd(box, separatorsRow);

      this.iconsSwitch = Gtk.Switch.new();
      this.iconsSwitch.set_valign(Gtk.Align.CENTER);
      this.iconsSwitch.set_halign(Gtk.Align.END);
      this.iconsSwitch.connect("notify::active", (widget) =>
        this.gsettings.set_boolean(Key.ICON_IN_MENU, widget.active)
      );
      const iconsRow = this.makeConfigurationRow(
        _("Show icons"),
        _("Add icon next to all screenshot actions"),
        this.iconsSwitch,
      );
      gtkBoxAdd(box, iconsRow);

      return box;
    }

    makeMenuItems() {
      const frame = Gtk.Frame.new("");
      const label = Gtk.Label.new(`<b>${_("Menu items")}</b>`);
      label.set_use_markup(true);
      frame.set_label_widget(label);
      frame.set_label_align(0.5, 0.5);
      frame.set_valign(Gtk.Align.START);
      frame.set_halign(Gtk.Align.START);

      const menuItemsBox = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0);
      menuItemsBox.margin_top = 12;
      menuItemsBox.margin_bottom = 24;
      menuItemsBox.margin_start = 6;
      menuItemsBox.margin_end = 6;
      gtkSetChild(frame, menuItemsBox);

      this.menuItems = new MenuItems(this.gsettings);
      this.menuItems.setCallback((...args) => this.onEditAction(...args));
      gtkBoxAdd(menuItemsBox, this.menuItems);

      this.addButton = Gtk.MenuButton.new();
      this.addButton.set_label(_("Add"));
      // FIXME: revert and gtk4
      // const addImage = Gtk.Image.new_from_icon_name("gtk-add", Gtk.IconSize.MENU);
      // this.addButton.set_image(addImage);
      // this.addButton.always_show_image = true;
      // this.addButton.set_alignment(0.0, 0.5);
      this.addButton.margin_top = 24;
      this.addButton.set_popover(this.makeAddPopover(this.addButton));

      gtkBoxAdd(menuItemsBox, this.addButton);

      return frame;
    }

    makeConfigurationRow(title, subtitle, child) {
      const row = Gtk.ListBoxRow.new();
      row.set_activatable(false);
      row.set_selectable(false);
      gtkWidgetMargin(row, 6);
      const box = Gtk.Box.new(Gtk.Orientation.HORIZONTAL, 12);

      const textBox = Gtk.Box.new(Gtk.Orientation.VERTICAL, 6);
      const titleLabel = Gtk.Label.new(title);
      titleLabel.set_ellipsize(Pango.EllipsizeMode.END);
      titleLabel.set_xalign(0.0);
      gtkBoxAdd(textBox, titleLabel);

      if (subtitle !== null && subtitle !== undefined) {
        const subtitleLabel = Gtk.Label.new(`<span font_size="smaller" alpha="55%">${subtitle}</span>`);
        subtitleLabel.set_ellipsize(Pango.EllipsizeMode.END);
        subtitleLabel.set_xalign(0.0);
        subtitleLabel.set_use_markup(true);
        gtkBoxAdd(textBox, subtitleLabel);
      }

      gtkBoxPackStart(box, textBox, true, true, 0);
      gtkBoxPackEnd(box, child, false, false, 0);
      gtkSetChild(row, box);

      return row;
    }

    makeAddPopover(relativeWidget) {
      this.addPopover = new AddPopover(relativeWidget);
      this.addPopover.setCallback((...args) => this.onAddAction(...args));
      return this.addPopover;
    }

    onAddAction(action) {
      let actions = getCurrentActions(this.gsettings);
      actions.push(action);
      saveActions(this.gsettings, actions);
    }

    onEditAction(action, editAction, otherData = null) {
      if (editAction === EditAction.REMOVE) {
        let actions = getCurrentActions(this.gsettings);
        actions = actions.filter((a) => a !== action);
        saveActions(this.gsettings, actions);
      } else if (editAction === EditAction.SWAP) {
        const otherAction = otherData;
        const actionKey = toActionKey(action);
        const otherActionKey = toActionKey(otherAction);

        let actionValue = this.gsettings.get_uint(actionKey);
        let otherActionValue = this.gsettings.get_uint(otherActionKey);

        this.gsettings.set_uint(actionKey, otherActionValue);
        this.gsettings.set_uint(otherActionKey, actionValue);
      } else if (editAction === EditAction.RENAME) {
        let newText = getDefaultText(action, _);
        if (otherData !== null) {
          newText = otherData;
        }
        this.gsettings.set_string(toTextKey(action), newText);
      }
    }

    connectSettingsChanged() {
      this.gsettings.connect("changed", (gsettings, key) => this.onSettingsChanged(gsettings, key));
      this.onSettingsChanged(this.gsettings, null);
    }

    onSettingsChanged(gsettings, key) {
      if (key === null || key === Key.MENU_POSITION) {
        this.positionSpinner.set_value(gsettings.get_uint(Key.MENU_POSITION));
      }
      if (key === null || key === Key.USE_SEPARATORS) {
        this.separatorsSwitch.set_active(gsettings.get_boolean(Key.USE_SEPARATORS));
      }
      if (key === null || key === Key.ICON_IN_MENU) {
        this.iconsSwitch.set_active(gsettings.get_boolean(Key.ICON_IN_MENU));
      }

      const hasAnyAddActions = this.addPopover.update(this.gsettings);
      this.addButton.set_sensitive(hasAnyAddActions);

      this.menuItems.update(this.gsettings);
    }
  }
);

const MenuItems = GObject.registerClass(
  class TbsSettingsMenuItems extends Gtk.Box {
    _init(gsettings) {
      super._init();

      this.set_orientation(Gtk.Orientation.VERTICAL);
      this.set_spacing(0);
      gtkWidgetMargin(this, 12);
      this.set_size_request(160, -1);

      this._firstSeparator = Gtk.Separator.new(Gtk.Orientation.HORIZONTAL);
      this._secondSeparator = Gtk.Separator.new(Gtk.Orientation.HORIZONTAL);

      this._buttons = new Map();
      this._icons = new Map();
      this._popovers = new Map();
      for (const key in Action) {
        this._makeButton(Action[key], gsettings);
      }

      this._callback = null;
    }

    setCallback(callback) {
      this._callback = callback;
    }


    clear() {
      for (const widget of gtkBoxGetChildren(this)) {
        this.remove(widget);
      }
    }

    update(gsettings) {
      this.clear();
      this.updateIcons(gsettings.get_boolean(Key.ICON_IN_MENU));
      this.updateLabels(gsettings);

      const actions = getCurrentActions(gsettings);
      const hasAnyActions = actions.length !== 0;
      const useSeparators = gsettings.get_boolean(Key.USE_SEPARATORS);

      if (hasAnyActions) {
        if (useSeparators) {
          gtkBoxPackStart(this, this._firstSeparator, true, true, 6);
        }
        for (const action of actions) {
          gtkBoxAdd(this, this._buttons.get(action));
        }
        if (useSeparators) {
          gtkBoxPackEnd(this, this._secondSeparator, true, true, 6);
        }
      }

      gtkShowAll(this);
    }

    updateIcons(useIcons) {
      if (useIcons) {
        for (const [action, button] of this._buttons) {
          // FIXME: revert and gtk4
          // button.set_image(this._icons.get(action));
          // button.always_show_image = true;
        }
      } else {
        for (const [_, button] of this._buttons) {
          // FIXME: revert and gtk4
          // button.set_image(null);
        }
      }
    }

    updateLabels(gsettings) {
      for (const [action, button] of this._buttons) {
        button.set_label(gsettings.get_string(toTextKey(action)));
      }
    }

    _makeButton(action, gsettings) {
      const button = Gtk.Button.new();
      button.set_label("");
      gtkButtonSetHasFrame(button, false);
      if (!IS_GTK4) {
        // FIXME: style properly for GTK4
        button.set_alignment(0.0, 0.5);
      }

      const popover = new EditPopover(button, action);
      popover.setCallback((...args) => this._callback(...args));

      button.connect("clicked", (_button) => {
        popover.updateText(gsettings.get_string(toTextKey(action)));
        popover.popup();
      });

      this._popovers.set(action, popover);
      this._icons.set(action, Gtk.Image.new_from_icon_name(iconName, Gtk.IconSize.MENU));
      this._buttons.set(action, button);

      return button;
    }
  }
);

const AddPopover = GObject.registerClass(
  class TbsAddPopover extends Gtk.Popover {
    _init(relativeWidget) {
      super._init();
      // FIXME: revert and GTK4
      // this.set_relative_to(relativeWidget);

      this._box = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0);
      gtkWidgetMargin(this._box, 6);
      gtkSetChild(this, this._box);

      this._icons = new Map();
      this._buttons = new Map();
      for (const key in Action) {
        this._makeButton(Action[key]);
      }

      this._callback = null;
    }

    setCallback(callback) {
      this._callback = callback;
    }

    clear() {
      for (const widget of gtkBoxGetChildren(this._box)) {
        this._box.remove(widget);
      }
    }

    update(gsettings) {
      this.clear();
      this.updateIcons(gsettings.get_boolean(Key.ICON_IN_MENU));

      let hasAnyActions = false;

      for (const key in Action) {
        const action = Action[key];
        if (gsettings.get_uint(toActionKey(action)) === 0) {
          hasAnyActions = true;
          gtkBoxAdd(this._box, this._buttons.get(action));
        }
      }

      gtkShowAll(this._box);

      return hasAnyActions;
    }

    updateIcons(useIcons) {
      if (useIcons) {
        for (const [action, button] of this._buttons) {
          // FIXME: revert and gtk4
          // button.set_image(this._icons.get(action));
          // button.always_show_image = true;
        }
      } else {
        for (const [_, button] of this._buttons) {
          // FIXME: revert and gtk4
          // button.set_image(null);
        }
      }
    }

    _makeButton(action) {
      const button = Gtk.Button.new();
      button.set_label(getDefaultText(action, _));
      if (!IS_GTK4) {
        // FIXME: style properly for GTK4
        button.set_alignment(0.0, 0.5);
      }

      button.connect("clicked", (_button) => {
        this.popdown();
        if (this._callback !== null) {
          this._callback(action);
        }
      });

      this._icons.set(action, Gtk.Image.new_from_icon_name(iconName, Gtk.IconSize.MENU));
      this._buttons.set(action, button);

      return button;
    }

  }
);

var EditAction = {
  RENAME: 0,
  SWAP: 1,
  REMOVE: 2,
};

const EditPopover = GObject.registerClass(
  class TbsEditPopover extends Gtk.Popover {
    _init(relativeWidget, action) {
      super._init();
      if (!IS_GTK4) {
        // FIXME: what are the GTK4 alternatives?
        this.set_relative_to(relativeWidget);
        this.set_constrain_to(Gtk.PopoverConstraint.NONE);
      }
      this.set_position(Gtk.PositionType.BOTTOM);

      this.action = action;
      this._entry = null;
      this._callback = null;

      const box = Gtk.Box.new(Gtk.Orientation.VERTICAL, 24);
      gtkWidgetMargin(box, 6);
      gtkSetChild(this, box);

      this._makeRemoveButton(box);
      this._makeRenameBox(box);
      this._makeSwapBox(box);

      gtkShowAll(box);
    }

    setCallback(callback) {
      this._callback = callback;
    }

    updateText(text) {
      this._entry.set_text(text);
    }

    _makeSwapBox(parent) {
      const box = Gtk.Box.new(Gtk.Orientation.VERTICAL, 6);
      const label = Gtk.Label.new(_("Replace with"));
      gtkBoxAdd(box, label);

      const buttonBox = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0);
      for (const key in Action) {
        const action = Action[key];
        if (action !== this.action) {
          gtkBoxAdd(buttonBox, this._makeButton(action));
        }
      }
      gtkBoxAdd(box, buttonBox);

      gtkBoxAdd(parent, box);
      return box;
    }

    _makeRenameBox(parent) {
      const box = Gtk.Box.new(Gtk.Orientation.VERTICAL, 6);
      const label = Gtk.Label.new(_("Menu item text"));
      gtkBoxAdd(box, label);

      const hbox = Gtk.Box.new(Gtk.Orientation.HORIZONTAL, 0);
      gtkBoxAdd(box, hbox);

      this._entry = Gtk.Entry.new();
      gtkBoxPackStart(hbox, this._entry, true, true, 0);

      const apply = Gtk.Button.new_from_icon_name("gtk-apply", Gtk.IconSize.BUTTON);
      apply.connect("clicked", (_button) => {
        this.popdown();
        if (this._callback !== null) {
          this._callback(this.action, EditAction.RENAME, this._entry.get_text());
        }
      });
      gtkBoxAdd(hbox, apply);

      this._entry.connect("activate", (_entry) => {
        apply.clicked();
      });

      const reset = Gtk.Button.new_from_icon_name("gtk-undo", Gtk.IconSize.BUTTON);
      reset.connect("clicked", (_button) => {
        this.popdown();
        if (this._callback !== null) {
          this._callback(this.action, EditAction.RENAME, null);
        }
      });
      gtkBoxAdd(hbox, reset);

      gtkBoxAdd(parent, box);
      return box;
    }

    _makeRemoveButton(parent) {
      const button = Gtk.Button.new_with_label(_("Remove"));
      const icon = Gtk.Image.new_from_icon_name("gtk-delete", Gtk.IconSize.BUTTON);
      // FIXME: revert and gtk4
      // button.set_image(icon);
      // button.always_show_image = true;
      gtkBoxAdd(parent, button);

      button.connect("clicked", (_button) => {
        this.popdown();
        if (this._callback !== null) {
          this._callback(this.action, EditAction.REMOVE);
        }
      });

      return button;
    }

    _makeButton(action) {
      const button = Gtk.Button.new();
      button.set_label(getDefaultText(action, _));
      if (!IS_GTK4) {
        // FIXME: style properly for GTK4
        button.set_alignment(0.0, 0.5);
      }

      button.connect("clicked", (_button) => {
        if (this._callback !== null) {
          this._callback(this.action, EditAction.SWAP, action);
        }
      });

      return button;
    }

  }
);


function init() {
  ExtensionUtils.initTranslations(extension.metadata.uuid);
}

function buildPrefsWidget() {
  let widget = new SettingsWidget();
  gtkShowAll(widget);

  return widget;
}
