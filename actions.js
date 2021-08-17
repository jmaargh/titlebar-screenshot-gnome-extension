
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
