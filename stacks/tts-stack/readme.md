```md
# Homelab Text-to-Speech Stack (Wyoming Piper + Node/Koa)

## Executive Summary

This repository implements a **private, LAN/VPN-only Text-to-Speech (TTS) system** designed for a homelab environment.

At its core:

- **Wyoming Piper** runs as the TTS engine, producing raw PCM audio from text.
- A **Node.js + Koa + TypeScript API** acts as a translator between:
  - HTTP/JSON requests from clients
  - the Wyoming Protocol (JSONL + binary audio frames) used by Piper
- A **minimal web client** demonstrates end-to-end usage by generating speech and playing it instantly in the browser.

The system is intentionally:
- **Simple**
- **Self-hosted**
- **Low-latency**
- **Not exposed to the public internet**

This document explains:
- what each component does
- how data flows through the system
- why architectural choices were made
- what the long-term upgrade path looks like

---

## High-Level Architecture

```

[ Web Browser ]
|
| HTTP (POST /tts, audio/wav)
v
[ Node.js TTS API ]
|
| Wyoming Protocol (TCP socket)
v
[ wyoming-piper ]
|
| Piper TTS engine
v
[ PCM audio frames ]

````

### Network Scope

- Everything runs **inside a private LAN or VPN**
- Only the **Node API + web UI** are reachable
- `wyoming-piper` is **internal-only** (Docker network, no exposed port)

No authentication is used at the application layer because **network isolation is the security boundary**.

---

## Core Components

### 1. Wyoming Piper (TTS Engine)

**What it is**
- A Wyoming Protocol server that wraps the Piper TTS engine
- Converts text into raw PCM audio
- Exposes a TCP socket (default port `10200`)

**What it does in this stack**
- Receives synthesis requests over a socket
- Emits structured events:
  - `audio-start`
  - `audio-chunk` (raw PCM payload)
  - `audio-stop`

**Key properties**
- Very fast startup and inference
- Designed for streaming, but works well in batch mode
- Outputs raw PCM instead of browser-ready formats

---

### 2. Node.js + Koa TTS API

**Role**
- Acts as a **protocol translator**
- Converts:
  - REST-style HTTP requests → Wyoming Protocol events
  - PCM audio → WAV files

**Why this exists**
- Browsers do not understand Wyoming Protocol
- Browsers *do* understand `audio/wav`
- This layer decouples clients from Piper internals

**Responsibilities**
- Accept JSON requests (`POST /tts`)
- Validate input
- Open a TCP socket to Wyoming Piper
- Speak Wyoming Protocol
- Collect audio chunks
- Assemble a valid WAV file
- Return it to the client

---

### 3. Web Client (UI)

**Purpose**
- Provides a premium user interface to interact with the TTS system.
- Allows for real-time synthesis and playback.
- Serves as a reference implementation for frontend integration.

**Behavior**
- User enters text and (optionally) a voice name.
- Clicks “Speak” to trigger the synthesis pipeline.
- Receives a WAV blob and plays it immediately using a custom-styled `<audio>` element.
- Includes automatic health monitoring to check API and Piper status.

---

## Detailed Data Flow

### Step-by-step: `POST /tts`

1. **Client sends request**
   ```json
   {
     "text": "Hello from the homelab",
     "voice": "en_US-lessac-medium"
   }
````

2. **Node API validates**

   * Text is present
   * Length is within limits
   * Voice defaults to server-configured voice if omitted

3. **Node opens TCP socket**

   * Connects to `wyoming-piper:10200`

4. **Wyoming handshake**

   * Sends a `describe` event (optional but useful)
   * Sends a `synthesize` event with text and voice

5. **Piper processes text**

   * Emits Wyoming events back over the socket:

     * `audio-start`
     * multiple `audio-chunk` events
     * `audio-stop`

6. **Audio collection**

   * Each `audio-chunk` contains:

     * raw PCM bytes
     * metadata: sample rate, width, channels
   * Node buffers all PCM chunks in memory

7. **WAV construction**

   * Node builds a RIFF/WAV header
   * Concatenates header + PCM payload

8. **HTTP response**

   * `Content-Type: audio/wav`
   * Body = full WAV file
   * Browser can play immediately

---

## API Contract

### `POST /tts`

**Request**

```json
{
  "text": "string (required)",
  "voice": "string (optional)"
}
```

**Response**

* `200 OK`
* `Content-Type: audio/wav`
* Body: WAV bytes

**Notes**

* Streaming is intentionally not used (MVP)
* Entire file is buffered first
* Simple and browser-compatible

---

### `GET /health`

**Response**

```json
{
  "ok": true,
  "piper": "reachable"
}
```

**Purpose**

* Confirms the API is alive
* Confirms Piper is reachable over TCP

---

## Why WAV (and not streaming yet)

### Reasons for buffering-first MVP

* WAV is universally supported
* No browser-side complexity
* No MediaSource or WebAudio logic required
* Easy debugging (`curl > out.wav`)
* Deterministic behavior

### Tradeoff

* Slightly higher latency than true streaming
* Acceptable for homelab use and first iteration

---

## Configuration Model

All configuration is environment-variable driven.

### Key Variables

* `PIPER_HOST`
* `PIPER_PORT`
* `DEFAULT_VOICE`
* `MAX_TEXT_CHARS`
* `SOCKET_TIMEOUT_MS`
* `BIND_HOST`
* `BIND_PORT`

This keeps:

* Docker-friendly deployment
* Clear separation between code and environment

---

## Deployment Model

### Docker Compose

* One command brings up everything
* Internal service-to-service networking
* Only the API is exposed to the LAN/VPN

```
docker compose up -d --build
```

### Security Model

* No TLS internally
* No auth
* Trust boundary = VPN / private LAN
* Simple by design

---

## Design Philosophy

This project optimizes for:

* **Control** (self-hosted, no cloud)
* **Simplicity** (minimal moving parts)
* **Observability** (easy to debug)
* **Incremental evolution**

It is intentionally *not*:

* a SaaS-grade public API
* a multi-tenant system
* a high-availability cluster

---

## Upgrade Path (Planned Evolution)

### Phase 1: MVP (Current)

* Single hardcoded voice
* Buffer entire audio
* WAV output
* One request = one Piper connection

---

### Phase 2: Quality-of-Life Improvements

* Voice whitelist + `GET /voices`
* Filesystem or Redis caching
* Request deduplication
* Basic concurrency limits

---

### Phase 3: Lower Latency

* Stream PCM to browser using WebAudio API
* Begin playback before synthesis completes
* Optional chunked HTTP responses

---

### Phase 4: Advanced Audio

* Optional Opus encoding
* Sample-rate conversion
* Multiple output formats

---

### Phase 5: System Hardening

* Request queueing
* Backpressure handling
* Graceful degradation under load
* Metrics and tracing

---

## Intended Use Cases

* Personal assistants
* Smart home announcements
* Local automation
* Development testing
* Voice UI experiments
* Offline TTS workloads

---

## What This Repo Is Meant To Be Copied For

This repository is designed to be:

* a **template**
* a **reference implementation**
* a **starting point** for other private TTS services

You can:

* fork it
* extract the Wyoming client
* replace the frontend
* embed the API into a larger system

---

## Final Notes

This stack deliberately keeps complexity low while leaving clear, well-defined paths for growth.

If something feels “too simple”, that is intentional.

The goal is:

> **A reliable, understandable, private TTS system that you fully own.**
