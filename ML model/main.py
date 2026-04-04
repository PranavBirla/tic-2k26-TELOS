from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
import pandas as pd
import numpy as np
import urllib.request
import json
import uvicorn
from datetime import datetime
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

le = LabelEncoder()
model = None
features = ["commodity", "arrival", "prev_price", "day", "month", "temperature", "humidity", "rainfall"]

def fetch_weather(lat=23.2599, lon=77.4126):
    url = (
        f"https://api.open-meteo.com/v1/forecast?"
        f"latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,weathercode"
        f"&timezone=Asia%2FKolkata"
    )
    try:
        with urllib.request.urlopen(url, timeout=5) as res:
            return json.loads(res.read())["current"]
    except Exception:
        return {"temperature_2m": 25.0, "relative_humidity_2m": 60.0, "precipitation": 0.0, "weathercode": 0}

@asynccontextmanager
async def lifespan(app: FastAPI):
    global model, le
    try:
        csv_path = Path(__file__).parent / "Data.csv"
        df = pd.read_csv(csv_path)

        np.random.seed(42)
        n = len(df)
        df["temperature"] = np.random.uniform(15, 40, n)
        df["humidity"]    = np.random.uniform(30, 90, n)
        df["rainfall"]    = np.random.uniform(0, 20, n)

        df["commodity"] = le.fit_transform(df["commodity"])

        model = RandomForestRegressor(n_estimators=100)
        model.fit(df[features], df["modal_price"])

        app.state.df = df
        print("✅ Model trained and ready.")
    except Exception as e:
        print(f"❌ Startup error: {e}")
    yield  # app runs here

app = FastAPI(title="KRISHIQ Price Prediction API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Schema ---
class PredictionRequest(BaseModel):
    crop_name: str
    lat: float = 23.2599
    lon: float = 77.4126

# --- Routes ---
@app.post("/predict")
async def predict_price(request: PredictionRequest):
    crop = request.crop_name.strip().title()
    
    if crop not in le.classes_:
        raise HTTPException(status_code=400, detail=f"Crop '{crop}' not found in database.")

    # Get encoded values and latest market data
    crop_encoded = le.transform([crop])[0]
    df = app.state.df
    
    crop_rows = df[df["commodity"] == crop_encoded]
    if crop_rows.empty:
        raise HTTPException(status_code=404, detail="No historical data for this crop.")
    
    latest_data = crop_rows.iloc[-1]
    
    # Fetch Weather
    weather = fetch_weather(request.lat, request.lon)
    
    # Prepare Input
    now = datetime.now()
    input_df = pd.DataFrame([[
        crop_encoded, 
        latest_data["arrival"], 
        latest_data["modal_price"], 
        now.day, 
        now.month,
        weather["temperature_2m"], 
        weather["relative_humidity_2m"], 
        weather["precipitation"]
    ]], columns=features)

    # Predict
    prediction = model.predict(input_df)[0]

    return {
        "crop": crop,
        "predicted_price": round(float(prediction), 2),
        "unit": "INR",
        "weather": {
            "temp": weather["temperature_2m"],
            "humidity": weather["relative_humidity_2m"],
            "condition_code": weather["weathercode"]
        },
        "timestamp": now.isoformat()
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)