import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {Result} from "../../types/result";

type LoginRequest = {
    username: string;
    password: string;
};

type LoginResponse = {
    displayName: string;
    authorities: string[];
    token: string;
};

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery(),
    endpoints: (builder) => ({
        signIn: builder.mutation<Result<LoginResponse>, LoginRequest>({
            query: (credentials) => ({
                url: '/api/auth/signin',
                method: 'POST',
                body: credentials,
            }),
        }),
    }),
});

export const { useSignInMutation } = apiSlice;
export const { endpoints } = apiSlice;
export const { signIn } = endpoints;