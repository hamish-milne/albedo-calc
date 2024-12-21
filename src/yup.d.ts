import "yup";

declare module "yup" {
  export interface SchemaRefDescription {
    label?: undefined;
    oneOf?: undefined;
  }

  export interface SchemaLazyDescription {
    oneOf?: undefined;
  }
}
