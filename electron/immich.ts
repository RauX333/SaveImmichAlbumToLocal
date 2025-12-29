import axios, { AxiosInstance } from 'axios'

// Define interfaces based on the SDK usage we need
// We are not using the SDK directly because it's hard to configure axios deeply (like family: 4)
// and the export structure is a bit flat/generated.
// But we will use the same endpoints as the SDK would.

interface Album {
  id: string
  albumName: string
  assetCount: number
  // ... other fields
}

interface Asset {
  id: string
  originalFileName: string
  originalPath: string
  checksum?: string
  // ... other fields
}

export class ImmichClient {
  private baseUrl: string
  private apiKey: string
  private axiosInstance: AxiosInstance

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '') + '/api'
    this.apiKey = apiKey
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'x-api-key': this.apiKey,
        'Accept': 'application/json'
      },
      family: 4 // Force IPv4 to avoid ENETUNREACH/EHOSTUNREACH on some systems
    })
  }

  async validateConnection(): Promise<boolean> {
    try {
      // SDK equivalent: getMyUserInfo /users/me
      await this.axiosInstance.get('/users/me')
      return true
    } catch (e) {
      console.error('Validation failed', e)
      return false
    }
  }

  async getAlbums(): Promise<Album[]> {
    try {
      // SDK equivalent: getAllAlbums /albums
      const res = await this.axiosInstance.get('/albums')
      return res.data
    } catch (e) {
      console.error('Failed to get albums', e)
      throw e
    }
  }

  async getAlbumAssets(albumId: string): Promise<Asset[]> {
    try {
      // SDK equivalent: getAlbumInfo /albums/:id
      const res = await this.axiosInstance.get(`/albums/${albumId}`)
      return res.data.assets
    } catch (e) {
      console.error('Failed to get album assets', e)
      throw e
    }
  }

  async downloadAssetStream(assetId: string) {
    try {
      // SDK equivalent: downloadAsset /assets/:id/original
      // But we use a custom download path often used for direct file access or the /download/asset endpoint
      // Let's stick to the official API endpoint for downloading original file
      // /assets/:id/original
      
      const res = await this.axiosInstance.get(`/assets/${assetId}/original`, {
        responseType: 'stream',
        headers: {
            'Accept': 'application/octet-stream'
        }
      })
      return res.data
    } catch (e) {
      console.error('Failed to get asset stream', e)
      throw e
    }
  }
}
