from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sys
import os

# Add local path to sys.path so it can find the bidi module we copied over
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cv_engine import CVEngine

app = FastAPI()

# Allow CORS so Next.js frontend can communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = CVEngine()

class AnalyzeRequest(BaseModel):
    image: str # Base64 encoded JPEG
    target_id: str
    target_color: str = None

class ColorRequest(BaseModel):
    image: str
    hsv_lower: list
    hsv_upper: list
    min_percent: float = 2.0

@app.post("/analyze_frame")
async def analyze_frame(req: AnalyzeRequest):
    try:
        img_data = req.image
        if "," in img_data:
            img_data = img_data.split(",")[1]
        result = engine.analyze_frame(img_data, req.target_id, req.target_color)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze_color")
async def analyze_color(req: ColorRequest):
    try:
        img_data = req.image
        if "," in img_data:
            img_data = img_data.split(",")[1]
        result = engine.analyze_color(img_data, req.hsv_lower, req.hsv_upper, req.min_percent)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
