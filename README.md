# Roo Notebook Tools

Roo NB tools are designed for AI agents to leverage notebooks more autonomously in larger, more comprehensive tasks, unlike "stock" notebook tools (from GitHub Copilot and VSCode), which are designed to aid user interactions with notebooks, thus more human-driven.

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

Think of notebooks as the window and stats eye into large-scale data far beyond 2d sights at glances, the data can spread allover the world and will be overwhelming if to be stored or ingested locally, an autonomous AI agent has to observe, analyze, and process information via statistic querying and manipulation tools. With Roo NB tools, the AI agent can mathematically interact with BIG data via notebooks (that connect to kernels run anywhere), without flushing its LM contextual tokens by data volume.

Typical agent-driven, notebook-related subtasks include:
- Understand notebook structure and extracting insights from all cells' content
- Inserting, modifying, or deleting multiple cells in a single shot, for data transformation and workflow automation
- (Re)Executing multiple code cells to process, visualize, or summarize massive datasets
- Automating end-to-end data engineering workflows, from data ingestion to advanced analytics, without human intervention
- Against notebooks with the kernel running on remote servers or cloud environments

Example agent tasks:
- Configure `sales_data_eu.ipynb` (kernel: Python 3, purpose: EU sales aggregation, running on a remote cloud server) and `sales_data_us.ipynb` (kernel: Python 3, purpose: US sales aggregation, running on another remote cloud server), then instruct the AI agent to merge, compare, and visualize global sales trends across both regions periodicly.
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

- Clone the repository at https://github.com/longrun-ai/Roo-NB.git
- Run `npm install` inside the `Roo-NB` dir
- Debug it as VSCode extension or
- Run `npm build` to create `bin/roo-nb-v<version>.vsix` and install it
