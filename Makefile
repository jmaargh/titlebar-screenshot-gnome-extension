
NAME = $(shell cat ./metadata.json | jq -j '.name')
UUID = $(shell cat ./metadata.json | jq -j '.uuid')
VERSION = $(shell cat ./metadata.json | jq -j '.version')

builddir := build

js_files := $(wildcard *.js)
schema_files := $(wildcard schemas/*.xml)
translation_files := $(js_files) $(schema_files)
sources := LICENSE-MIT LICENSE-GPL2 $(js_files) $(schema_files)

output := $(builddir)/$(UUID).zip

schemas/gschemas.compiled: $(schema_files)
	glib-compile-schemas schemas/

po/titlebar-screenshot.pot: $(translation_files)
	xgettext --from-code=UTF-8 --output=po/example.pot $(translation_files)

$(output): $(sources)
	mkdir -p $(builddir)
	gnome-extensions pack \
		--force \
		$(addprefix --extra-source=,$(sources)) \
		--podir=./po/ \
		--gettext-domain=$(UUID) \
		--out-dir=$(builddir) \
		.

.PHONY: test-settings
test-settings:
	gjs /usr/share/gnome-shell/org.gnome.Shell.Extensions & \
	  gnome-extensions prefs $(UUID)

.PHONY: clean
clean:
	-rm -rf $(builddir)

.PHONY: build
build: $(output)

.PHONY: install
install: uninstall
	gnome-extensions install --force ./build/$(UUID).shell-extension.zip

.PHONY: uninstall
uninstall:
	-gnome-extensions uninstall $(UUID)
