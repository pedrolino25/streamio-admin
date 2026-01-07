import { configureStore } from "@reduxjs/toolkit";
import { externalApi, internalApi } from "./api";

export const store = configureStore({
  reducer: {
    [externalApi.reducerPath]: externalApi.reducer,
    [internalApi.reducerPath]: internalApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(externalApi.middleware)
      .concat(internalApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

