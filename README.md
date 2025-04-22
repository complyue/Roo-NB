# Roo Notebook Tools

This extension provides notebook operation tools for Roo, enabling AI-assisted notebook manipulation and execution.

## Features

This extension integrates with Roo to provide the following notebook tools:

- **Notebook Info**: Get comprehensive information about the active notebook, including URI, kernel, and cell statistics
- **Get Cells**: View information about all cells in the active notebook
- **Insert Cells**: Insert multiple cells at a specified position in the notebook
- **Replace Cells**: Replace a range of cells with new cells
- **Modify Cell Content**: Modify the content of an existing cell
- **Execute Cells**: Execute a range of cells and get their output
- **Delete Cells**: Delete a range of cells from the notebook
- **Save Notebook**: Save the active notebook to disk

## Usage

Once installed, the extension will automatically register its tools with Roo.

You can then use the tools in Roo by asking it to:

- "Show me information about the active notebook"
- "Get details of all the cells in the active notebook"
- "Insert a new Python code cell at beginning, that prints 'Hello World'"
- "Execute cells 3 through 5"
- "Delete the last cell"
- "Save my notebook"

## Requirements

- VSCode 1.85.0 or higher
- Roo extension (RooVeterinaryInc.roo-cline)

## Extension Settings

This extension contributes the following settings:

- `roo-nb.maxOutputSize`: Maximum size (in characters) for cell output truncation (default: 2000)
- `roo-nb.timeoutSeconds`: Maximum seconds to wait for cell execution (default: 30)

You can adjust these settings in your VS Code settings based on your needs.

## Known Issues

- **Truncated Cell Contents**: By default, cell contents and outputs longer than 2000 characters are truncated. If you're working with notebooks that contain large outputs, you may need to increase the `roo-nb.maxOutputSize` setting in your VS Code preferences.
- **Execution Timeout**: Cell execution times out after 30 seconds by default. For long-running computations, increase the `roo-nb.timeoutSeconds` setting.

## Development

This extension demonstrates how to create a VSCode extension that provides notebook manipulation capabilities for Roo using the Extension Tool API.
