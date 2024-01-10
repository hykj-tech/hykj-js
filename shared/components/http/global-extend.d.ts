import {HttpRequestError} from './HttpUtil';
import {AxiosRequestConfig} from 'axios';
type FetchDataFn =  <DataType = any>(
  requestOptions: AxiosRequestConfig
) => Promise<[DataType | null, HttpRequestError | null]>;
declare global {
  interface Window{
    FetchData: FetchDataFn
  }
  const FetchData: FetchDataFn
}
export {};
