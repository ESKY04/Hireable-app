"""
FastAPI bridge: exposes AutoOffloadRouter to Next.js over HTTP on port 8001.
Run with: uvicorn lib.server:app --port 8001 --reload
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .auto_offload_router import setup_router

app = FastAPI(title="Hireable AI Router", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

router = setup_router()


class TaskRequest(BaseModel):
    task: str
    force_claude: bool = False


@app.get("/health")
def health():
    return {"status": "ok", "local_available": router.local_available}


@app.post("/execute")
def execute(req: TaskRequest):
    result = router.execute(req.task, force_claude=req.force_claude)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Execution failed"))
    return result


@app.get("/stats")
def stats():
    return router.get_stats()
