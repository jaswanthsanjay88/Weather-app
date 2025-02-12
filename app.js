const API_CONFIG = {
    key: 'b2011dd465a840da948112534251202',
    baseUrl: 'https://api.weatherapi.com/v1' // Changed to HTTPS
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
    // Show initial message in weather display
    document.getElementById('current-data').innerHTML = `
        <div class="welcome-message">
            <h3>Welcome to Weather Forecast</h3>
            <p>Enter a city name or use your current location to get started</p>
        </div>
    `;
    
    // Try to get user's location in background
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

async function fetchWithTimeout(url, timeout = 8000) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'Origin': window.location.origin
            }
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        // Check if it's a CORS or network error
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error - Please check your connection and try again');
        }
        throw error;
    }
}

async function getWeatherDataByCoords(lat, lon) {
    try {
        showLoading();
        if (!navigator.onLine) {
            throw new Error('No internet connection');
        }
        
        const url = `${API_CONFIG.baseUrl}/current.json?key=${API_CONFIG.key}&q=${lat},${lon}&aqi=no`;
        const response = await fetchWithTimeout(url);
        
        if (!response.ok) {
            throw new Error(getErrorMessage(response.status));
        }
        
        const data = await response.json();
        if (!data || !data.location) {
            throw new Error('Invalid data received from weather service');
        }
        
        updateLocationInfo(data.location);
        updateWeatherDisplay(data);
    } catch (error) {
        console.error('Error:', error);
        if (error.name === 'AbortError') {
            showError('Request timed out. Please try again.');
        } else {
            showError(error.message || 'Failed to fetch weather data');
        }
    }
}

async function getWeatherData(location) {
    try {
        showLoading();
        if (!navigator.onLine) {
            throw new Error('No internet connection');
        }
        // Ensure HTTPS
        const url = `${API_CONFIG.baseUrl}/current.json?key=${API_CONFIG.key}&q=${encodeURIComponent(location)}`;
        
        const response = await fetchWithTimeout(url);
        
        if (!response.ok) {
            throw new Error(getErrorMessage(response.status));
        }
        
        const data = await response.json();
        if (!data || !data.location) {
            throw new Error('Invalid data received');
        }
        
        // Fix image URLs to use HTTPS
        if (data.current && data.current.condition && data.current.condition.icon) {
            data.current.condition.icon = data.current.condition.icon.replace('http:', 'https:');
        }
        
        updateLocationInfo(data.location);
        updateWeatherDisplay(data);
        document.getElementById('location').value = data.location.name;
    } catch (error) {
        handleError(error);
    }
}

function handleError(error) {
    console.error('Error:', error);
    let message = error.message;
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        message = 'Network error - Please check your connection and try again';
    }
    showError(message);
}

function getErrorMessage(status) {
    switch (status) {
        case 0: return 'Network error - Please ensure you\'re using HTTPS';
        case 401: return 'API key error - Please check configuration';
        case 403: return 'Access forbidden - Please check HTTPS and CORS settings';
        case 404: return 'Location not found. Please check the spelling.';
        case 429: return 'Too many requests. Please try again later.';
        default: return `Weather service error (${status}). Please try again.`;
    }
}

function showLoading() {
    document.getElementById('current-data').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading weather data...</p>
        </div>
    `;
}

function showError(message) {
    document.getElementById('current-data').innerHTML = `
        <div class="error-container">
            <p class="error-message">${message}</p>
            <button onclick="handleRetry()" class="retry-button">Try Again</button>
        </div>
    `;
}

function handleRetry() {
    const location = document.getElementById('location').value.trim();
    if (location.includes(',')) {
        const [lat, lon] = location.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lon)) {
            getWeatherDataByCoords(lat, lon);
            return;
        }
    }
    handleCitySearch();
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
