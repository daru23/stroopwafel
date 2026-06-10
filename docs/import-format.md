# Import / Export format

The Dutch Study Tracker can export and import progress as a single JSON file. The format is round-trippable: export → import produces the same data.

## Schema

```json
{
  "format": "dutch-tracker-import",
  "version": 2,
  "modules": [
    {
      "id": "m-optional",
      "name": "De/Het woorden",
      "tags": ["vocab"],
      "notes": "Optional free-text notes.",
      "vocab": [
        { "nl": "de fiets", "en": "the bicycle", "example": "Ik ga met de fiets." }
      ],
      "quizzes": [
        { "score": 8, "total": 10, "date": "2026-06-01T10:00:00Z", "note": "Felt confident." }
      ]
    }
  ],
  "generalQuizzes": [
    {
      "moduleIds": ["m-optional"],
      "score": 12,
      "total": 15,
      "date": "2026-06-02T18:00:00Z",
      "note": "Mixed review"
    }
  ]
}
```

### Required fields

| Field | Type | Notes |
|---|---|---|
| `format` | string | Must be `"dutch-tracker-import"` |
| `version` | number | Must be `2` |
| `modules[].name` | string | Required; used for dedup if no `id` |
| `modules[].vocab[].nl` | string | Dutch word/phrase — required |
| `modules[].quizzes[].score` | number | Raw score |
| `modules[].quizzes[].total` | number | Must be > 0 |
| `generalQuizzes[].score` | number | Raw score |
| `generalQuizzes[].total` | number | Must be > 0 |

All other fields are optional.

## Merge semantics

When you import a file, existing data is **never deleted** — only extended:

- **Modules** are matched by `id` first, then by case-insensitive `name`.
  - Matched: name/tags/notes are shallow-merged; vocab and quizzes are appended (dedup by `nl` for vocab, by `id` for quizzes).
  - Unmatched: created as a new module.
- **generalQuizzes** are appended, deduplicated by `id`.

Importing the same file twice produces no duplicates.

## curl examples

These assume the API is running at `http://localhost:3000` with `API_TOKEN=secret`.

### Export current state

```bash
curl -s -H "Authorization: Bearer secret" http://localhost:3000/api/export \
  | jq . > my-backup.json
```

### Import a file

```bash
curl -s -X POST \
  -H "Authorization: Bearer secret" \
  -H "Content-Type: application/json" \
  -d @my-modules.json \
  http://localhost:3000/api/import
```

Response:

```json
{
  "rev": 5,
  "summary": {
    "newModules": 1,
    "mergedModules": 2,
    "vocabAdded": 42,
    "quizzesAdded": 3,
    "generalQuizzesAdded": 0
  }
}
```

### Minimal import example (vocabulary bulk-add)

```json
{
  "format": "dutch-tracker-import",
  "version": 2,
  "modules": [
    {
      "name": "De/Het woorden",
      "vocab": [
        { "nl": "de fiets",   "en": "the bicycle" },
        { "nl": "het station","en": "the station" },
        { "nl": "de trein",   "en": "the train",   "example": "De trein vertrekt om 9 uur." }
      ]
    }
  ]
}
```
