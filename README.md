# PromptPad

A Spotlight-style prompt launcher for Windows and macOS. Quickly search, select, and paste your favorite prompts with optional context.

## Features

- **Global Hotkey** - Invoke from anywhere with `Cmd+Shift+Space` (macOS) or `Ctrl+Shift+Space` (Windows)
- **Fuzzy Search** - Find prompts instantly by name, tags, folder, or description
- **Rider Mode** - Add context to any prompt before pasting (e.g., select "Code Review" + add "focus on security")
- **Markdown Editor** - Full WYSIWYG markdown editing with Milkdown
- **Folder Organization** - Organize prompts into folders with tags
- **Theme Support** - Light, dark, or system theme
- **Cross-Platform** - Native performance on Windows 10/11 and macOS 10.15+

## How It Works

1. Press the global hotkey to open PromptPad
2. Type to search your prompts
3. Use arrow keys to navigate, `Tab` or `Space` to promote a prompt
4. (Optional) Add rider text for context
5. Press `Enter` to paste into your previous application

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/)
- [Tauri CLI](https://tauri.app/start/prerequisites/)

### Development

```bash
# Clone the repository
git clone https://gitlab.com/pisum-projects/projects/prompt-pad.git
cd prompt-pad

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build

```bash
# Build for production
npm run tauri build
```

Built applications are output to `src-tauri/target/release/bundle/`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+Shift+Space` | Toggle launcher |
| `Arrow Up/Down` | Navigate results |
| `Tab` or `Space` | Promote prompt (enter rider mode) |
| `Enter` | Paste prompt |
| `Escape` | Close / Cancel |
| `Backspace` | Clear promotion (when empty) |
| `Cmd/Ctrl+S` | Save (in editor) |

## Prompt Storage

Prompts are stored as Markdown files with YAML frontmatter in `~/PromptPad/prompts/`:

```markdown
---
id: "uuid"
name: "Code Review"
description: "Review code for issues"
tags: ["coding", "review"]
created: "2025-01-15T10:30:00Z"
use_count: 42
last_used_at: "2025-12-07T14:22:00Z"
---

Review the following code for:
- Potential bugs
- Performance issues
- Security vulnerabilities
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS 4, Zustand, Milkdown
- **Backend**: Tauri 2.x (Rust)
- **Search**: Fuse.js with weighted scoring

## Project Structure

```
prompt-pad/
├── src/                    # React frontend
│   ├── features/           # Launcher, Editor, Settings
│   ├── stores/             # Zustand state
│   └── lib/                # Tauri bindings, search, theme
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri commands
│   │   ├── storage/        # File-based storage
│   │   └── platform/       # OS-specific code
│   └── tauri.conf.json
└── docs/                   # PRD and implementation plan
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Merge Request

## License

This project is proprietary software by Pisum Projects.

## Acknowledgments

- [Tauri](https://tauri.app/) - Desktop app framework
- [Milkdown](https://milkdown.dev/) - Markdown editor
- [Fuse.js](https://fusejs.io/) - Fuzzy search library
