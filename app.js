const API_CONFIG = {
    key: 'b2011dd465a840da948112534251202',
    baseUrl: 'http://api.weatherapi.com/v1'
};

function handleCitySearch() {
    const searchInput = document.getElementById('location').value.trim();
    if (searchInput) {
        getWeatherData(searchInput);
    }
}

// Update event listeners
document.getElementById('location').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleCitySearch();
    }
});
document.getElementById('searchCity').addEventListener('click', handleCitySearch);
document.getElementById('getLocation').addEventListener('click', getUserLocation);

function initializeWeatherApp() {
    // Start with a default city instead of geolocation
    getWeatherData('London');
    
    // Then try to get user's location in background
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(2);
                const lon = position.coords.longitude.toFixed(2);
                getWeatherDataByCoords(lat, lon);
            },
            () => {/* Silently fail if user denies location */}
        );
    }
}

document.addEventListener('DOMContentLoaded', initializeWeatherApp);

function getUserLocation() {
    if (navigator.geolocation) {
        document.getElementById('getLocation').textContent = 'Getting location...';
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // Format coordinates for better display
                const lat = position.coords.latitude.toFixed(2);
                const lon = position.coords.longitude.toFixed(2);
                document.getElementById('location').value = `${lat}, ${lon}`;
                getWeatherDataByCoords(lat, lon);
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

// Remove the showApiStatus function

async function getWeatherDataByCoords(lat, lon) {
    try {
        document.getElementById('current-data').innerHTML = '<p>Loading weather data...</p>';
        const url = `${API_CONFIG.baseUrl}/current.json?key=${API_CONFIG.key}&q=${lat},${lon}&aqi=no`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Weather data request failed');
        
        const data = await response.json();
        updateLocationInfo(data.location);
        updateWeatherDisplay(data);
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('current-data').innerHTML = 
            '<p>Error loading weather data. Please try again.</p>';
    }
}

async function getWeatherData(location) {
    try {
        document.getElementById('current-data').innerHTML = '<p>Loading weather data...</p>';
        
        // Remove coordinate matching as we're focusing on city search
        const url = `${API_CONFIG.baseUrl}/current.json?key=${API_CONFIG.key}&q=${encodeURIComponent(location)}&aqi=no`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(response.status === 404 ? 
                'City not found. Please check the spelling.' : 
                'Weather data request failed');
        }
        
        const data = await response.json();
        updateLocationInfo(data.location);
        updateWeatherDisplay(data);
        
        // Update input field with proper city name
        document.getElementById('location').value = data.location.name;
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('current-data').innerHTML = 
            `<p class="error-message">${error.message}</p>`;
    }
}

// Update location info display to focus on city information
function updateLocationInfo(location) {
    const locationInfo = document.getElementById('location-info');
    locationInfo.innerHTML = `
        <h3>${location.name}${location.region ? ', ' + location.region : ''}</h3>
        <div class="coordinates">
            <p>Country: ${location.country}</p>
            <p>Local Time: ${location.localtime}</p>
        </div>
    `;
    locationInfo.classList.add('active');
}

function updateWeatherDisplay(data) {
    // Update current conditions
    document.getElementById('current-data').innerHTML = `
        <div class="weather-main">
            <div class="condition-container">
                <img src="https:${data.current.condition.icon}" alt="${data.current.condition.text}">
                <h3>${data.current.condition.text}</h3>
            </div>
            <p class="temperature">${data.current.temp_c}°C / ${data.current.temp_f}°F</p>
            <p>Feels like: ${data.current.feelslike_c}°C / ${data.current.feelslike_f}°F</p>
            <p>Humidity: ${data.current.humidity}%</p>
            <p>Last updated: ${data.current.last_updated}</p>
        </div>
    `;

    document.getElementById('wind-conditions').innerHTML = `
        <div class="wind-info">
            <h3>Wind</h3>
            <p>Speed: ${data.current.wind_kph} km/h (${data.current.wind_mph} mph)</p>
            <p>Direction: ${data.current.wind_dir} (${data.current.wind_degree}°)</p>
            <p>Gust: ${data.current.gust_kph} km/h</p>
        </div>
    `;

    document.getElementById('forecast-container').innerHTML = `
        <div class="weather-details">
            <h3>Detailed Information</h3>
            <p>Pressure: ${data.current.pressure_mb} mb (${data.current.pressure_in} in)</p>
            <p>Precipitation: ${data.current.precip_mm} mm</p>
            <p>Cloud Cover: ${data.current.cloud}%</p>
            <p>UV Index: ${data.current.uv}</p>
            <p>Visibility: ${data.current.vis_km} km (${data.current.vis_miles} miles)</p>
            <p>Dew Point: ${data.current.dewpoint_c}°C</p>
            <p>Heat Index: ${data.current.heatindex_c}°C</p>
            <p>Wind Chill: ${data.current.windchill_c}°C</p>
        </div>
    `;
}
