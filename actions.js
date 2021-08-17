
const ExtensionUtils = imports.misc.extensionUtils;
const extension = ExtensionUtils.getCurrentExtension();
const { Key } = extension.imports.vars;

var Action = {
  COPY: 0,
  FILE: 1,
  TOOL: 2,
};

function getCurrentActions(gsettings) {
  let actions = [];

  let copy_val = gsettings.get_uint(Key.COPY_ACTION);
  if (copy_val > 0) {
    actions.push([Action.COPY, copy_val]);
  }
  let file_val = gsettings.get_uint(Key.FILE_ACTION);
  if (file_val > 0) {
    actions.push([Action.FILE, file_val]);
  }
  let tool_val = gsettings.get_uint(Key.TOOL_ACTION);
  if (tool_val > 0) {
    actions.push([Action.TOOL, tool_val]);
  }

  return actions.sort((a, b) => a[1] - b[1]).map((pair) => pair[0]);
}

function saveActions(gsettings, actions) {
  actions.forEach((action, index) => {
    if (action === Action.COPY) {
      gsettings.set_uint(Key.COPY_ACTION, index + 1);
    } else if (action === Action.FILE) {
      gsettings.set_uint(Key.FILE_ACTION, index + 1);
    } else if (action === Action.TOOL) {
      gsettings.set_uint(Key.TOOL_ACTION, index + 1);
    }
  });
}
