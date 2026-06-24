# Contributing to CyberAI

Thank you for your interest in contributing to CyberAI! This document provides guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a professional tone

## Getting Started

### Prerequisites

- Node.js 18+
- Git
- Cloudflare account (for deployment)

### Setup

```bash
# Fork and clone
git clone https://github.com/your-username/cyberai.git
cd cyberai

# Install dependencies
npm install

# Start development
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run test:load    # Run load tests
npm run lint         # Run linter
npm run format       # Format code
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 2. Make Changes

- Follow coding standards
- Write tests for new features
- Update documentation if needed

### 3. Test Your Changes

```bash
npm run test         # Unit tests
npm run test:e2e     # E2E tests
npm run lint         # Linting
```

### 4. Commit

Use conventional commits:

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update documentation"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

## Coding Standards

### TypeScript

- Use strict TypeScript
- Prefer interfaces over types for object shapes
- Use explicit return types for functions

### React

- Use functional components with hooks
- Keep components small and focused
- Use proper prop types

### CSS

- Use TailwindCSS utility classes
- Follow the design system tokens
- Support both light and dark modes

### Testing

- Write tests for new features
- Maintain >80% code coverage
- Test edge cases

## Pull Request Process

1. **Title**: Use conventional commit format
2. **Description**: Explain what and why
3. **Tests**: Include test results
4. **Screenshots**: For UI changes
5. **Review**: Request review from maintainers

### PR Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## Issue Guidelines

### Bug Reports

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior.

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**

- OS: [e.g., Windows 11]
- Browser: [e.g., Chrome 120]
- Version: [e.g., 1.0.0]
```

### Feature Requests

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution**
What you want to happen.

**Describe alternatives**
Other solutions you've considered.

**Additional context**
Any other context about the feature request.
```

## Questions?

- Open an issue with the "question" label
- Join our Discord community
- Email: support@cyberaiuz.workers.dev
