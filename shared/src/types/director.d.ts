declare module 'director/build/director' {
  export class Router {
    on(pat: string, func: (value: string, ...restOfValue: string[]) => void): void;
    configure(config: {}): void;
    init(): void;
  }
  export default Router;
}
