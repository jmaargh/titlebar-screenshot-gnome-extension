
js_files := $(wildcard *.js)
schema_files := $(wildcard schemas/*.xml)
translation_files := $(js_files) $(schema_files)

schemas/gschemas.compiled: $(schema_files)
	glib-compile-schemas schemas/

po/titlebar-screenshot.pot: $(translation_files)
	xgettext --from-code=UTF-8 --output=po/example.pot $(translation_files)

.PHONY: test-settings
test-settings:
	gjs /usr/share/gnome-shell/org.gnome.Shell.Extensions &\
	  gnome-extensions prefs  titlebar-screenshot@jmaargh.github.com
