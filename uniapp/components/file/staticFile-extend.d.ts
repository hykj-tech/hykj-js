import {StaticFileOptions} from "./staticFile";

declare global{
  const staticFile: (url: string, option?: StaticFileOptions)=> string
}
