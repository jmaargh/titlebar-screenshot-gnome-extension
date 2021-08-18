'use strict';

const { Gtk, GObject, Handy } = imports.gi;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const extension = ExtensionUtils.getCurrentExtension();
const { Key, iconName } = extension.imports.vars;
const {
  Action,
  getCurrentActions,
  saveActions,
  toActionKey,
  toTextKey,
  getDefaultText,
} = extension.imports.actions;

const SettingsWidget = GObject.registerClass(
  class TitlebarScreenshotSettingsWidget extends Gtk.Box {
    _init(...args) {
      super._init(...args);

      this.margin = 32;
      this.spacing = 12;
      this.fill = true;
      this.set_orientation(Gtk.Orientation.HORIZONTAL);

      this.gsettings = ExtensionUtils.getSettings();

      this.positionSpinner = null;
      this.separatorsSwitch = null;
      this.iconsSwitch = null;
      this.addButton = null;
      this.menuItems = null;

      this.add(this.makeConfigurationBox());
      this.add(this.makeMenuItems());

      this.connectSettingsChanged();
      this.onSettingsChanged(this.gsettings, null);
    }

    makeConfigurationBox() {
      const box = Gtk.Box.new(Gtk.Orientation.VERTICAL, 6);
      const title = Gtk.Label.new("<b>Configuration</b>");
      title.set_use_markup(true);
      title.set_xalign(0.0);
      box.add(title);

      const configuration = this.makeConfigurationOptions();
      box.add(configuration);

      const testingLabel = Gtk.Label.new("Configured immediately. To test, right-click the titlebar of the current window.");
      testingLabel.set_xalign(0.0);
      testingLabel.set_line_wrap(true);
      box.add(testingLabel);

      return box;
    }

    makeConfigurationOptions() {
      const box = Gtk.ListBox.new();
      box.set_valign(Gtk.Align.START);
      box.set_selection_mode(Gtk.SelectionMode.NONE);

      const positionRow = this.makeConfigurationRow(
        "Position in menu",
        "Number of items before screenshot actions\n(including separators)"
      );
      this.positionSpinner = new Gtk.SpinButton();
      this.positionSpinner.set_valign(Gtk.Align.CENTER);
      this.positionSpinner.set_halign(Gtk.Align.CEEND);
      this.positionSpinner.set_range(0, 1024);
      this.positionSpinner.set_increments(1, 1);
      this.positionSpinner.connect("value-changed", (spinner) =>
        this.gsettings.set_uint(Key.MENU_POSITION, spinner.get_value_as_int())
      );
      positionRow.add(this.positionSpinner);
      box.add(positionRow);

      const separatorsRow = this.makeConfigurationRow(
        "Add separators",
        "Insert separators around screenshot actions in menu",
      );
      this.separatorsSwitch = Gtk.Switch.new();
      this.separatorsSwitch.set_valign(Gtk.Align.CENTER);
      this.separatorsSwitch.set_halign(Gtk.Align.END);
      this.separatorsSwitch.connect("notify::active", (widget) =>
        this.gsettings.set_boolean(Key.USE_SEPARATORS, widget.active)
      );
      separatorsRow.add(this.separatorsSwitch);
      box.add(separatorsRow);

      const iconsRow = this.makeConfigurationRow(
        "Show icons",
        "Add icon next to all screenshot actions",
      );
      this.iconsSwitch = Gtk.Switch.new();
      this.iconsSwitch.set_valign(Gtk.Align.CENTER);
      this.iconsSwitch.set_halign(Gtk.Align.END);
      this.iconsSwitch.connect("notify::active", (widget) =>
        this.gsettings.set_boolean(Key.ICON_IN_MENU, widget.active)
      );
      iconsRow.add(this.iconsSwitch);
      box.add(iconsRow);

      return box;
    }

    makeMenuItems() {
      const frame = Gtk.Frame.new("");
      const label = Gtk.Label.new("<b>Menu items</b>");
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
      frame.add(menuItemsBox);

      this.menuItems = new MenuItems(this.gsettings);
      this.menuItems.setCallback((...args) => this.onEditAction(...args));
      menuItemsBox.add(this.menuItems);

      this.addButton = Gtk.MenuButton.new();
      this.addButton.set_label("Add");
      const addImage = Gtk.Image.new_from_icon_name("gtk-add", Gtk.IconSize.MENU);
      this.addButton.set_image(addImage);
      this.addButton.always_show_image = true;
      this.addButton.margin_top = 24;
      this.addButton.set_alignment(0.0, 0.5);
      this.addButton.set_popover(this.makeAddPopover(this.addButton));

      menuItemsBox.add(this.addButton);

      return frame;
    }

    makeConfigurationRow(title, subtitle) {
      const row = Handy.ActionRow.new();
      row.set_title(title);
      if (subtitle !== null && subtitle !== undefined) {
        row.set_subtitle(subtitle);
      }
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
        let newText = getDefaultText(action);
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
      this.margin = 12;
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
      for (const widget of this.get_children()) {
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
          this.pack_start(this._firstSeparator, true, true, 6);
        }
        for (const action of actions) {
          this.add(this._buttons.get(action));
        }
        if (useSeparators) {
          this.pack_start(this._secondSeparator, true, true, 6);
        }
      }

      this.show_all();
    }

    updateIcons(useIcons) {
      if (useIcons) {
        for (const [action, button] of this._buttons) {
          button.set_image(this._icons.get(action));
          button.always_show_image = true;
        }
      } else {
        for (const [_, button] of this._buttons) {
          button.set_image(null);
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
      button.set_relief(Gtk.ReliefStyle.NONE);
      button.set_alignment(0.0, 0.5);

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
      this.set_relative_to(relativeWidget);

      this._box = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0);
      this._box.margin = 6;
      this.add(this._box);

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
      for (const widget of this._box.get_children()) {
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
          this._box.add(this._buttons.get(action));
        }
      }

      this._box.show_all();

      return hasAnyActions;
    }

    updateIcons(useIcons) {
      if (useIcons) {
        for (const [action, button] of this._buttons) {
          button.set_image(this._icons.get(action));
          button.always_show_image = true;
        }
      } else {
        for (const [_, button] of this._buttons) {
          button.set_image(null);
        }
      }
    }

    _makeButton(action) {
      const button = Gtk.Button.new();
      button.set_label(getDefaultText(action));
      button.set_alignment(0.0, 0.5);

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
      this.set_relative_to(relativeWidget);
      this.set_position(Gtk.PositionType.BOTTOM);
      this.set_constrain_to(Gtk.PopoverConstraint.NONE);

      this.action = action;
      this._entry = null;
      this._callback = null;

      const box = Gtk.Box.new(Gtk.Orientation.VERTICAL, 24);
      box.margin = 6;
      this.add(box);

      this._makeRemoveButton(box);
      this._makeRenameBox(box);
      this._makeSwapBox(box);

      box.show_all();
    }

    setCallback(callback) {
      this._callback = callback;
    }

    updateText(text) {
      this._entry.set_text(text);
    }

    _makeSwapBox(parent) {
      const box = Gtk.Box.new(Gtk.Orientation.VERTICAL, 6);
      const label = Gtk.Label.new("Replace with");
      box.add(label);

      const buttonBox = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0);
      for (const key in Action) {
        const action = Action[key];
        if (action !== this.action) {
          buttonBox.add(this._makeButton(action));
        }
      }
      box.add(buttonBox);

      parent.add(box);
      return box;
    }

    _makeRenameBox(parent) {
      const box = Gtk.Box.new(Gtk.Orientation.VERTICAL, 6);
      const label = Gtk.Label.new("Menu item text");
      box.add(label);

      const hbox = Gtk.Box.new(Gtk.Orientation.HORIZONTAL, 0);
      box.add(hbox);

      this._entry = Gtk.Entry.new();
      hbox.pack_start(this._entry, true, true, 0);

      const apply = Gtk.Button.new_from_icon_name("gtk-apply", Gtk.IconSize.BUTTON);
      apply.connect("clicked", (_button) => {
        this.popdown();
        if (this._callback !== null) {
          this._callback(this.action, EditAction.RENAME, this._entry.get_text());
        }
      });
      hbox.add(apply);

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
      hbox.add(reset);

      parent.add(box);
      return box;
    }

    _makeRemoveButton(parent) {
      const button = Gtk.Button.new_with_label("Remove");
      const icon = Gtk.Image.new_from_icon_name("gtk-delete", Gtk.IconSize.BUTTON);
      button.set_image(icon);
      button.always_show_image = true;
      parent.add(button);

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
      button.set_label(getDefaultText(action));
      button.set_alignment(0.0, 0.5);

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
}

function buildPrefsWidget() {
  let widget = new SettingsWidget();
  widget.show_all();

  return widget;
}
