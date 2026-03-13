# uskills

A CLI tool to manage and link agent skills across your workspace.

## 🎯 Why uskills?

`uskills` helps you organize your agent's capabilities by scanning a source directory, parsing skill metadata, and creating symbolic links to active skill folders through a beautiful, interactive CLI.

- **Purpose**: A streamlined way to manage and link AI Agent skills (prompts, tools, etc.) across different projects and environments.
- **Benefits**: Replaces tedious manual symlinking with an interactive, metadata-aware CLI, keeping your agent runtimes clean and organized.
- **When to Use**: When you have a central library of agent skills and need to link specific subsets to different agents or switch skill sets rapidly during development.

## ✨ Features

- 🛠 **Interactive UI**: Select skills to link using a smooth multiselect interface.
- 📝 **Metadata Aware**: Automatically extracts skill names and descriptions from `SKILL.md` front-matter.
- ⚙️ **Fully Configurable**: Customize source/target folders and cleanup behavior to fit your workflow.
- 🔗 **Smart Symlinks**: Handles link creation, relative paths, and cleanup automatically.
- 🚀 **Zero Config**: Sensible defaults let you get started immediately.

## 🚀 Quick Start

### Installation

```bash
# Using pnpm
pnpm add -g @neilguuu/uskills

# Using npm
npm install -g @neilguuu/uskills
```

### Usage

Simply run `uskills` in your project root:

```bash
uskills
```

### CLI Arguments

| Argument | Description |
| :--- | :--- |
| `--clean` | Force cleaning of target directories (overrides config). |
| `--no-clean` | Force skipping cleanup of target directories. |

**Examples:**

```bash
# Force clean target directories even if config says 'clean: false'
uskills --clean

# Skip cleaning even if config says 'clean: true'
uskills --no-clean
```

## 📂 Project Structure

By default, `uskills` expects your project to follow this structure:

```text
.
├── .uskills/           # Source skills directory
│   ├── skill-a/
│   │   └── SKILL.md    # Metadata file (optional)
│   └── skill-b/
├── .agent/skills/      # Target directory 1 (auto-generated)
└── .agents/skills/     # Target directory 2 (auto-generated)
```

### SKILL.md Example

```markdown
---
name: Web Researcher
description: Allows the agent to search and browse the web.
---
# Skill Content...
```

## ⚙️ Configuration

You can create a `uskills.config.ts` (or `.js`) in your project root to customize behavior:

```javascript
// uskills.config.js
export default {
  sourceSkillsDir: '.uskills',
  targetDirs: ['.agent/skills', '.agents/skills'],
  clean: true,
};
```

### Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `sourceSkillsDir` | `string` | `.uskills` | Where your source skill folders are located. |
| `targetDirs` | `string[]` | `['.agent/skills', '.agents/skills']` | Where symlinks should be created. |
| `clean` | `boolean` | `false` | Whether to empty target directories before linking. |

## 🛠 Local Development

```bash
# Clone the repository
git clone https://github.com/Hunter-Gu/uskills.git
cd uskills

# Install dependencies
pnpm install

# Build the project
pnpm build

# Link for local testing
pnpm link --global
```
