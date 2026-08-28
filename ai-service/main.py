from fastapi import FastAPI
from app.api import routes

app = FastAPI(title="AI Try-On Service")

app.include_router(routes.router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
