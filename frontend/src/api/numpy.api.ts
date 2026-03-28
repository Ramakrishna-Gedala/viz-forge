import client from "./client"

export const numpyApi = {
  statistics: (params: { sample?: boolean }) =>
    client.get<{ statistics: Record<string, Record<string, number>>; row_count: number }>("/numpy/statistics", { params }).then((r) => r.data),

  movingAverage: (params: { ticker?: string; window?: number }) =>
    client.get<{ ticker: string; window: number; raw: { date: string; close: number }[]; moving_average: { date: string; ma: number }[] }>("/numpy/moving-average", { params }).then((r) => r.data),

  correlationMatrix: () =>
    client.get<{ columns: string[]; matrix: Record<string, number>[] }>("/numpy/correlation-matrix").then((r) => r.data),

  fft: (params: { machine_id?: string }) =>
    client.get<{ machine_id: string; frequencies: number[]; amplitudes: number[]; raw_signal_sample: number[] }>("/numpy/fft", { params }).then((r) => r.data),

  preview: () =>
    client.get<Record<string, unknown>[]>("/numpy/preview").then((r) => r.data),
}
