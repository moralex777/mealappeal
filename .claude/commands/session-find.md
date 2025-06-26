# Session Search Command

Search sessions by criteria:

## Search Parameters
- **Keyword:** {{search_term}}
- **Category:** {{category}} (camera|ai-analysis|premium|performance|bugfix)
- **Date Range:** {{start_date}} to {{end_date}}
- **Has Problems:** {{true|false}}
- **Status:** {{complete|incomplete}}
- **Files Modified:** {{file_pattern}}

## Search Scope
- Session titles
- Goals
- Problems encountered
- Solutions implemented
- Key learnings
- File modifications

## Output Format
```markdown
## Search Results ({{count}} matches)

### 1. {{session_title}}
**Date:** {{date}}
**Relevance:** {{score}}
**Excerpt:** ...{{matching_text}}...
**Problems Solved:** {{problem_count}}
**Files:** {{files_modified}}

### 2. {{session_title}}
...
```

## Usage Examples
```
/session-find "camera rotation"
/session-find --category "bugfix" --has-problems true
/session-find --files "*camera*" --date-range "last-week"
```