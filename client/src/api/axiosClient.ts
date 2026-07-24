import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const axiosClient = axios.create({
  //   baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  baseURL: import.meta.env.PROD ? "/api/v1/" : "http://localhost:5000/api/v1",
  withCredentials: true, // zaroori hai - refresh token httpOnly cookie automatically bhejne ke liye
});

// in-memory access token store (localStorage ke bajaye memory better hai XSS safety ke liye,
// lekin refresh page pe token khona na ho isliye hum ise auth context se sync rakhenge)
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// attach token on every request
axiosClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ---- Refresh-retry logic with request queueing ----

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshed(newToken: string) {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig;

    // agar 401 nahi hai, ya already retry ho chuka hai, ya yeh khud refresh call hai -> reject karo seedha
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // agar already koi refresh chal raha hai, is request ko queue me daal do
    if (isRefreshing) {
      return new Promise((resolve, _reject) => {
        subscribeTokenRefresh((newToken: string) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          resolve(axiosClient(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axiosClient.post("/auth/refresh");
      const newAccessToken = data.data.accessToken;

      setAccessToken(newAccessToken);
      isRefreshing = false;
      onRefreshed(newAccessToken);

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      refreshSubscribers = [];
      setAccessToken(null);

      // global event - AuthContext isko sunke logout + redirect karega
      window.dispatchEvent(new CustomEvent("session-expired"));

      return Promise.reject(refreshError);
    }
  },
);

export default axiosClient;
