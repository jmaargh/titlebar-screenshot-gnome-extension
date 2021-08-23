# Titlebar Screenshot

Adds items to the window menu to take screenshots of the current window. Just
right-click the titlebar and take a screenshot.

![](./media/screenshot.png)

Screenshots are taken with [gnome-screenshot](https://gitlab.gnome.org/GNOME/gnome-screenshot/).

The current options are:

* **Copy screenshot**: screenshot the window and save it to the copy/paste buffer
* **Screenshot to file**: screenshot the window and save to a file
* **Screenshot tool**: open gnome-screenshot, ready to take a screenshot of the window

## Supported gnome versions

Currently only **gnome 3.38**, since that's the version I'm running right now.
If there's interest, I'm open to testing and porting on other versions.

## Configuration

This extension is designed to be as configurable as possible, allowing users to
choose which options are shown in the menu, where in the menu they appear,
the exact text of the menu items, etc.

## Limitations

Since gnome-screenshot is used to actually take the screenshots, we are limited
to the options exposed by the gnome-screenshot command line interface.

For example, it is not currently possible to have the "Screenshot to tool"
option actually take the screenshot and open straight into the dialog letting
the user choose what to do with it.

To change the location that files are saved to, please see the configuration
for gnome-screenshot.

## Contributing and feedback

All contributions and feedback are welcome. Please open issues for

* Bugs
* Gnome version support
* Translations
* Feature requests

or anything else you can think of.