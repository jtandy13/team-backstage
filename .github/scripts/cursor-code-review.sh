#!/usr/bin/env bash
set -euo pipefail

: "${BASE_SHA:?BASE_SHA is required}"
: "${HEAD_SHA:?HEAD_SHA is required}"
: "${CURSOR_API_KEY:?CURSOR_API_KEY is required}"
: "${GITHUB_OUTPUT:?GITHUB_OUTPUT is required}"

REVIEW_BODY_FILE="${REVIEW_BODY_FILE:-review-body.md}"
AGENT_OUTPUT_FILE="${AGENT_OUTPUT_FILE:-/tmp/agent-output.json}"
PR_DIFF_FILE="${PR_DIFF_FILE:-/tmp/pr.diff}"
AGENT_TIMEOUT="${AGENT_TIMEOUT:-12m}"

echo "Building diff between ${BASE_SHA} and ${HEAD_SHA}..."
git diff "${BASE_SHA}...${HEAD_SHA}" > "${PR_DIFF_FILE}"
CHANGED_FILES="$(git diff --name-only "${BASE_SHA}...${HEAD_SHA}")"

if [ -z "${CHANGED_FILES}" ]; then
  echo "No changed files in PR diff."
fi

echo "Running Cursor agent code review..."
PROMPT="$(cat <<EOF
Review the pull request changes in this repository.

Changed files:
${CHANGED_FILES:-"(none)"}

Full diff is available at ${PR_DIFF_FILE} — read it with your file tools.

Provide feedback on:
- Code quality and readability
- Potential bugs or issues
- Security considerations
- Best practices compliance

Format your response as GitHub-flavored Markdown suitable for a PR comment.
Be specific: cite file paths and line areas where possible.

At the very end of your response, on its own line, output exactly one of:
CRITICAL_ISSUES_FOUND=true
CRITICAL_ISSUES_FOUND=false

Use true only for issues that should block merging (security vulnerabilities,
data loss bugs, broken auth, etc.). Style/nit issues should use false.
EOF
)"

set +e
timeout "${AGENT_TIMEOUT}" agent -p --output-format json "${PROMPT}" > "${AGENT_OUTPUT_FILE}"
AGENT_EXIT=$?
set -e

if [ "${AGENT_EXIT}" -eq 124 ]; then
  echo "Cursor agent timed out after ${AGENT_TIMEOUT}."
  exit 1
fi

if [ "${AGENT_EXIT}" -ne 0 ]; then
  echo "Cursor agent failed with exit code ${AGENT_EXIT}."
  if [ -s "${AGENT_OUTPUT_FILE}" ]; then
    cat "${AGENT_OUTPUT_FILE}" >&2
  fi
  exit "${AGENT_EXIT}"
fi

if ! jq -e '.result' "${AGENT_OUTPUT_FILE}" >/dev/null 2>&1; then
  echo "Agent output did not contain a valid JSON result."
  cat "${AGENT_OUTPUT_FILE}" >&2
  exit 1
fi

REVIEW="$(jq -r '.result' "${AGENT_OUTPUT_FILE}")"

CRITICAL="$(echo "${REVIEW}" | grep -Eo 'CRITICAL_ISSUES_FOUND=(true|false)' | tail -1 | cut -d= -f2 || true)"
if [ "${CRITICAL}" != "true" ] && [ "${CRITICAL}" != "false" ]; then
  echo "Warning: agent did not emit CRITICAL_ISSUES_FOUND flag; defaulting to true (fail-safe)."
  CRITICAL="true"
fi

REVIEW_WITHOUT_FLAG="$(echo "${REVIEW}" | sed -E '/^CRITICAL_ISSUES_FOUND=(true|false)$/d')"

HEAD_SHA_SHORT="$(echo "${HEAD_SHA}" | cut -c1-7)"
RUN_URL="${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"

cat > "${REVIEW_BODY_FILE}" <<EOF
<!-- cursor-code-review -->
## Cursor Code Review

_Reviewed commit: \`${HEAD_SHA_SHORT}\`_ · _Workflow run: [link](${RUN_URL})_

${REVIEW_WITHOUT_FLAG}
EOF

echo "critical_issues_found=${CRITICAL}" >> "${GITHUB_OUTPUT}"
echo "Review written to ${REVIEW_BODY_FILE}"
echo "Critical issues found: ${CRITICAL}"
