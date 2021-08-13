

const { Gtk, GObject, Handy } = imports.gi;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;
const extension = ExtensionUtils.getCurrentExtension();
const { Key } = extension.imports.vars;

const SettingsWidget = GObject.registerClass({
  GTypeName: "TitlebarScreenshotSettingsWidget",
},
  class TitlebarScreenshotSettingsWidget extends Gtk.Box {
    _init(...args) {
      super._init(...args);

      this.margin = 32;
      this.spacing = 12;
      this.fill = true;
      this.set_orientation(Gtk.Orientation.HORIZONTAL);

      this.gsettings = ExtensionUtils.getSettings();

      this.firstSeparator = this.makeMenuSeparator();
      this.copyMenuItem = this.makeMenuButton("Copy screenshot");
      this.fileMenuItem = this.makeMenuButton("Screenshot to file");
      this.toolMenuItem = this.makeMenuButton("Screenshot tool");
      this.secondSeparator = this.makeMenuSeparator();
      this.menuItemsBox = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0);

      this.positionSpinner = null;
      this.separatorsSwitch = null;
      this.iconsSwitch = null;

      const configuration = this.makeConfigurationBox();
      this.add(configuration);

      const menuItems = this.makeMenuItems();
      this.add(menuItems);

      this.conncetSettingsChanged();
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
      const box = Gtk.ListBox.new(Gtk.Orientation.VERTICAL, 0);
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
      this.positionSpinner.connect("value-changed", Lang.bind(this, (spinner) => {
        this.gsettings.set_uint(Key.MENU_POSITION, spinner.get_value_as_int());
      }));
      positionRow.add(this.positionSpinner);
      box.add(positionRow);

      const separatorsRow = this.makeConfigurationRow(
        "Add separators",
        "Insert separators around screenshot actions in menu",
      );
      this.separatorsSwitch = Gtk.Switch.new();
      this.separatorsSwitch.set_valign(Gtk.Align.CENTER);
      this.separatorsSwitch.set_halign(Gtk.Align.END);
      this.separatorsSwitch.connect("notify::active", Lang.bind(this, (widget) => {
        this.gsettings.set_boolean(Key.USE_SEPARATORS, widget.active);
      }));
      separatorsRow.add(this.separatorsSwitch);
      box.add(separatorsRow);

      const iconsRow = this.makeConfigurationRow(
        "Show icons",
        "Add icon next to all screenshot actions",
      );
      this.iconsSwitch = Gtk.Switch.new();
      this.iconsSwitch.set_valign(Gtk.Align.CENTER);
      this.iconsSwitch.set_halign(Gtk.Align.END);
      this.iconsSwitch.connect("notify::active", Lang.bind(this, (widget) => {
        this.gsettings.set_boolean(Key.ICON_IN_MENU, widget.active);
      }));
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
      frame.set_halign(Gtk.Align.END);

      this.menuItemsBox.margin = 6;
      frame.add(this.menuItemsBox);

      this.menuItemsBox.add(this.firstSeparator);
      this.menuItemsBox.add(this.copyMenuItem);
      this.menuItemsBox.add(this.secondSeparator);

      const addButton = Gtk.Button.new();
      addButton.set_label("Add");
      const addImage = Gtk.Image.new_from_icon_name("gtk-add", Gtk.IconSize.MENU);
      addButton.set_image(addImage);
      addButton.always_show_image = true;
      addButton.margin_top = 12;
      addButton.set_alignment(0.0, 0.5);
      this.menuItemsBox.add(addButton);

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

    makeMenuSeparator() {
      const separator = Gtk.Separator.new(Gtk.Orientation.HORIZONTAL);
      separator.padding = 6;
      return separator;
    }

    makeMenuButton(text) {
      const button = Gtk.Button.new();
      button.set_label(text);
      button.set_relief(Gtk.ReliefStyle.NONE);

      const image = Gtk.Image.new_from_icon_name("org.gnome.Screenshot", Gtk.IconSize.MENU);
      button.set_image(image);
      button.always_show_image = true;
      button.set_alignment(0.0, 0.5);

      return button;
    }

    conncetSettingsChanged() {
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
