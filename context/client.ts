import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  ListModelsResponse,
  ListFineTunesResponse,
  CreateFineTuneRequest,
  ListFineTuneEventsResponse,
  FineTune,
  ListFilesResponse,
  DeleteFileResponse,
  OpenAIFile,
  CreateCompletionRequest,
  CreateCompletionResponse,
} from 'openai';
import Router from 'next/router';
import { hasText } from '../utils/string';

interface OpenAIError {
  error: {
    message: string;
    type: string;
    param: object;
    code: object;
  };
}

export class OpenAIApi {
  private readonly axios: AxiosInstance;

  private readonly apiKey: string;

  public readonly enabled: boolean;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.enabled = hasText(apiKey);
    this.axios = axios.create({
      baseURL: 'https://api.openai.com/',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    this.axios.interceptors.response.use(
      (response) => response,
      (reject: AxiosError<OpenAIError>) => {
        const { response } = reject;
        if (!response) {
          console.error('NETWORK_ERR:', reject);
          return Promise.reject(reject);
        }
        // 401 Unauthorized redirect
        if (response.status === 401 && !Router.asPath.includes('onboarding')) {
          Router.push('/onboarding');
          return Promise.reject(reject);
        }
        if (response.data && response.data.error) {
          // todo: toast.error(response.data.error.message);
          return Promise.reject(reject);
        }
        // todo: toast.error message
        return Promise.reject(reject);
      }
    );
  }

  public listModels = () =>
    this.axios.get<ListModelsResponse>('/v1/models').then((res) => res.data);

  public deleteModel = (id: string) =>
    this.axios.delete(`/v1/models/${id}`).then((res) => res.data);

  public createFineTune = (body: CreateFineTuneRequest) =>
    this.axios.post<FineTune>('/v1/fine-tunes', body).then((res) => res.data);

  public listFineTunes = () =>
    this.axios.get<ListFineTunesResponse>('/v1/fine-tunes').then((res) => res.data);

  public listFineTuneEvents = (fineTuneId: string) =>
    this.axios
      .get<ListFineTuneEventsResponse>(`/v1/fine-tunes/${fineTuneId}/events`)
      .then((res) => res.data);

  public cancelFineTune = (fineTuneId: string) =>
    this.axios.post<FineTune>(`/v1/fine-tunes/${fineTuneId}/cancel`).then((res) => res.data);

  public listFiles = () => this.axios.get<ListFilesResponse>('/v1/files').then((res) => res.data);

  public createFile = (dto: { file: File; purpose: string }) => {
    const formData = new FormData();
    formData.append('file', dto.file);
    formData.append('purpose', dto.purpose);
    return this.axios.post<OpenAIFile>('/v1/files', formData).then((res) => res.data);
  };

  public retrieveFileContent = (fileId: string) =>
    this.axios.get<string>(`/v1/files/${fileId}/content`).then((res) => res.data);

  public deleteFile = (fileId: string) =>
    this.axios.delete<DeleteFileResponse>(`/v1/files/${fileId}`).then((res) => res.data);

  public createCompletion = (dto: CreateCompletionRequest) =>
    this.axios
      .post<CreateCompletionResponse>('/v1/completions', dto, {
        responseType: dto.stream ? 'stream' : undefined,
      })
      .then((res) => res.data);
}
