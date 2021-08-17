
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
    .map((k) => [Action[k], toKey(Action[k])])
    .map(([a, k]) => [a, gsettings.get_uint(k)])
    .filter(([_, value]) => value > 0)
    .sort((a, b) => a[1] - b[1])
    .map(([action, _]) => action)
}

function saveActions(gsettings, actions) {
  let setActions = new Set();
  actions.forEach((action, index) => {
    if (!setActions.has(action)) {
      gsettings.set_uint(toKey(action), index + 1);
    }
    setActions.add(action);
  });

  Object.keys(Action)
    .map((k) => Action[k])
    .filter((a) => !setActions.has(a))
    .forEach((a) => gsettings.set_uint(toKey(a), 0));
}

function toKey(action) {
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

function getActionText(gsettings, action) {
  let key;
  if (action === Action.COPY) {
    key = Key.COPY_TEXT;
  }
  if (action === Action.FILE) {
    key = Key.FILE_TEXT;
  }
  if (action === Action.TOOL) {
    key = Key.TOOL_TEXT;
  }

  return gsettings.get_string(key);
}

function getDefaultText(action) {
  let text = "unknown";
  switch (action) {
    case Action.COPY:
      text = "Copy screenshot";
      break;
    case Action.FILE:
      text = "Screenshot to file";
      break;
    case Action.TOOL:
      text = "Screenshot tool";
      break;
  }
  return text;
}
