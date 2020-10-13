# Diffy
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
      - name: Diffy
        uses: mudlabs/diffy@v1.0.0
        with:
          path: path/to/folder
        id: diffy
      - run: |
          echo 'Was folder added: ${{ steps.diffy.output.added }}'
          echo 'Was folder modified: ${{ steps.diffy.output.modified }}'
          echo 'Was folder removed: ${{ steps.diffy.output.removed }}'
          echo 'Was folder renamed: ${{ steps.diffy.output.renamed }}'
          echo 'What's the folders name: ${{ steps.diffy.output.name }}'   
```

## Example Case
You have a workflow that only runs on a push event to a file path. But you don't want it to run if the file was `removed` _(deleted)_.

Note that in the example code we don't specify the `path` input. If you tie the workflow to events on a path, you can forgo the `path` input. Assuming it's the same path you want to _diff_.

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
        uses: mudlabs/diffy@v1.0.0
        id: diffy
      - run: exit 1
        if: steps.diffy.outputs.removed
  
  # Other jobs to run...
```
