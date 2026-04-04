async function getPrediction(crop, lat = 23.2599, lon = 77.4126) {
    try {
        const response = await fetch('http://127.0.0.1:8000/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ crop_name: crop, lat, lon })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Prediction failed');
        }

        const data = await response.json();
        return data; // { crop, predicted_price, unit, weather, timestamp }

    } catch (error) {
        console.error('KRISHIQ API Error:', error.message);
        throw error;
     }
}