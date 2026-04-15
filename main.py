from contextlib import asynccontextmanager
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config import settings
from infrastructure.gateway import tariff_gateway
from interfaces.routes import api_router

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST_DIR = BASE_DIR / "interfaces" / "frontend" / "dist"


@asynccontextmanager
async def lifespan(_: FastAPI):
    await tariff_gateway.start()
    try:
        yield
    finally:
        await tariff_gateway.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.FRONTEND_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Accept"],
    )

    app.include_router(api_router, prefix=settings.API_PREFIX)

    if FRONTEND_DIST_DIR.exists():
        assets_dir = FRONTEND_DIST_DIR / "assets"
        if assets_dir.exists():
            app.mount(
                "/assets",
                StaticFiles(directory=assets_dir),
                name="frontend-assets",
            )

        @app.get("/", include_in_schema=False)
        async def frontend_index() -> FileResponse:
            return FileResponse(FRONTEND_DIST_DIR / "index.html")

        @app.get("/{full_path:path}", include_in_schema=False)
        async def frontend_routes(full_path: str) -> FileResponse:
            api_prefix = settings.API_PREFIX.lstrip("/")
            if full_path == api_prefix or full_path.startswith(f"{api_prefix}/"):
                raise HTTPException(status_code=404, detail="Not Found")

            file_path = FRONTEND_DIST_DIR / full_path
            if full_path and file_path.exists() and file_path.is_file():
                return FileResponse(file_path)
            return FileResponse(FRONTEND_DIST_DIR / "index.html")
    else:
        @app.get("/", tags=["service"])
        async def root() -> dict[str, str]:
            return {
                "name": settings.APP_NAME,
                "status": "ok",
                "frontend": "not_built",
            }

    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.APP_RELOAD,
    )
