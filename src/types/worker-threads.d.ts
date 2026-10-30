declare module 'worker_threads' {
  // @types/node 26 renamed this to Transferable. thread-stream 4.2 still uses the old name.
  export type TransferListItem = Transferable;
}
