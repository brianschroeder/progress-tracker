# Contributing to Goal Tracker

Thank you for your interest in contributing to Goal Tracker! This document provides guidelines for contributing to the project.

## 🤝 How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (OS, Node version, browser)

### Suggesting Features

Feature suggestions are welcome! Please create an issue describing:
- The feature you'd like to see
- Why it would be useful
- Any implementation ideas you have

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow existing code formatting
- Write meaningful commit messages
- Add comments for complex logic

### Testing

- Test your changes locally before submitting
- Ensure all features work as expected
- Test both development and Docker builds

### Database Changes

- If you modify the database schema, create a migration script
- Place migration scripts in the `scripts/` folder
- Document the migration in the PR description

## 🔒 Security

- Never commit sensitive data (API tokens, personal information)
- Keep the `.gitignore` updated
- Report security vulnerabilities privately via GitHub Security Advisories

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.
