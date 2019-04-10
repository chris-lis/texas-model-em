export enum LogType {
  TableLog,
  DealLog,
  PotLog,
}

export class Logger {
  protected _logs: {
    type: LogType,
    message: string;
  }[] = []

  get logs() { return [...this._logs] }

  log(type: LogType, message: string) {
    this._logs.push({
      type,
      message
    });
  }
}