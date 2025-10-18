import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface GenerateImageResponse {
  uuid: string
}

interface GenerateImageRequest {
  imagePrompt: string
  imagesStyle: string
}

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  endpoints: (builder) => ({
    generateImage: builder.mutation<GenerateImageResponse, GenerateImageRequest>({
      query: (body) => ({
        url: '/generate-image',
        method: 'POST',
        body,
      }),
    }),
  }),
})

export const { useGenerateImageMutation } = api
