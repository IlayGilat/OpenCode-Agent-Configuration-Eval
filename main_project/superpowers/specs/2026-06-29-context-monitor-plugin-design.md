# Design: Context Monitoring Plugin

## Overview
A plugin-based monitoring system for `opencode` that tracks token usage per category (history, file reads, tool outputs, system instructions) to analyze context window consumption.

## Architectural Components

### 1. Plugin Interface (`ContextMonitorPlugin`)
- Hooks into `opencode` event bus.
- **Hooks:**
    - `chat.message`: Tracks user and assistant messages for token estimation.
    - `tool.execute.after`: Tracks content added to context via tools.

### 2. Token Estimator
- Provides basic estimation logic suitable for Google models.
- Estimates tokens based on character/byte counts as a heuristic.

### 3. Data Store
- An internal object mapping categories (e.g., `tool_outputs`, `chat_history`) to their estimated token counts.

## Workflow
1. Plugin initializes and registers hooks.
2. For each chat turn:
    - `chat.message` hook intercepts data, estimates tokens, and updates data store category.
3. For each tool execution:
    - `tool.execute.after` hook intercepts output, estimates tokens, and updates `tool_outputs` category.
4. On `process.on('exit')` or similar shutdown signal:
    - Plugin serializes the `Data Store` to `.opencode/context_usage_summary.json`.
