#!/usr/bin/env gjs

imports.gi.versions.Gtk = "4.0";
const Gtk = imports.gi.Gtk;

imports.searchPath.unshift(".");
const { SettingsWidget } = imports.prefs;

let app = new Gtk.Application({ application_id: 'org.gtk.ExampleApp' });

app.connect('activate', () => {
  let window = new Gtk.ApplicationWindow({ application: app });
  let settings = new SettingsWidget();
  window.set_child(settings);
  window.show();
});

app.run([]);
