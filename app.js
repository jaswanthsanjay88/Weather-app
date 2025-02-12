const API_KEY = 'YOUR_WEATHER_API_KEY'; // Replace with actual API key

document.getElementById('location').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getWeatherData(this.value);
    }
});

document.getElementById('getLocation').addEventListener('click', getUserLocation);

function getUserLocation() {
    if (navigator.geolocation) {
        document.getElementById('getLocation').textContent = 'Getting location...';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = `${position.coords.latitude},${position.coords.longitude}`;
                getWeatherData(coords);
                document.getElementById('getLocation').textContent = 'Use My Location';
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Unable to get your location. Please enter it manually.');
                document.getElementById('getLocation').textContent = 'Use My Location';
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
}

async function getWeatherData(location) {
    try {
        document.getElementById('current-data').innerHTML = '<p>Loading weather data...</p>';
        const response = await fetch(
            `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${location}&days=5&aqi=yes`
        );
        const data = await response.json();
        updateWeatherDisplay(data);
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

function updateWeatherDisplay(data) {
    // Update current conditions
    document.getElementById('current-data').innerHTML = `
        <h3>Temperature: ${data.current.temp_c}°C</h3>
        <p>Humidity: ${data.current.humidity}%</p>
        <p>Conditions: ${data.current.condition.text}</p>
    `;

    // Update farming-specific data
    document.getElementById('soil-data').innerHTML = `
        <h3>Soil Conditions</h3>
        <p>Moisture: ${data.forecast.forecastday[0].day.daily_chance_of_rain}% chance of rain</p>
    `;

    document.getElementById('wind-conditions').innerHTML = `
        <h3>Wind</h3>
        <p>Speed: ${data.current.wind_kph} km/h</p>
        <p>Direction: ${data.current.wind_dir}</p>
    `;

    // Update forecast
    const forecastHTML = data.forecast.forecastday.map(day => `
        <div class="forecast-day">
            <h4>${new Date(day.date).toLocaleDateString()}</h4>
            <p>Max: ${day.day.maxtemp_c}°C</p>
            <p>Min: ${day.day.mintemp_c}°C</p>
            <p>Rain: ${day.day.daily_chance_of_rain}%</p>
        </div>
    `).join('');
    
    document.getElementById('forecast-container').innerHTML = forecastHTML;
}
