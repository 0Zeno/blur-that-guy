## Requirements

- Node.js
- Python 3.12
- pnpm
- uv
- ffmpeg

## Install

**Frontend**
```bash
pnpm install
```

**Backend**
```bash
uv venv server/.venv --python 3.12
source server/.venv/bin/activate
uv pip install -r server/requirements.txt
```

## Run

```bash
pnpm dev
```

This starts both the frontend at `http://localhost:5173` and the backend at `http://localhost:8000`.
