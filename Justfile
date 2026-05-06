set shell := ["zsh", "-cu"]

default:
  @just --list

dev:
  @cleanup() { \
    trap - EXIT INT TERM; \
    kill "$$ai_pid" "$$web_pid" 2>/dev/null || true; \
    wait "$$ai_pid" "$$web_pid" 2>/dev/null || true; \
  }; \
  trap 'cleanup' EXIT; \
  trap 'cleanup; exit 130' INT; \
  trap 'cleanup; exit 143' TERM; \
  (cd ai/server && npm run dev) & ai_pid=$$!; \
  (npm run dev) & web_pid=$$!; \
  wait

host:
  @cleanup() { \
    trap - EXIT INT TERM; \
    kill "$$ai_pid" "$$web_pid" 2>/dev/null || true; \
    wait "$$ai_pid" "$$web_pid" 2>/dev/null || true; \
  }; \
  trap 'cleanup' EXIT; \
  trap 'cleanup; exit 130' INT; \
  trap 'cleanup; exit 143' TERM; \
  (cd ai/server && HOST=0.0.0.0 npm run dev) & ai_pid=$$!; \
  (npm run dev -- --host 0.0.0.0) & web_pid=$$!; \
  wait
