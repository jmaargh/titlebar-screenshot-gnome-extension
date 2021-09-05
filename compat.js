/* compat.js
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

const { Gtk } = imports.gi;

// FIXME: this entire file is a hack to get preferences working on GTK4
// In the future, we should handle GTK versions much more elegantly.
const IS_GTK4 = (Gtk.get_major_version() === 4);

function gtkShowAll(widget) {
  if (!IS_GTK4) {
    widget.show_all();
  }
}

function gtkWidgetMargin(widget, margin) {
  widget.set_margin_top(margin);
  widget.set_margin_bottom(margin);
  widget.set_margin_start(margin);
  widget.set_margin_end(margin);
}

function gtkBoxAdd(box, child) {
  if (IS_GTK4) {
    box.append(child);
  } else {
    box.add(child);
  }
}

function gtkBoxGetChildren(box) {
  let children = [];
  let child = box.get_first_child();
  while (child !== null) {
    children.unshift(child);
    child = child.get_next_sibling();
  }
  return children;
}

function gtkBoxPackStart(box, child, expand, fill, padding) {
  if (IS_GTK4) {
    if (fill) {
      if (box.get_orientation() === Gtk.Orientation.HORIZONTAL) {
        child.set_halign(Gtk.Align.FILL);
      } else {
        child.set_valign(Gtk.Align.FILL);
      }
    }
    if (expand) {
      if (box.get_orientation() === Gtk.Orientation.HORIZONTAL) {
        child.set_hexpand(true);
      } else {
        child.set_vexpand(true);
      }
    }
    if (padding) {
      gtkWidgetMargin(child, margin);
    }

    box.prepend(child);
  } else {
    box.pack_start(child, expand, fill, padding);
  }
}

function gtkBoxPackEnd(box, child, expand, fill, padding) {
  if (IS_GTK4) {
    if (fill) {
      if (box.get_orientation() === Gtk.Orientation.HORIZONTAL) {
        child.set_halign(Gtk.Align.FILL);
      } else {
        child.set_valign(Gtk.Align.FILL);
      }
    }
    if (expand) {
      if (box.get_orientation() === Gtk.Orientation.HORIZONTAL) {
        child.set_hexpand(true);
      } else {
        child.set_vexpand(true);
      }
    }
    if (padding) {
      gtkWidgetMargin(child, margin);
    }

    box.append(child);
  } else {
    box.pack_end(child, expand, fill, padding);
  }
}

function gtkSetChild(container, child) {
  if (IS_GTK4) {
    container.set_child(child);
  } else {
    container.add(child);
  }
}

function gtkLabelSetWrap(label, shouldWrap) {
  if (IS_GTK4) {
    label.set_wrap(shouldWrap);
  } else {
    label.set_line_wrap(shouldWrap);
  }
}

function gtkButtonSetHasFrame(button, hasFrame) {
  if (IS_GTK4) {
    button.set_has_frame(hasFrame);
  } else {
    button.set_relief(hasFrame ? Gtk.ReliefStyle.NORMAL : Gtk.ReliefStyle.NONE);
  }
}
