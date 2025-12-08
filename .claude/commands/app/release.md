Create a new release by bumping the version and pushing a tag.

**IMPORTANT:** First check for uncommitted changes:
```bash
git status
```

IF THERE ARE UNCOMMITTED CHANGES, YOU MUST STOP AND ASK THE USER IF THEY WANT TO COMMIT THEM FIRST.

Then run the release script:
```bash
./scripts/release.sh
```

The script will:
- Show the current version
- Let the user choose: patch, minor, major, or custom version
- Update version in package.json, Cargo.toml, and tauri.conf.json
- Create and push a git tag

You can also pass the version bump type directly:
- `./scripts/release.sh patch` - Bump patch version (1.0.0 -> 1.0.1)
- `./scripts/release.sh minor` - Bump minor version (1.0.0 -> 1.1.0)
- `./scripts/release.sh major` - Bump major version (1.0.0 -> 2.0.0)
- `./scripts/release.sh 2.0.0` - Set exact version
