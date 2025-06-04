# Roo Notebook Tools

Roo NB tools are designed for fully autonomous AI agents to perform advanced notebook manipulations as part of larger, end-to-end tasks. Unlike stock notebook tools, which are more interactive and user-driven, Roo NB tools enable agents to manage and operate on notebooks programmatically and at scale.

## Key Features

- **Notebook Info**: Retrieve comprehensive information about the active notebook, including URI, kernel, and cell statistics.
- **Get Cells**: Access detailed information about all cells in the active notebook.
- **Insert Cells**: Insert multiple cells at any position, with support for batch operations and optional execution.
- **Replace Cells**: Replace a range of cells with new content, supporting both code and markdown cells, with optional execution.
- **Modify Cell Content**: Update the content of any cell, with the option to execute code cells automatically.
- **Execute Cells**: Execute a specified range of cells, supporting complex workflows and automation.
- **Delete Cells**: Remove a range of cells from the notebook efficiently.
- **Save Notebook**: Save the active notebook to disk programmatically.
- **Open Notebook**: Open a specified notebook file and make it the active editor for further manipulation.

## Usage

Think of the active notebook as the window and stats eye into large-scale data, enabling an autonomous AI agent to observe, analyze, and manipulate information mathematically —- no matter where the notebook kernel resides. With Roo NB tools, the AI agent can programmatically interact with notebooks hosted locally or remotely, leveraging the full power of VSCode's automation and AI-driven workflows.

Typical agent-driven tasks include:
- Analyzing notebook structure and extracting insights from cell content
- Inserting, modifying, or deleting cells at scale for data transformation and workflow automation
- Executing code cells to process, visualize, or summarize massive datasets
- Managing outputs and results, even for notebooks running on remote servers or cloud environments
- Automating end-to-end data engineering workflows, from data ingestion to advanced analytics, without manual intervention

Example agent tasks:
- Configure `sales_data_eu.ipynb` (kernel: Python 3, purpose: EU sales aggregation, running on a remote cloud server) and `sales_data_us.ipynb` (kernel: Python 3, purpose: US sales aggregation, running on another remote cloud server), then instruct the AI agent to merge, compare, and visualize global sales trends across both regions.
- Set up `experiment_a_results.ipynb` (kernel: R, purpose: analyze Experiment A, running on a remote research cluster) and `experiment_b_results.ipynb` (kernel: Python 3, purpose: analyze Experiment B, running on a local research cluster), then direct the AI agent to synthesize findings and generate a cross-experiment summary in `summary_report.ipynb` (also remote).
- Prepare `iot_edge_north.ipynb` and `iot_edge_south.ipynb` (both kernel: Python 3, purpose: ingest and clean sensor data from different regions, running on edge devices remotely), then have the AI agent orchestrate a combined anomaly detection workflow and output results to `anomaly_overview.ipynb` (remote).
- Configure `finance_onprem.ipynb` (kernel: Python 3, purpose: process on-premises financial data, running on a secure remote server) and `finance_cloud.ipynb` (kernel: Python 3, purpose: process cloud financial data, running in the cloud), then instruct the AI agent to cross-reference, reconcile, and produce a consolidated financial report in `finance_summary.ipynb` (remote).
- Set up `ml_train_a.ipynb` and `ml_train_b.ipynb` (kernels: Python 3, purpose: train models on different datasets, both running on remote GPU servers), then tell the AI agent to coordinate training, evaluate ensemble performance, and document results in `ensemble_results.ipynb` (remote).

Wherever the notebook kernel lives —- on your laptop, a remote server, or in the cloud —- Roo NB tools enable your AI agents to see, shape, and understand your data at scale, all from within VSCode.

## Requirements

- Visual Studio Code version 1.100.0 or higher (for Language Model Tools support)

## Extension Settings

- `roo-nb.maxOutputSize`: Maximum size (in characters) for cell output truncation (default: 2000)
- `roo-nb.timeoutSeconds`: Maximum seconds to wait for cell execution (default: 30)

Adjust these settings in VS Code preferences as needed for your workflow.

## Known Issues

- **Truncated Cell Contents**: Outputs longer than 2000 characters are truncated by default. Increase `roo-nb.maxOutputSize` for large outputs.
- **Execution Timeout**: Code cell execution times out after 30 seconds by default. Increase `roo-nb.timeoutSeconds` for long-running computations.

## Development

Roo NB tools demonstrate how to build a VSCode extension that empowers AI agents to autonomously manipulate and execute notebooks, enabling advanced, automated workflows beyond interactive, user-driven scenarios.
