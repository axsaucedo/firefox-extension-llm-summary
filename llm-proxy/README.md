# Simple LLM Proxy

A minimal HTTP proxy that adds authentication headers and forwards requests.

## Usage

```bash
# Install
uv sync

# Run proxy
uv run python llm_proxy.py https://api.anthropic.com --port 4000

# Or with custom auth
uv run python llm_proxy.py https://api.anthropic.com --port 4000 --uid myuser --scope openid
```

## What it does

1. Receives HTTP requests on localhost:4000
2. Extracts zign token using `get_token(uid, [scope])`
3. Adds `Authorization: Bearer {token}` header
4. Forwards request to target URL
5. Returns response

## Firefox Extension Setup

Configure extension with:
- API Endpoint: `http://localhost:4000/v1/chat/completions`
- Model: `claude-3-sonnet-20240229`
- Headers: `{}` (empty)

The proxy handles authentication automatically.