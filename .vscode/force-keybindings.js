// Force Keybinding Override Extension
// This script forces Ctrl+A, Ctrl+C, Ctrl+V to work in Cursor IDE

const vscode = require('vscode')

function activate(context) {
  // Force Ctrl+A - Select All
  let selectAllCommand = vscode.commands.registerCommand('force.selectAll', () => {
    vscode.commands.executeCommand('editor.action.selectAll')
  })

  // Force Ctrl+C - Copy
  let copyCommand = vscode.commands.registerCommand('force.copy', () => {
    vscode.commands.executeCommand('editor.action.clipboardCopyAction')
  })

  // Force Ctrl+V - Paste
  let pasteCommand = vscode.commands.registerCommand('force.paste', () => {
    vscode.commands.executeCommand('editor.action.clipboardPasteAction')
  })

  // Register keybinding overrides
  context.subscriptions.push(selectAllCommand)
  context.subscriptions.push(copyCommand)
  context.subscriptions.push(pasteCommand)

  // Global key interceptor
  const disposable = vscode.window.onDidChangeActiveTextEditor(() => {
    if (vscode.window.activeTextEditor) {
      // Bind to editor context
      vscode.commands.executeCommand('setContext', 'force.keybindingsActive', true)
    }
  })

  context.subscriptions.push(disposable)
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
}
