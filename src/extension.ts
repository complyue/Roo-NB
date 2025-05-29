import * as vscode from 'vscode';
import { NotebookService } from './notebook';
import { z } from 'zod';

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

  // Register notebook tools with vscode.lm
  const lm = (vscode as any).lm;
  if (!lm || typeof lm.registerTool !== 'function') {
    vscode.window.showErrorMessage('vscode.lm API is not available. Please update VS Code to the latest version.');
    return;
  }

  // 1. Get Notebook Info Tool
  lm.registerTool({
    name: 'get_notebook_info',
    description: `Get comprehensive information about the active notebook, including URI, kernel, and cell statistics. Use this tool when you need to understand what notebook is open, what kernel it uses, and how many cells it contains. Response will include notebook path, metadata, cell count, and kernel information if available.`,
    inputSchema: z.object({})
  }, async () => {
    try {
      const info = await NotebookService.getNotebookInfo();
      return {
        content: [{ type: 'text', text: info }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error getting notebook info: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  });

  // 2. Get Cells Tool
  lm.registerTool({
    name: 'get_notebook_cells',
    description: `Get information about all cells in the active notebook. Use this to examine cell contents, types, and outputs before making edits or executing cells. Response includes cell indexes, types, content, and execution outputs (if any). Outputs longer than the configured limit will be truncated. Ask the user to adjust the \`maxOutputSize\` in case you think more or less information is better.`,
    inputSchema: z.object({})
  }, async () => {
    try {
      const settings = getExtensionSettings();
      const cells = await NotebookService.getCells(settings.maxOutputSize);
      return {
        content: [{ type: 'text', text: cells }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error getting notebook cells: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  });

  // 3. Insert Cells Tool
  lm.registerTool({
    name: 'insert_notebook_cells',
    description: `Insert multiple cells at the specified position in the active notebook (0-based indexing). By default, new code cells are executed immediately unless noexec is set to true.

Use this when you need to:
- Add new code or markdown cells to the notebook
- Insert explanatory text via markdown cells
- Add new code for data analysis, visualization, or processing

Examples:
1. Insert markdown header followed by code at the beginning:
{
  "cells": [
    {"content": "# Data Analysis", "cell_type": "markdown"},
    {"content": "import pandas as pd\\ndf = pd.read_csv(\\"data.csv\\")", "cell_type": "code", "language_id": "python"}
  ],
  "insert_position": 0
}

2. Append a cell to the end (no insert_position):
{
  "cells": [{"content": "print(\\"Final results:\\", results)", "cell_type": "code", "language_id": "python"}]
}

3. Insert code cell without execution:
{
  "cells": [{"content": "# Complex calculation\\nresult = compute_complex_metric(data)", "cell_type": "code", "language_id": "python"}],
  "insert_position": 2,
  "noexec": true
}`,
    inputSchema: z.object({
      cells: z.array(z.object({
        content: z.string(),
        cell_type: z.enum(['code', 'markdown']),
        language_id: z.string().optional()
      })),
      insert_position: z.number().int().optional(),
      noexec: z.boolean().optional()
    })
  }, async (args: any) => {
    try {
      if (!args || !args.cells || !Array.isArray(args.cells)) {
        throw new Error('Missing required parameter: cells array');
      }
      const cells = args.cells as Array<{ content: string; cell_type?: string; language_id?: string; }>;
      const insertPosition = args.insert_position !== undefined ? Number(args.insert_position) : undefined;
      const noexec = args.noexec === true;
      const settings = getExtensionSettings();
      const result = await NotebookService.insertCells(cells, insertPosition, noexec, settings.maxOutputSize, settings.timeoutSeconds);
      return {
        content: [{ type: 'text', text: result }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error inserting cells: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  });

  // 4. Replace Cells Tool
  lm.registerTool({
    name: 'replace_notebook_cells',
    description: `Replace a range of cells in the notebook with new cells (0-based indexing). Use this when you need to completely update or rewrite a section of the notebook. Executed automatically unless noexec is true.

Use this when you need to:
- Rewrite a section of analysis with a better approach
- Update outdated code with improved implementations
- Replace placeholder cells with actual content

Examples:
1. Replace cells 2-4 with new analysis:
{
  "start_index": 2,
  "end_index": 4,
  "cells": [
    {"content": "## Improved Analysis", "cell_type": "markdown"},
    {"content": "# More efficient implementation\\nresults = optimized_function(data)\\nprint(results)", "cell_type": "code", "language_id": "python"}
  ]
}

2. Replace without execution:
{
  "start_index": 3,
  "end_index": 4,
  "cells": [{"content": "# New implementation to review\\nresults = new_analysis(df)", "cell_type": "code", "language_id": "python"}],
  "noexec": true
}

3. Valid: start_index=1, end_index=3 (replaces cells 1 and 2)
4. Invalid: start_index=1, end_index=1 (end must be > start)`,
    inputSchema: z.object({
      start_index: z.number().int().min(0),
      end_index: z.number().int().min(0).gt(0),
      cells: z.array(z.object({
        content: z.string(),
        cell_type: z.enum(['code', 'markdown']),
        language_id: z.string().optional()
      })),
      noexec: z.boolean().optional()
    })
  }, async (args: any) => {
    try {
      if (!args || args.start_index === undefined || args.end_index === undefined || !args.cells || !Array.isArray(args.cells)) {
        throw new Error('Missing required parameters: start_index, end_index, and cells array');
      }
      const startIndex = Number(args.start_index);
      const endIndex = Number(args.end_index);
      const cells = args.cells as Array<{ content: string; cell_type?: string; language_id?: string; }>;
      const noexec = args.noexec === true;
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
      return {
        content: [{ type: 'text', text: result }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error replacing cells: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  });

  // 5. Modify Cell Content Tool
  lm.registerTool({
    name: 'modify_notebook_cell_content',
    description: `Modify the content of an existing cell (0-based indexing). Use this when you need to make changes to a single cell without affecting other cells. By default, modified code cells are executed unless noexec is true.

Use this when you need to:
- Fix errors in code
- Update or enhance existing code
- Improve markdown documentation
- Add or modify parameters in existing code

Examples:
1. Fix a syntax error in cell 2:
{
  "cell_index": 2,
  "content": "for i in range(10):\\n    print(f\\"Value: {i}\\")"  
}

2. Update imports without execution:
{
  "cell_index": 0,
  "content": "import pandas as pd\\nimport numpy as np\\nimport matplotlib.pyplot as plt\\nimport seaborn as sns",
  "noexec": true
}`,
    inputSchema: z.object({
      cell_index: z.number().int().min(0),
      content: z.string(),
      noexec: z.boolean().optional()
    })
  }, async (args: any) => {
    try {
      if (!args || args.cell_index === undefined || !args.content) {
        throw new Error('Missing required parameters: cell_index and content');
      }
      const cellIndex = Number(args.cell_index);
      const content = String(args.content);
      const noexec = args.noexec === true;
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
      return {
        content: [{ type: 'text', text: result }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error modifying cell content: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  });

  // 6. Execute Cells Tool
  lm.registerTool({
    name: 'execute_notebook_cells',
    description: `Execute a range of cells in the active notebook (0-based indexing).

Use this when you need to:
- Run data processing steps
- Generate visualizations
- Compute and display results
- Test if code is functioning correctly

Examples:
1. Execute the first three cells:
{
  "start_index": 0,
  "end_index": 3
}

2. Execute a single cell at index 4:
{
  "start_index": 4,
  "end_index": 5
}

3. Valid: start_index=1, end_index=2 (executes cell 1)
4. Invalid: start_index=1, end_index=1 (end must be > start)`,
    inputSchema: z.object({
      start_index: z.number().int().min(0),
      end_index: z.number().int().min(0).gt(0)
    })
  }, async (args: any) => {
    try {
      if (!args || args.start_index === undefined || args.end_index === undefined) {
        throw new Error('Missing required parameters: start_index and end_index');
      }
      const startIndex = Number(args.start_index);
      const endIndex = Number(args.end_index);
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
      return {
        content: [{ type: 'text', text: result }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error executing cells: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  });

  // 7. Delete Cells Tool
  lm.registerTool({
    name: 'delete_notebook_cells',
    description: `Delete a range of cells from the notebook (0-based indexing). Use this when you need to remove unwanted or redundant cells to clean up the notebook.

Use this when you need to:
- Remove debugging cells
- Clean up draft or exploratory code
- Delete outdated content
- Remove failed approaches before replacing them

Examples:
1. Delete a single cell at index 3:
{
  "start_index": 3,
  "end_index": 4
}

2. Delete multiple cells from 2 through 4:
{
  "start_index": 2,
  "end_index": 5
}

3. Valid: start_index=1, end_index=2 (deletes cell 1)
4. Invalid: start_index=1, end_index=1 (end must be > start)`,
    inputSchema: z.object({
      start_index: z.number().int().min(0),
      end_index: z.number().int().min(0).gt(0)
    })
  }, async (args: any) => {
    try {
      if (!args || args.start_index === undefined || args.end_index === undefined) {
        throw new Error('Missing required parameters: start_index and end_index');
      }
      const startIndex = Number(args.start_index);
      const endIndex = Number(args.end_index);
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
      return {
        content: [{ type: 'text', text: result }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error deleting cells: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  });

  // 8. Save Notebook Tool
  lm.registerTool({
    name: 'save_notebook',
    description: `Save the active notebook to disk. Use this after making changes to ensure they are persisted. This tool should be used after significant changes or before suggesting the user close the notebook. Returns a confirmation message with the saved notebook path.`,
    inputSchema: z.object({})
  }, async () => {
    try {
      const result = await NotebookService.saveNotebook();
      return {
        content: [{ type: 'text', text: result }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error saving notebook: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  });

  // 9. Open Notebook Tool
  lm.registerTool({
    name: 'open_notebook',
    description: `Open specified .ipynb file in workspace and make it the active notebook editor. Returns detailed notebook information including URI, document type, kernel spec, and cell count. Use this when you need to switch to and work with a different notebook file in the workspace.`,
    inputSchema: z.object({
      path: z.string().describe("Path to the .ipynb notebook file to open, relative to workspace root")
    })
  }, async ({ path }: { path: string }) => {
    try {
      const notebookUri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders?.[0].uri || vscode.Uri.file(''), path);
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
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            status: 'success',
            message: `Notebook opened and activated: ${path}`,
            notebook: notebookInfo
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error opening notebook: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true
      };
    }
  });

  vscode.window.showInformationMessage('Successfully registered Roo-NB notebook tools with VSCode LM API');
}

export function deactivate() {
  // No cleanup needed
}
