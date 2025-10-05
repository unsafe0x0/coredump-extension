# CoreDump Extension

<div align="center">

## Track Your Code, Dominate the Leaderboard

The official VS Code extension for CoreDump - automatically track your coding time, build streaks, and compete with developers worldwide directly from your favorite editor.

[CoreDump Web](https://coredump.vercel.app) • [Documentation](https://coredump.vercel.app/how-to-use) • [GitHub](https://github.com/unsafe0x0/CoreDump-Extension)

</div>

## Quick Start

### Installation

#### From VS Code Marketplace (Recommended)

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "CoreDump"
4. Click **Install**

#### Manual Installation

1. Download the latest `.vsix` file from [GitHub](https://github.com/unsafe0x0/CoreDump-Extension)
2. Open VS Code
3. Go to Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
4. Click the `...` menu → **Install from VSIX...**
5. Select the downloaded `.vsix` file

### Setup & Configuration

1. **Get Your Private Key**

   - Visit [CoreDump](https://coredump.vercel.app)
   - Sign up or log in to your account
   - Go to Dashboard → Private Key
   - Copy your private Private Key

2. **Configure Extension**

   - Open VS Code Settings (`Ctrl+,` / `Cmd+,`)
   - Search for "CoreDump"
   - Paste your Private Key in the **CoreDump: Private Key** field

3. **Start Coding!**
   - The extension automatically starts tracking when you begin coding
   - View your progress on the [CoreDump Dashboard](https://coredump.vercel.app/dashboard)

## Extension Settings

### `CoreDump.inputPrivateKey`

- **Description**: Quickly set or update your CoreDump Private Key via the Command Palette.
- **How to use**: Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`), search for `CoreDump: Enter Private Key`, and enter your key when prompted.
- **Purpose**: Provides a convenient way to configure your Private Key without navigating through settings.

## Supported Languages

The extension automatically detects and tracks the languages

## How It Works

1. **File Monitoring**: Tracks active file changes and editor focus
2. **Language Detection**: Identifies programming language from file extensions
3. **Data Collection**: Securely collects time spent and language usage
4. **Secure Sync**: Encrypts and sends data to CoreDump servers
5. **Real-time Updates**: Updates your profile and leaderboard position

## Development

### Prerequisites

- Node.js 18+
- VS Code Extension Development Environment
- TypeScript knowledge

## Contributing

We welcome contributions!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Requirements

- **VS Code**: Version 1.74.0 or higher
- **Node.js**: Version 16+ (for development)
- **Internet**: Required for data synchronization
- **CoreDump Account**: Free account at [coredump.vercel.app](https://coredump.vercel.app)

---

<div align="center">

**Made with ❤️ by UnsafeZero, for developers**

[Website](https://coredump.vercel.app) • [GitHub](https://github.com/unsafe0x0) • [Twitter](https://twitter.com/unsafezero) • [Discord](https://discord.gg/unsafezero)

</div>
