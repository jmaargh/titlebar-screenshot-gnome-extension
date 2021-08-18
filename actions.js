/* actions.js
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
 * SPDX-License-Identifier: MIT
 */

'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const extension = ExtensionUtils.getCurrentExtension();
const { Key } = extension.imports.vars;

var Action = {
  COPY: 0,
  FILE: 1,
  TOOL: 2,
};

function getCurrentActions(gsettings) {
  return Object.keys(Action)
    .map((k) => [Action[k], toActionKey(Action[k])])
    .map(([a, k]) => [a, gsettings.get_uint(k)])
    .filter(([_, value]) => value > 0)
    .sort((a, b) => a[1] - b[1])
    .map(([action, _]) => action)
}

function saveActions(gsettings, actions) {
  let setActions = new Set();
  actions.forEach((action, index) => {
    if (!setActions.has(action)) {
      gsettings.set_uint(toActionKey(action), index + 1);
    }
    setActions.add(action);
  });

  Object.keys(Action)
    .map((k) => Action[k])
    .filter((a) => !setActions.has(a))
    .forEach((a) => gsettings.set_uint(toActionKey(a), 0));
}

function toActionKey(action) {
  if (action === Action.COPY) {
    return Key.COPY_ACTION;
  }
  if (action === Action.FILE) {
    return Key.FILE_ACTION;
  }
  if (action === Action.TOOL) {
    return Key.TOOL_ACTION;
  }
}

function toTextKey(action) {
  if (action === Action.COPY) {
    return Key.COPY_TEXT;
  }
  if (action === Action.FILE) {
    return Key.FILE_TEXT;
  }
  if (action === Action.TOOL) {
    return Key.TOOL_TEXT;
  }
}

function getDefaultText(action, gettext) {
  if (action === Action.COPY) {
    return gettext("Copy screenshot");
  }
  if (action === Action.FILE) {
    return gettext("Screenshot to file");
  }
  if (action === Action.TOOL) {
    return gettext("Screenshot tool");
  }
}
