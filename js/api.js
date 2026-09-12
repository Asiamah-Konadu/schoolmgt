// Shared API utility for fetch requests

// Determine API path relative to the current location to avoid subdirectory issues
const API_BASE = window.location.pathname.includes('/teacher/') || 
                 window.location.pathname.includes('/parent/') || 
                 window.location.pathname.includes('/management/') ? '../api' : 'api';

class ApiClient {
    static async request(endpoint, payload) {
        try {
            const response = await fetch(`${API_BASE}/${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            let data;
            try {
                data = await response.json();
            } catch (e) {
                throw new Error(`Server returned invalid JSON (Status: ${response.status})`);
            }

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }
            
            if (data.status === 'error') {
                throw new Error(data.message || 'API Error');
            }
            
            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            showToast(error.message, 'error');
            throw error;
        }
    }
}
