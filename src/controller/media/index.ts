import { PrismaClient } from '@prisma/client'
import { SuccessResponse } from '../../helpers/api-response'
import axios from 'axios'
import { Request, Response } from 'express'

const prisma = new PrismaClient()

// const addMediaToUser = async (req: any, res: any) => {
//     console.log(req.body)
//     const { name, url } = req.body

//     const media = await prisma.media.create({
//         data: {
//             name,
//             url,
//         },
//     })
//     res.json(SuccessResponse('Media added successfully', media))
// }

const fetchAnime = async (req: Request, res: Response) => {
    // console.log("🚀 ~ fetchAnime ~ req:", req)
    const { page, limit, order, search } = req.query
    try {
        const response = await axios.get('https://shikimori.one/api/animes', {
            params: {
                page,
                limit,
                order,
                search,
                locale: 'en'
            }
        })
        console.log("🚀 ~ fetchAnime ~ response:", response)
        res.json(SuccessResponse('Anime fetched successfully', response.data))
    } catch (error) {
        res.status(500).json({ error: 'Error fetching anime data' })
    }
}

const fetchAnimeById = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        const response = await axios.get(`https://shikimori.one/api/animes/${id}` , {
            params: {
                locale: 'en' // Add this line to specify the language
            }
        })
        res.json(SuccessResponse('Anime fetched successfully', response.data))
    } catch (error) {
        res.status(500).json({ error: 'Error fetching anime data' })
    }
}

const fetchMovies = async (req: Request, res: Response) => {
    const { page, query } = req.query
    try {
        const response = await axios.get('https://api.themoviedb.org/3/search/movie', {
            params: {
                api_key: '291df334d6477bfda873f22a41a6f1c9',
                query: query || 'movie',
                page
            },
            headers: {
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTFkZjMzNGQ2NDc3YmZkYTg3M2YyMmE0MWE2ZjFjOSIsIm5iZiI6MTczMTk1NTMxNC4yODQxNTI3LCJzdWIiOiI2NzNiOGExMjYyNzIyZTc5YTIxNTVhMTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Luf3z_s74-3sqetUzBI1HKvQ95Qkh1zDn71jODiQLQg'
            }
        })
        res.json(SuccessResponse('Movies fetched successfully', response.data))
    } catch (error) {
        res.status(500).json({ error: 'Error fetching movie data' })
    }
}

const fetchSeries = async (req: Request, res: Response) => {
    const { page, query } = req.query
    try {
        const response = await axios.get('https://api.themoviedb.org/3/search/tv', {
            params: {
                api_key: '291df334d6477bfda873f22a41a6f1c9',
                query: query || 'series',
                page
            },
            headers: {
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTFkZjMzNGQ2NDc3YmZkYTg3M2YyMmE0MWE2ZjFjOSIsIm5iZiI6MTczMTk1NTMxNC4yODQxNTI3LCJzdWIiOiI2NzNiOGExMjYyNzIyZTc5YTIxNTVhMTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Luf3z_s74-3sqetUzBI1HKvQ95Qkh1zDn71jODiQLQg'
            }
        })
        res.json(SuccessResponse('Series fetched successfully', response.data))
    } catch (error) {
        res.status(500).json({ error: 'Error fetching series data' })
    }
}

const fetchMovieById = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
            params: {
                api_key: '291df334d6477bfda873f22a41a6f1c9'
            },
            headers: {
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTFkZjMzNGQ2NDc3YmZkYTg3M2YyMmE0MWE2ZjFjOSIsIm5iZiI6MTczMTk1NTMxNC4yODQxNTI3LCJzdWIiOiI2NzNiOGExMjYyNzIyZTc5YTIxNTVhMTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Luf3z_s74-3sqetUzBI1HKvQ95Qkh1zDn71jODiQLQg'
            }
        })
        res.json(SuccessResponse('Movie fetched successfully', response.data))
    } catch (error) {
        res.status(500).json({ error: 'Error fetching movie data' })
    }
}

const fetchSeriesById = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/tv/${id}`, {
            params: {
                api_key: '291df334d6477bfda873f22a41a6f1c9'
            },
            headers: {
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTFkZjMzNGQ2NDc3YmZkYTg3M2YyMmE0MWE2ZjFjOSIsIm5iZiI6MTczMTk1NTMxNC4yODQxNTI3LCJzdWIiOiI2NzNiOGExMjYyNzIyZTc5YTIxNTVhMTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Luf3z_s74-3sqetUzBI1HKvQ95Qkh1zDn71jODiQLQg'
            }
        })
        res.json(SuccessResponse('Series fetched successfully', response.data))
    } catch (error) {
        res.status(500).json({ error: 'Error fetching series data' })
    }
}

export { fetchAnime, fetchMovies, fetchSeries, fetchAnimeById, fetchMovieById, fetchSeriesById }