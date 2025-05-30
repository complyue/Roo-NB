import * as vscode from 'vscode';
import { NotebookService } from './notebook';

// Helper function to format error for display
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.stack || error.message}`;
  }
  return String(error);
}

// Helper function to convert result to VS Code API format
function createToolResult(text: string, isError = false): vscode.LanguageModelToolResult {
  return new vscode.LanguageModelToolResult([
    new vscode.LanguageModelTextPart(text)
  ]);
}

// Helper function to get extension settings
function getExtensionSettings() {
  const config = vscode.workspace.getConfiguration('roo-nb');
  return {
    maxOutputSize: config.get<number>('maxOutputSize', 2000),
    timeoutSeconds: config.get<number>('timeoutSeconds', 30)
  };
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Roo-NB extension activated');

  // 1. Get Notebook Info Tool
  context.subscriptions.push(vscode.lm.registerTool(
    'get_notebook_info',
    {
      async invoke(_options, _token) {
        try {
          const info = await NotebookService.getNotebookInfo();
          return createToolResult(info);
        } catch (error) {
          return createToolResult(`Error getting notebook info: ${formatError(error)}`, true);
        }
      }
    }
  ));

  // 2. Get Cells Tool
  context.subscriptions.push(vscode.lm.registerTool(
    'get_notebook_cells',
    {
      async invoke(_options, _token) {
        try {
          const settings = getExtensionSettings();
          const cells = await NotebookService.getCells(settings.maxOutputSize);
          return createToolResult(cells);
        } catch (error) {
          return createToolResult(`Error getting notebook cells: ${formatError(error)}`, true);
        }
      }
    }
  ));

  // 3. Insert Cells Tool
  context.subscriptions.push(vscode.lm.registerTool(
    'insert_notebook_cells',
    {
      async invoke(options, _token) {
        try {
          const input = options.input as any;
          if (!input || !input.cells || !Array.isArray(input.cells)) {
            throw new Error('Missing required parameter: cells array');
          }
          const cells = input.cells;
          const insertPosition = input.insert_position !== undefined ? Number(input.insert_position) : undefined;
          const noexec = input.noexec === true;
          const settings = getExtensionSettings();
          const result = await NotebookService.insertCells(cells, insertPosition, noexec, settings.maxOutputSize, settings.timeoutSeconds);
          return createToolResult(result);
        } catch (error) {
          return createToolResult(`Error inserting cells: ${formatError(error)}`, true);
        }
      }
    }
  ));

  // 4. Replace Cells Tool
  context.subscriptions.push(vscode.lm.registerTool(
    'replace_notebook_cells',
    {
      async invoke(options, _token) {
        try {
          const input = options.input as any;
          if (!input || input.start_index === undefined || input.end_index === undefined || !input.cells || !Array.isArray(input.cells)) {
            throw new Error('Missing required parameters: start_index, end_index, and cells array');
          }
          const startIndex = Number(input.start_index);
          const endIndex = Number(input.end_index);
          const cells = input.cells;
          const noexec = input.noexec === true;
          const settings = getExtensionSettings();
          const result = await NotebookService.replaceCells(
            (cellCount) => {
              if (startIndex < 0 || startIndex >= cellCount) {
                throw new Error(`Start index ${startIndex} is out of bounds (0-${cellCount - 1})`);
              }
              if (endIndex <= startIndex || endIndex > cellCount) {
                throw new Error(`End index ${endIndex} is invalid. Must be greater than start index ${startIndex} and not greater than ${cellCount}`);
              }
              return { startIndex, endIndex, cells };
            },
            noexec,
            settings.maxOutputSize,
            settings.timeoutSeconds
          );
          return createToolResult(result);
        } catch (error) {
          return createToolResult(`Error replacing cells: ${formatError(error)}`, true);
        }
      }
    }
  ));

  // 5. Modify Cell Content Tool
  context.subscriptions.push(vscode.lm.registerTool(
    'modify_notebook_cell_content',
    {
      async invoke(options, _token) {
        try {
          const input = options.input as any;
          if (!input || input.cell_index === undefined || !input.content) {
            throw new Error('Missing required parameters: cell_index and content');
          }
          const cellIndex = Number(input.cell_index);
          const content = String(input.content);
          const noexec = input.noexec === true;
          const settings = getExtensionSettings();
          const result = await NotebookService.modifyCellContent(
            (cellCount) => {
              if (cellIndex < 0 || cellIndex >= cellCount) {
                throw new Error(`Cell index ${cellIndex} is out of bounds (0-${cellCount - 1})`);
              }
              return cellIndex;
            },
            content,
            noexec,
            settings.maxOutputSize,
            settings.timeoutSeconds
          );
          return createToolResult(result);
        } catch (error) {
          return createToolResult(`Error modifying cell content: ${formatError(error)}`, true);
        }
      }
    }
  ));

  // 6. Execute Cells Tool
  context.subscriptions.push(vscode.lm.registerTool(
    'execute_notebook_cells',
    {
      async invoke(options, _token) {
        try {
          const input = options.input as any;
          if (!input || input.start_index === undefined || input.end_index === undefined) {
            throw new Error('Missing required parameters: start_index and end_index');
          }
          const startIndex = Number(input.start_index);
          const endIndex = Number(input.end_index);
          const settings = getExtensionSettings();
          const result = await NotebookService.executeCells(
            (cellCount) => {
              if (startIndex < 0 || startIndex >= cellCount) {
                throw new Error(`Start index ${startIndex} is out of bounds (0-${cellCount - 1})`);
              }
              if (endIndex <= startIndex || endIndex > cellCount) {
                throw new Error(`End index ${endIndex} is invalid. Must be greater than start index ${startIndex} and not greater than ${cellCount}`);
              }
              return { startIndex, endIndex };
            },
            settings.maxOutputSize,
            settings.timeoutSeconds
          );
          return createToolResult(result);
        } catch (error) {
          return createToolResult(`Error executing cells: ${formatError(error)}`, true);
        }
      }
    }
  ));

  // 7. Delete Cells Tool
  context.subscriptions.push(vscode.lm.registerTool(
    'delete_notebook_cells',
    {
      async invoke(options, _token) {
        try {
          const input = options.input as any;
          if (!input || input.start_index === undefined || input.end_index === undefined) {
            throw new Error('Missing required parameters: start_index and end_index');
          }
          const startIndex = Number(input.start_index);
          const endIndex = Number(input.end_index);
          const result = await NotebookService.deleteCells(
            (cellCount) => {
              if (startIndex < 0 || startIndex >= cellCount) {
                throw new Error(`Start index ${startIndex} is out of bounds (0-${cellCount - 1})`);
              }
              if (endIndex <= startIndex || endIndex > cellCount) {
                throw new Error(`End index ${endIndex} is invalid. Must be greater than start index ${startIndex} and not greater than ${cellCount}`);
              }
              return { startIndex, endIndex };
            }
          );
          return createToolResult(result);
        } catch (error) {
          return createToolResult(`Error deleting cells: ${formatError(error)}`, true);
        }
      }
    }
  ));

  // 8. Save Notebook Tool
  context.subscriptions.push(vscode.lm.registerTool(
    'save_notebook',
    {
      async invoke(_options, _token) {
        try {
          const result = await NotebookService.saveNotebook();
          return createToolResult(result);
        } catch (error) {
          return createToolResult(`Error saving notebook: ${formatError(error)}`, true);
        }
      }
    }
  ));

  // 9. Open Notebook Tool
  context.subscriptions.push(vscode.lm.registerTool(
    'open_notebook',
    {
      async invoke(options, _token) {
        try {
          const input = options.input as any;
          const notebookUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders?.[0].uri || vscode.Uri.file(''), input.path);
          const notebook = await vscode.workspace.openNotebookDocument(notebookUri);
          const editor = await vscode.window.showNotebookDocument(notebook, { preview: false });
          const kernelSpec = editor.notebook.metadata?.metadata?.kernelspec
          const notebookInfo = {
            uri: notebook.uri.toString(),
            notebookType: notebook.notebookType,
            isDirty: notebook.isDirty,
            kernelLanguage: kernelSpec?.language,
            kernelName: kernelSpec ? `${kernelSpec.display_name} (${kernelSpec.name})` : undefined,
            cellCount: notebook.cellCount
          };
          return createToolResult(JSON.stringify({
            status: 'success',
            message: `Notebook opened and activated: ${input.path}`,
            notebook: notebookInfo
          }, null, 2));
        } catch (error) {
          return createToolResult(`Error opening notebook: ${formatError(error)}`, true);
        }
      }
    }
  ));

  console.log('Roo-NB extension tools registered successfully');
}

export function deactivate() {
  // No cleanup needed
}
