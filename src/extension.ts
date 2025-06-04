import * as vscode from 'vscode';
import { NotebookService } from './notebook';

// Proper interface for tool invocation
interface PreparedToolInvocation {
  invocationMessage: string;
  confirmationMessages: {
    title: string;
    message: vscode.MarkdownString | string;
  };
}

abstract class BaseNotebookTool<T> {
  abstract name: string;
  abstract displayName: string;

  async prepareInvocation(
    options: vscode.LanguageModelToolInvocationPrepareOptions<T>,
    _token: vscode.CancellationToken
  ): Promise<PreparedToolInvocation> {
    return {
      invocationMessage: `Invoking ${this.displayName}`,
      confirmationMessages: {
        title: this.displayName,
        message: new vscode.MarkdownString(`Confirming invocation of ${this.displayName}`)
      }
    };
  }

  abstract invoke(
    options: vscode.LanguageModelToolInvocationOptions<T>,
    token: vscode.CancellationToken
  ): Promise<vscode.LanguageModelToolResult>;

  register(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.lm.registerTool(this.name, this));
  }

  protected createToolResult(text: string, isError = false): vscode.LanguageModelToolResult {
    return new vscode.LanguageModelToolResult([
      new vscode.LanguageModelTextPart(text)
    ]);
  }

  protected formatError(error: unknown): string {
    if (error instanceof Error) {
      return `${error.stack || error.message}`;
    }
    return String(error);
  }

  protected getExtensionSettings() {
    const config = vscode.workspace.getConfiguration('roo-nb');
    return {
      maxOutputSize: config.get<number>('maxOutputSize', 2000),
      timeoutSeconds: config.get<number>('timeoutSeconds', 30)
    };
  }
}

// Tool implementations
class GetNotebookInfoTool extends BaseNotebookTool<void> {
  name = 'get_notebook_info';
  displayName = 'Get Notebook Info';

  async invoke(_options: vscode.LanguageModelToolInvocationOptions<void>, _token: vscode.CancellationToken) {
    try {
      const info = await NotebookService.getNotebookInfo();
      return this.createToolResult(info);
    } catch (error) {
      return this.createToolResult(`Error getting notebook info: ${this.formatError(error)}`, true);
    }
  }
}

class GetNotebookCellsTool extends BaseNotebookTool<void> {
  name = 'get_notebook_cells';
  displayName = 'Get Notebook Cells';

  async invoke(_options: vscode.LanguageModelToolInvocationOptions<void>, _token: vscode.CancellationToken) {
    try {
      const settings = this.getExtensionSettings();
      const cells = await NotebookService.getCells(settings.maxOutputSize);
      return this.createToolResult(cells);
    } catch (error) {
      return this.createToolResult(`Error getting notebook cells: ${this.formatError(error)}`, true);
    }
  }
}

interface InsertNotebookCellsInput {
  cells: any[];
  insert_position?: number;
  noexec?: boolean;
}

class InsertNotebookCellsTool extends BaseNotebookTool<InsertNotebookCellsInput> {
  name = 'insert_notebook_cells';
  displayName = 'Insert Notebook Cells';

  async invoke(options: vscode.LanguageModelToolInvocationOptions<InsertNotebookCellsInput>, _token: vscode.CancellationToken) {
    try {
      const { cells, insert_position, noexec } = options.input;
      if (!cells || !Array.isArray(cells)) {
        throw new Error('Missing required parameter: cells array');
      }

      const settings = this.getExtensionSettings();
      const result = await NotebookService.insertCells(
        cells,
        insert_position,
        noexec,
        settings.maxOutputSize,
        settings.timeoutSeconds
      );
      return this.createToolResult(result);
    } catch (error) {
      return this.createToolResult(`Error inserting cells: ${this.formatError(error)}`, true);
    }
  }
}

interface ReplaceNotebookCellsInput {
  start_index: number;
  stop_index: number;
  cells: any[];
  noexec?: boolean;
}

class ReplaceNotebookCellsTool extends BaseNotebookTool<ReplaceNotebookCellsInput> {
  name = 'replace_notebook_cells';
  displayName = 'Replace Notebook Cells';

  async invoke(options: vscode.LanguageModelToolInvocationOptions<ReplaceNotebookCellsInput>, _token: vscode.CancellationToken) {
    try {
      const { start_index, stop_index, cells, noexec } = options.input;
      if (start_index === undefined || stop_index === undefined || !cells || !Array.isArray(cells)) {
        throw new Error('Missing required parameters: start_index, stop_index, and cells array');
      }

      const settings = this.getExtensionSettings();
      const result = await NotebookService.replaceCells(
        (cellCount) => {
          if (start_index < 0 || start_index >= cellCount) {
            throw new Error(`Start index ${start_index} is out of bounds (0-${cellCount - 1})`);
          }
          if (stop_index <= start_index || stop_index > cellCount) {
            throw new Error(`End index ${stop_index} is invalid. Must be greater than start index ${start_index} and not greater than ${cellCount}`);
          }
          return { startIndex: start_index, stopIndex: stop_index, cells };
        },
        noexec,
        settings.maxOutputSize,
        settings.timeoutSeconds
      );
      return this.createToolResult(result);
    } catch (error) {
      return this.createToolResult(`Error replacing cells: ${this.formatError(error)}`, true);
    }
  }
}

interface ModifyNotebookCellContentInput {
  cell_index: number;
  content: string;
  noexec?: boolean;
}

class ModifyNotebookCellContentTool extends BaseNotebookTool<ModifyNotebookCellContentInput> {
  name = 'modify_notebook_cell_content';
  displayName = 'Modify Notebook Cell Content';

  async invoke(options: vscode.LanguageModelToolInvocationOptions<ModifyNotebookCellContentInput>, _token: vscode.CancellationToken) {
    try {
      const { cell_index, content, noexec } = options.input;
      if (cell_index === undefined || !content) {
        throw new Error('Missing required parameters: cell_index and content');
      }

      const settings = this.getExtensionSettings();
      const result = await NotebookService.modifyCellContent(
        (cellCount) => {
          if (cell_index < 0 || cell_index >= cellCount) {
            throw new Error(`Cell index ${cell_index} is out of bounds (0-${cellCount - 1})`);
          }
          return cell_index;
        },
        content,
        noexec,
        settings.maxOutputSize,
        settings.timeoutSeconds
      );
      return this.createToolResult(result);
    } catch (error) {
      return this.createToolResult(`Error modifying cell content: ${this.formatError(error)}`, true);
    }
  }
}

interface ExecuteNotebookCellsInput {
  start_index: number;
  stop_index: number;
}

class ExecuteNotebookCellsTool extends BaseNotebookTool<ExecuteNotebookCellsInput> {
  name = 'execute_notebook_cells';
  displayName = 'Execute Notebook Cells';

  async invoke(options: vscode.LanguageModelToolInvocationOptions<ExecuteNotebookCellsInput>, _token: vscode.CancellationToken) {
    try {
      const { start_index, stop_index } = options.input;
      if (start_index === undefined || stop_index === undefined) {
        throw new Error('Missing required parameters: start_index and stop_index');
      }

      const settings = this.getExtensionSettings();
      const result = await NotebookService.executeCells(
        (cellCount) => {
          if (start_index < 0 || start_index >= cellCount) {
            throw new Error(`Start index ${start_index} is out of bounds (0-${cellCount - 1})`);
          }
          if (stop_index <= start_index || stop_index > cellCount) {
            throw new Error(`End index ${stop_index} is invalid. Must be greater than start index ${start_index} and not greater than ${cellCount}`);
          }
          return { startIndex: start_index, stopIndex: stop_index };
        },
        settings.maxOutputSize,
        settings.timeoutSeconds
      );
      return this.createToolResult(result);
    } catch (error) {
      return this.createToolResult(`Error executing cells: ${this.formatError(error)}`, true);
    }
  }
}

interface DeleteNotebookCellsInput {
  start_index: number;
  stop_index: number;
}

class DeleteNotebookCellsTool extends BaseNotebookTool<DeleteNotebookCellsInput> {
  name = 'delete_notebook_cells';
  displayName = 'Delete Notebook Cells';

  async invoke(options: vscode.LanguageModelToolInvocationOptions<DeleteNotebookCellsInput>, _token: vscode.CancellationToken) {
    try {
      const { start_index, stop_index } = options.input;
      if (start_index === undefined || stop_index === undefined) {
        throw new Error('Missing required parameters: start_index and stop_index');
      }

      const result = await NotebookService.deleteCells(
        (cellCount) => {
          if (start_index < 0 || start_index >= cellCount) {
            throw new Error(`Start index ${start_index} is out of bounds (0-${cellCount - 1})`);
          }
          if (stop_index <= start_index || stop_index > cellCount) {
            throw new Error(`End index ${stop_index} is invalid. Must be greater than start index ${start_index} and not greater than ${cellCount}`);
          }
          return { startIndex: start_index, stopIndex: stop_index };
        }
      );
      return this.createToolResult(result);
    } catch (error) {
      return this.createToolResult(`Error deleting cells: ${this.formatError(error)}`, true);
    }
  }
}

class SaveNotebookTool extends BaseNotebookTool<void> {
  name = 'save_notebook';
  displayName = 'Save Notebook';

  async invoke(_options: vscode.LanguageModelToolInvocationOptions<void>, _token: vscode.CancellationToken) {
    try {
      const result = await NotebookService.saveNotebook();
      return this.createToolResult(result);
    } catch (error) {
      return this.createToolResult(`Error saving notebook: ${this.formatError(error)}`, true);
    }
  }
}

interface OpenNotebookInput {
  path: string;
}

class OpenNotebookTool extends BaseNotebookTool<OpenNotebookInput> {
  name = 'open_notebook';
  displayName = 'Open Notebook';

  async invoke(options: vscode.LanguageModelToolInvocationOptions<OpenNotebookInput>, _token: vscode.CancellationToken) {
    try {
      const { path } = options.input;
      const notebookUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders?.[0].uri || vscode.Uri.file(''), path);
      const notebook = await vscode.workspace.openNotebookDocument(notebookUri);
      const editor = await vscode.window.showNotebookDocument(notebook, { preview: false });
      const kernelSpec = editor.notebook.metadata?.metadata?.kernelspec;
      const notebookInfo = {
        uri: notebook.uri.toString(),
        notebookType: notebook.notebookType,
        isDirty: notebook.isDirty,
        kernelLanguage: kernelSpec?.language,
        kernelName: kernelSpec ? `${kernelSpec.display_name} (${kernelSpec.name})` : undefined,
        cellCount: notebook.cellCount
      };
      return this.createToolResult(JSON.stringify({
        status: 'success',
        message: `Notebook opened and activated: ${path}`,
        notebook: notebookInfo
      }, null, 2));
    } catch (error) {
      return this.createToolResult(`Error opening notebook: ${this.formatError(error)}`, true);
    }
  }
}

export function activate(context: vscode.ExtensionContext) {
  console.log('Roo-NB extension activated');

  // Proper tool registration
  const tools = [
    new GetNotebookInfoTool(),
    new GetNotebookCellsTool(),
    new InsertNotebookCellsTool(),
    new ReplaceNotebookCellsTool(),
    new ModifyNotebookCellContentTool(),
    new ExecuteNotebookCellsTool(),
    new DeleteNotebookCellsTool(),
    new SaveNotebookTool(),
    new OpenNotebookTool()
  ];

  tools.forEach(tool => tool.register(context));

  console.log('Roo-NB extension tools registered successfully');
}

export function deactivate() {
  // No cleanup needed
}
