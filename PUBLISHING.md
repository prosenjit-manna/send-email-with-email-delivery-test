# Publishing Guide for Email Deliverability Tester

This guide explains how to publish the email-deliverability-tester package to npm.

## Pre-publication Checklist

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Update version** (if needed)
   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```

4. **Update CHANGELOG.md** with new version details

## Publishing Steps

### 1. Create npm account
If you don't have an npm account:
- Go to https://www.npmjs.com/signup
- Create an account
- Verify your email

### 2. Login to npm
```bash
npm login
```

### 3. Check package name availability
```bash
npm view email-deliverability-tester
```

If the name is taken, you'll need to:
- Choose a different name (e.g., `@yourname/email-deliverability-tester`)
- Update the `name` field in `package.json`
- Update the README with the new name

### 4. Test the package locally (optional)
```bash
npm pack
```
This creates a `.tgz` file you can test in another project:
```bash
npm install ./email-deliverability-tester-1.0.0.tgz
```

### 5. Publish to npm
```bash
npm publish
```

For scoped packages:
```bash
npm publish --access public
```

### 6. Verify publication
- Check your package at https://www.npmjs.com/package/email-deliverability-tester
- Test installation: `npm install email-deliverability-tester`

## Alternative Package Names

If `email-deliverability-tester` is taken, consider:
- `@yourusername/email-deliverability-tester`
- `email-delivery-validator`
- `email-deliverability-checker`
- `email-validation-suite`
- `comprehensive-email-tester`

## GitHub Repository Setup

1. **Create a new repository** on GitHub
2. **Push your code:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/email-deliverability-tester.git
   git push -u origin main
   ```

3. **Update package.json** with correct repository URLs

## Post-publication

1. **Add npm badge** to README
2. **Create GitHub releases** for version tags
3. **Update documentation** if needed
4. **Promote your package** in relevant communities

## Maintenance

### Updating the package
1. Make changes
2. Update version: `npm version patch/minor/major`
3. Update CHANGELOG.md
4. Commit changes
5. Push to GitHub
6. Publish: `npm publish`

### CI/CD Setup (optional)
Consider setting up GitHub Actions for:
- Running tests on pull requests
- Automatic publishing on version tags
- Security scanning

## Security Best Practices

1. **Enable 2FA** on your npm account
2. **Use npm tokens** for CI/CD instead of passwords
3. **Regularly audit dependencies:** `npm audit`
4. **Keep dependencies updated**

## Support

- NPM documentation: https://docs.npmjs.com/
- GitHub packages: https://github.com/features/packages
- Semantic versioning: https://semver.org/
