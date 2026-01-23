import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' 
  : 'https://your-production-api.com'

class ApiService {
  public baseURL: string

  constructor() {
    this.baseURL = API_BASE_URL
  }

  private async getAuthToken(): Promise<string | null> {
    return await AsyncStorage.getItem('authToken')
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const token = await this.getAuthToken()
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  }

  async capture(message: string): Promise<any> {
    const headers = await this.getHeaders()
    const response = await axios.post(
      `${this.baseURL}/api/capture`,
      { message },
      { headers }
    )
    return response.data
  }

  async getItems(type: 'people' | 'projects' | 'ideas' | 'admin'): Promise<any[]> {
    const headers = await this.getHeaders()
    const response = await axios.get(
      `${this.baseURL}/api/${type}`,
      { headers }
    )
    return response.data.items || []
  }

  async getItem(type: string, id: number): Promise<any> {
    const headers = await this.getHeaders()
    const response = await axios.get(
      `${this.baseURL}/api/${type}/${id}`,
      { headers }
    )
    return response.data
  }

  async search(query: string): Promise<any> {
    const headers = await this.getHeaders()
    const response = await axios.post(
      `${this.baseURL}/api/search`,
      { query },
      { headers }
    )
    return response.data
  }
}

export default new ApiService()
