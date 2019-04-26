export enum LogType {
  TableLog,
  DealLog,
  PotLog,
}

export interface Log {
  type: LogType;
  message: string;
}

export class Logger {
  protected _logs: Log[] = []

  constructor(logger?: Logger) {
    if (logger) {
      this._logs = logger.logs;
    }
  }

  get logs() { return [...this._logs] }

  log(type: LogType, message: string) {
    this._logs.push({
      type,
      message
    });
  }
}