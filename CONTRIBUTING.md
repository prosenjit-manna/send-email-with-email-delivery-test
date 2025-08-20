# Contributing to Email Deliverability Tester

Thank you for your interest in contributing to Email Deliverability Tester! This document provides guidelines and information for contributors.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a new branch for your feature: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites
- Node.js 16 or higher
- npm or yarn
- TypeScript knowledge

### Installation
```bash
git clone https://github.com/yourusername/email-deliverability-tester.git
cd email-deliverability-tester
npm install
```

### Build and Test
```bash
# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run examples
npm run example:basic
npm run example:advanced
```

## Project Structure

```
├── src/
│   ├── index.ts          # Main exports
│   ├── email-tester.ts   # Core functionality
│   └── cli.ts            # CLI implementation
├── examples/
│   ├── basic-usage.ts    # Basic usage examples
│   └── advanced-usage.ts # Advanced usage examples
├── tests/
│   └── email-tester.test.ts # Test suite
├── dist/                 # Compiled JavaScript (generated)
└── docs/                 # Documentation
```

## Code Style

- Use TypeScript for all new code
- Follow the existing code style and conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and small

### TypeScript Guidelines
- Always define proper types/interfaces
- Avoid `any` type when possible
- Use strict TypeScript configuration
- Export types for public APIs

## Testing

- Write tests for new features
- Ensure all tests pass before submitting PR
- Aim for good test coverage
- Use descriptive test names

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npm test -- email-tester.test.ts

# Run with coverage
npm test -- --coverage
```

## Pull Request Process

1. **Create a branch**: Create a feature branch from `main`
2. **Make changes**: Implement your feature or fix
3. **Add tests**: Write tests for your changes
4. **Update docs**: Update README or other docs if needed
5. **Test**: Ensure all tests pass
6. **Commit**: Use clear, descriptive commit messages
7. **Push**: Push your branch to your fork
8. **PR**: Create a pull request with a clear description

### Commit Message Guidelines
- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Example:
```
Add SMTP connection timeout configuration

- Add timeout option to SmtpConfig interface
- Implement timeout handling in SMTP tests
- Add tests for timeout scenarios
- Update documentation

Fixes #123
```

## Feature Requests and Bug Reports

### Bug Reports
Please include:
- Version of the package
- Node.js version
- Operating system
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

### Feature Requests
Please include:
- Clear description of the feature
- Use case and motivation
- Proposed API or implementation approach
- Any related issues or discussions

## Adding New Features

When adding new features:

1. **Discuss first**: Open an issue to discuss the feature
2. **Design**: Consider the API design and backward compatibility
3. **Implement**: Write the code following our guidelines
4. **Test**: Add comprehensive tests
5. **Document**: Update README and add examples if needed
6. **Types**: Ensure TypeScript types are properly exported

### API Guidelines
- Keep the API simple and intuitive
- Maintain backward compatibility when possible
- Use consistent naming conventions
- Provide good default values
- Support both promise and async/await patterns

## Documentation

- Update README.md for new features
- Add examples for complex features
- Update TypeScript type definitions
- Keep changelog updated

## Release Process

Releases are handled by maintainers:

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Publish to npm
5. Create GitHub release

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the GitHub Community Guidelines

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion for broader topics
- Reach out to maintainers directly

Thank you for contributing!
