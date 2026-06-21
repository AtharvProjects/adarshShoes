# Release Notes

## Gajraj Kirana Billing Software

### Version 1.0.0
**Build Date**: Auto-generated during build

### What's New
- **Full Electron Migration:** The application is now a standalone Windows desktop app, removing the dependency on external browsers and scripts.
- **Improved Database Hardening:** SQLite connections are now wrapped in recovery blocks to handle potential corruption and prevent app crashes.
- **Enhanced Diagnostics:** On startup, the application runs a full system check, verifying memory, folder permissions, and required components, saving the report in the `reports` directory.
- **Blank Screen Prevention:** If the underlying server takes too long to load or crashes, a friendly recovery screen is now presented.
- **Self-Contained Executable:** The installer now uses NSIS via `electron-builder` and also provides a Portable EXE.

### Dependencies
- Electron v34+
- Next.js v15+
- React v19+
- Better SQLite3

### Known Issues
- Very large databases (over 10GB) might take longer to load into memory on startup. Backups should be managed periodically.

### Installation Instructions
1. Run `Gajraj Kirana Billing Setup.exe`.
2. Follow the on-screen prompts to install it into `C:\Users\<User>\AppData\Local\Programs\gajrajkirana-billing` (default per-user install) or Machine level.
3. Launch from the Desktop or Start Menu shortcut.
4. All data will be automatically saved and backed up to your Windows User Data folder.
