import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8765';

class AuthService {
    constructor() {
        this.setupAxiosInterceptors();
    }

    setupAxiosInterceptors() {
        axios.interceptors.request.use(
            config => {
                const token = this.getToken();
                if (token) {
                    config.headers['Authorization'] = 'Bearer ' + token;
                }
                return config;
            },
            error => {
                return Promise.reject(error);
            }
        );

        axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    this.refreshToken()
                        .then(() => {
                            const config = error.config;
                            config.headers['Authorization'] = 'Bearer ' + this.getToken();
                            return axios(config);
                        })
                        .catch(() => {
                            this.logout();
                            window.location.href = '/login';
                        });
                }
                return Promise.reject(error);
            }
        );
    }

    login(username, password) {
        const formData = new FormData();
        formData.append('grant_type', 'password');
        formData.append('username', username);
        formData.append('password', password);
        formData.append('client_id', '93ed453e-b7ac-4192-a6d4-c45fae0d99ac');
        formData.append('client_secret', 'client.devd123');

        return axios.post(`${API_URL}/oauth/token`, formData)
            .then(response => {
                if (response.data.access_token) {
                    this.setToken(response.data);
                }
                return response.data;
            });
    }

    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            return JSON.parse(userStr);
        }
        return null;
    }

    getToken() {
        return localStorage.getItem('token');
    }

    setToken(tokenData) {
        localStorage.setItem('user', JSON.stringify(tokenData));
        localStorage.setItem('token', tokenData.access_token);
    }

    refreshToken() {
        const user = this.getCurrentUser();
        if (!user || !user.refresh_token) {
            return Promise.reject('No refresh token available');
        }

        const formData = new FormData();
        formData.append('grant_type', 'refresh_token');
        formData.append('refresh_token', user.refresh_token);
        formData.append('client_id', '93ed453e-b7ac-4192-a6d4-c45fae0d99ac');
        formData.append('client_secret', 'client.devd123');

        return axios.post(`${API_URL}/oauth/token`, formData)
            .then(response => {
                if (response.data.access_token) {
                    this.setToken(response.data);
                }
                return response.data;
            });
    }

    isAuthenticated() {
        const token = this.getToken();
        return !!token;
    }

    getAuthHeader() {
        const token = this.getToken();
        if (token) {
            return { Authorization: 'Bearer ' + token };
        }
        return {};
    }
}

export default new AuthService(); 