#!/usr/bin/env python3
"""
Simple HTTP proxy that adds authentication headers and forwards requests.
"""

import json
from typing import Optional
from urllib.parse import urljoin

import httpx
import typer
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import Response
from zign.api import get_token

app = FastAPI()

# Global configuration
TARGET_URL: Optional[str] = None
TOKEN: Optional[str] = None


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"])
async def proxy_request(request: Request, path: str):
    """Forward all requests to target URL with authentication."""
    if not TARGET_URL or not TOKEN:
        return Response("Proxy not configured", status_code=500)

    # Build target URL
    target = urljoin(TARGET_URL + "/", path)
    if request.url.query:
        target += f"?{request.url.query}"

    # Prepare headers
    headers = dict(request.headers)
    headers.pop("host", None)  # Remove host header
    headers["Authorization"] = f"Bearer {TOKEN}"

    # Get request body
    body = await request.body()

    # Forward request
    async with httpx.AsyncClient() as client:
        try:
            response = await client.request(
                method=request.method,
                url=target,
                headers=headers,
                content=body,
            )
            return Response(
                content=response.content,
                status_code=response.status_code,
                headers=dict(response.headers),
            )
        except Exception as e:
            return Response(f"Proxy error: {e}", status_code=502)


def main(
    target_url: str = typer.Argument(..., help="Target URL to proxy to"),
    port: int = typer.Option(4000, "--port", "-p", help="Port to run on"),
    uid: str = typer.Option("uid", "--uid", "-u", help="User ID for token"),
    scope: str = typer.Option("uid", "--scope", "-s", help="Token scope"),
):
    """Start the proxy server."""
    global TARGET_URL, TOKEN

    # Get token
    try:
        TOKEN = get_token("uid", ["uid"])
        print(f"✅ Got auth token")
    except Exception as e:
        print(f"❌ Failed to get token: {e}")
        raise typer.Exit(1)

    TARGET_URL = target_url.rstrip("/")
    print(f"🚀 Proxy: localhost:{port} -> {TARGET_URL}")

    # Run server
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    typer.run(main)
