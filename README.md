# Kiss Diff
A super simple diff checker for your GitHub workflow.


Very simple, you provide the action with a `path` to a _file_ or _folder_, and it tells you if the file was `added`, `modified`, `removed`, or `renamed`. It will also output the items `name`, particularly usefull if it was just `renamed`.


## Usage
```yaml
name: My Workflow

on:
  push:

jobs:
  diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Kiss Diff
        uses: mudlabs/kiss-diff@v1.0.0
        with:
          path: path/to/folder
        id: diff
      - run: |
          echo 'Was folder added: ${{ steps.diff.output.added }}'
          echo 'Was folder modified: ${{ steps.diff.output.modified }}'
          echo 'Was folder removed: ${{ steps.diff.output.removed }}'
          echo 'Was folder renamed: ${{ steps.diff.output.renamed }}'
          echo 'What's the folders name: ${{ steps.diff.output.name }}'   
```

## Example Case
You have a workflow that only runs on a push event to a file path. But you don't want it to run if the file was `removed` _(deleted)_.

```yaml
name: My File Workflow

on:
  push:
    paths:
      - path/to/my/file.ext

jobs:
  diff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Kiss Diff
        uses: mudlabs/kiss-diff@v1.0.0
        id: diff
      - run: exit 1
        if: steps.diff.outputs.removed
```
