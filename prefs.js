

const { Gtk, GObject, Handy } = imports.gi;

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

      this.firstSeparator = this.makeMenuSeparator();
      this.copyMenuItem = this.makeMenuButton("Copy screenshot");
      this.fileMenuItem = this.makeMenuButton("Screenshot to file");
      this.toolMenuItem = this.makeMenuButton("Screenshot tool");
      this.secondSeparator = this.makeMenuSeparator();
      this.menuItemsBox = Gtk.Box.new(Gtk.Orientation.VERTICAL, 0);

      const configuration = this.makeConfigurationBox();
      this.add(configuration);

      const menuItems = this.makeMenuItems();
      this.add(menuItems);
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

      const positionRow = this.makeConfigurationRow(
        "Position in menu",
        "Number of items before screenshot actions\n(including separators)"
      );
      const positionSpinner = Gtk.SpinButton.new_with_range(0, 1024, 1);
      positionSpinner.set_valign(Gtk.Align.CENTER);
      positionSpinner.set_halign(Gtk.Align.CEEND);
      positionRow.add(positionSpinner);
      box.add(positionRow);

      const separatorsRow = this.makeConfigurationRow(
        "Add separators",
        "Insert separators around screenshot actions in menu",
      );
      const separatorsSwitch = Gtk.Switch.new();
      separatorsSwitch.set_valign(Gtk.Align.CENTER);
      separatorsSwitch.set_halign(Gtk.Align.END);
      separatorsRow.add(separatorsSwitch);
      box.add(separatorsRow);

      const iconsRow = this.makeConfigurationRow(
        "Show icons",
        "Add icon next to all screenshot actions",
      );
      const iconsSwitch = Gtk.Switch.new();
      iconsSwitch.set_valign(Gtk.Align.CENTER);
      iconsSwitch.set_halign(Gtk.Align.END);
      iconsRow.add(iconsSwitch);
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
  }
);

function init() {
}

function buildPrefsWidget() {
  let widget = new SettingsWidget();
  widget.show_all();

  return widget;
}
