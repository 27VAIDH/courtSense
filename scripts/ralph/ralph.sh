#!/bin/bash
# Ralph Wiggum - Long-running AI agent loop
# Usage: ./ralph.sh [--tool amp|claude] [max_iterations]
#
# Features:
# - Strict bash mode + helpful error trap
# - Dependency checks
# - Fail-fast prompt file checks (CLAUDE.md / prompt.md)
# - Per-run + per-iteration logs under ./runs/<timestamp>/
# - Progress log with last lines from each iteration
# - External stop file: touch .stop-ralph
# - Optional per-iteration timeout + backoff on repeated empty output
# - Archives previous run when branch changes (based on prd.json)

set -Eeuo pipefail
trap 'echo "❌ Error on line $LINENO. Last command: $BASH_COMMAND" >&2' ERR

# -----------------------------
# Defaults
# -----------------------------
TOOL="${TOOL:-claude}"         # Default to claude
MAX_ITERATIONS=3
ITER_TIMEOUT="${ITER_TIMEOUT:-20m}"  # requires `timeout`; set to "0" to disable
SLEEP_SECS="${SLEEP_SECS:-2}"

# -----------------------------
# Parse arguments
# -----------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --tool)
      TOOL="${2:-}"
      shift 2
      ;;
    --tool=*)
      TOOL="${1#*=}"
      shift
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

# -----------------------------
# Validate tool choice
# -----------------------------
if [[ "$TOOL" != "amp" && "$TOOL" != "claude" ]]; then
  echo "Error: Invalid tool '$TOOL'. Must be 'amp' or 'claude'." >&2
  exit 1
fi

# -----------------------------
# Paths
# -----------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch"
STOP_FILE="$SCRIPT_DIR/.stop-ralph"

RUN_ID="$(date +%Y%m%d-%H%M%S)"
RUN_DIR="$SCRIPT_DIR/runs/$RUN_ID"

# -----------------------------
# Helpers
# -----------------------------
need_cmd() {
  command -v "$1" >/dev/null 2>&1 || { echo "Error: missing dependency: $1" >&2; exit 1; }
}

run_with_timeout() {
  # Usage: run_with_timeout <cmd...>
  if [[ "${ITER_TIMEOUT}" == "0" || -z "${ITER_TIMEOUT}" ]]; then
    "$@"
  else
    timeout "${ITER_TIMEOUT}" "$@"
  fi
}

# -----------------------------
# Dependency checks
# -----------------------------
need_cmd jq
need_cmd tee
need_cmd grep
need_cmd date
need_cmd sed
need_cmd mkdir
need_cmd cp
need_cmd cat

# `timeout` is optional if ITER_TIMEOUT=0
if [[ "${ITER_TIMEOUT}" != "0" && -n "${ITER_TIMEOUT}" ]]; then
  need_cmd timeout
fi

if [[ "$TOOL" == "amp" ]]; then
  need_cmd amp
else
  need_cmd claude
fi

# -----------------------------
# Prompt file checks
# -----------------------------
if [[ "$TOOL" == "claude" && ! -f "$SCRIPT_DIR/CLAUDE.md" ]]; then
  echo "Error: CLAUDE.md not found in $SCRIPT_DIR" >&2
  exit 1
fi

if [[ "$TOOL" == "amp" && ! -f "$SCRIPT_DIR/prompt.md" ]]; then
  echo "Error: prompt.md not found in $SCRIPT_DIR" >&2
  exit 1
fi

# -----------------------------
# Ensure folders/files exist
# -----------------------------
mkdir -p "$ARCHIVE_DIR"
mkdir -p "$RUN_DIR"
mkdir -p "$SCRIPT_DIR/runs"

if [[ ! -f "$PROGRESS_FILE" ]]; then
  {
    echo "# Ralph Progress Log"
    echo "Started: $(date)"
    echo "---"
  } > "$PROGRESS_FILE"
fi

echo "Starting Ralph - Tool: $TOOL - Max iterations: $MAX_ITERATIONS"
echo "Run dir: $RUN_DIR"
echo "Stop file: $STOP_FILE (touch to stop)"

# -----------------------------
# Archive previous run if branch changed
# -----------------------------
if [[ -f "$PRD_FILE" && -f "$LAST_BRANCH_FILE" ]]; then
  CURRENT_BRANCH="$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")"
  LAST_BRANCH="$(cat "$LAST_BRANCH_FILE" 2>/dev/null || echo "")"

  if [[ -n "$CURRENT_BRANCH" && -n "$LAST_BRANCH" && "$CURRENT_BRANCH" != "$LAST_BRANCH" ]]; then
    DATE_STR="$(date +%Y-%m-%d)"
    FOLDER_NAME="$(echo "$LAST_BRANCH" | sed 's|^ralph/||')"
    ARCHIVE_FOLDER="$ARCHIVE_DIR/$DATE_STR-$FOLDER_NAME"

    echo "Archiving previous run: $LAST_BRANCH"
    mkdir -p "$ARCHIVE_FOLDER"
    [[ -f "$PRD_FILE" ]] && cp "$PRD_FILE" "$ARCHIVE_FOLDER/" || true
    [[ -f "$PROGRESS_FILE" ]] && cp "$PROGRESS_FILE" "$ARCHIVE_FOLDER/" || true
    echo "   Archived to: $ARCHIVE_FOLDER"

    {
      echo "# Ralph Progress Log"
      echo "Started: $(date)"
      echo "---"
    } > "$PROGRESS_FILE"
  fi
fi

# Track current branch
if [[ -f "$PRD_FILE" ]]; then
  CURRENT_BRANCH="$(jq -r '.branchName // empty' "$PRD_FILE" 2>/dev/null || echo "")"
  if [[ -n "$CURRENT_BRANCH" ]]; then
    echo "$CURRENT_BRANCH" > "$LAST_BRANCH_FILE"
  fi
fi

# -----------------------------
# Main loop
# -----------------------------
FAILS=0

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS ($TOOL)"
  echo "==============================================================="

  # External stop switch
  if [[ -f "$STOP_FILE" ]]; then
    echo "🛑 Stop file found ($STOP_FILE). Exiting."
    exit 0
  fi

  ITER_LOG="$RUN_DIR/iter-$i.log"
  OUTPUT=""

  # Run the selected tool
  if [[ "$TOOL" == "amp" ]]; then
    set +e
    OUTPUT="$(run_with_timeout amp --dangerously-allow-all < "$SCRIPT_DIR/prompt.md" 2>&1 | tee "$ITER_LOG")"
    set -e
  else
    set +e
    OUTPUT="$(run_with_timeout claude --dangerously-skip-permissions --print < "$SCRIPT_DIR/CLAUDE.md" 2>&1 | tee "$ITER_LOG")"
    set -e
  fi

  # Progress log: keep it readable (tail last 120 lines)
  {
    echo ""
    echo "## Iteration $i - $(date)"
    echo "Tool: $TOOL"
    echo "Log: $ITER_LOG"
    echo "---"
    echo "$OUTPUT" | tail -n 120
    echo "---"
  } >> "$PROGRESS_FILE"

  # Completion detection (allow a few variants)
  if echo "$OUTPUT" | grep -Eq "<promise>COMPLETE</promise>|RALPH_COMPLETE|TASKS_COMPLETE"; then
    echo ""
    echo "✅ Ralph completed all tasks!"
    echo "Completed at iteration $i of $MAX_ITERATIONS"
    exit 0
  fi

  # Backoff on repeated empty output
  if [[ -z "${OUTPUT//[[:space:]]/}" ]]; then
    FAILS=$((FAILS + 1))
  else
    FAILS=0
  fi

  echo "Iteration $i complete. Continuing..."
  if (( FAILS >= 3 )); then
    echo "⚠️  $FAILS consecutive empty outputs. Backing off 15s..."
    sleep 15
  else
    sleep "$SLEEP_SECS"
  fi
done

echo ""
echo "❌ Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
echo "Check $PROGRESS_FILE for status."
echo "Run logs in: $RUN_DIR"
exit 1
