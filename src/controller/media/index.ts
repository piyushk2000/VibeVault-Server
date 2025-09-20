import { SuccessResponse } from '../../helpers/api-response'
import axios from 'axios'
import { Request, Response } from 'express'
import prisma from '../../database/prisma'

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
    const { page = 1, limit = 20, search = '', sort = 'popularity' } = req.query
    try {
        const params: any = {
            page,
            limit,
            order: sort.toString(), // popularity, ranked, name, aired_on, episodes, status
            locale: 'en'
        };

        // Add search parameter if provided
        if (search && search.toString().trim()) {
            params.search = search.toString().trim();
        }

        const response = await axios.get('https://shikimori.one/api/animes', {
            params
        })

        // Transform and store anime data
        const transformedAnime = await Promise.all(
            response.data.map(async (anime: any) => {
                // Check if anime already exists in database
                let existingMedia = await prisma.media.findFirst({
                    where: { apiId: anime.id }
                });

                if (!existingMedia) {
                    // Create new media entry
                    existingMedia = await prisma.media.create({
                        data: {
                            apiId: anime.id,
                            title: anime.name || anime.russian || 'Unknown Title',
                            description: anime.description || 'No description available',
                            genres: anime.genres?.map((g: any) => g.name) || [],
                            image: `https://shikimori.one${anime.image.original}`,
                            type: 'ANIME',
                            meta: {
                                score: anime.score,
                                episodes: anime.episodes,
                                status: anime.status,
                                aired_on: anime.aired_on,
                                released_on: anime.released_on
                            }
                        }
                    });
                }

                return existingMedia;
            })
        );

        // Shikimori pagination logic - no total pages available
        const currentPageNum = parseInt(page.toString());
        const limitNum = parseInt(limit.toString());
        const hasNextPage = response.data.length === limitNum;
        const hasPrevPage = currentPageNum > 1;

        res.json(SuccessResponse('Anime fetched successfully', {
            data: transformedAnime,
            pagination: {
                currentPage: currentPageNum,
                totalPages: null, // Shikimori doesn't provide total pages
                hasNextPage,
                hasPrevPage
            }
        }))
    } catch (error) {
        console.error('Error fetching anime:', error);
        res.status(500).json({ error: 'Error fetching anime data' })
    }
}

const fetchAnimeById = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        const response = await axios.get(`https://api.jikan.moe/v4/anime/${id}`)
        res.json(SuccessResponse('Anime fetched successfully', response.data))
    } catch (error) {
        res.status(500).json({ error: 'Error fetching anime data' })
    }
}

const fetchMovies = async (req: Request, res: Response) => {
    const { page = 1, search = '', sort = 'popularity.desc' } = req.query
    try {
        let apiUrl = 'https://api.themoviedb.org/3/discover/movie';
        let params: any = {
            api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9',
            page,
            sort_by: sort.toString() // popularity.desc, release_date.desc, vote_average.desc, vote_count.desc
        };

        // Use search API if search query is provided
        if (search && search.toString().trim()) {
            apiUrl = 'https://api.themoviedb.org/3/search/movie';
            params = {
                api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9',
                page,
                query: search.toString().trim()
            };
        }

        const response = await axios.get(apiUrl, {
            params,
            headers: {
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTFkZjMzNGQ2NDc3YmZkYTg3M2YyMmE0MWE2ZjFjOSIsIm5iZiI6MTczMTk1NTMxNC4yODQxNTI3LCJzdWIiOiI2NzNiOGExMjYyNzIyZTc5YTIxNTVhMTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Luf3z_s74-3sqetUzBI1HKvQ95Qkh1zDn71jODiQLQg'
            }
        })

        // Get genre names (cache this for better performance)
        const genreResponse = await axios.get('https://api.themoviedb.org/3/genre/movie/list', {
            params: { api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9' }
        });
        const genreMap = genreResponse.data.genres.reduce((acc: any, genre: any) => {
            acc[genre.id] = genre.name;
            return acc;
        }, {});

        // Transform and store movie data
        const transformedMovies = await Promise.all(
            response.data.results.map(async (movie: any) => {
                // Check if movie already exists in database
                let existingMedia = await prisma.media.findFirst({
                    where: { apiId: movie.id }
                });

                if (!existingMedia) {
                    // Create new media entry
                    existingMedia = await prisma.media.create({
                        data: {
                            apiId: movie.id,
                            title: movie.title || movie.original_title || 'Unknown Title',
                            description: movie.overview || 'No description available',
                            genres: movie.genre_ids?.map((id: number) => genreMap[id]).filter(Boolean) || [],
                            image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
                            type: 'MOVIE',
                            meta: {
                                vote_average: movie.vote_average,
                                vote_count: movie.vote_count,
                                release_date: movie.release_date,
                                adult: movie.adult,
                                popularity: movie.popularity
                            }
                        }
                    });
                }

                return existingMedia;
            })
        );

        res.json(SuccessResponse('Movies fetched successfully', {
            data: transformedMovies,
            pagination: {
                currentPage: response.data.page,
                totalPages: response.data.total_pages,
                totalResults: response.data.total_results,
                hasNextPage: response.data.page < response.data.total_pages,
                hasPrevPage: response.data.page > 1
            }
        }))
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: 'Error fetching movie data' })
    }
}

const fetchSeries = async (req: Request, res: Response) => {
    const { page = 1, search = '', sort = 'popularity.desc' } = req.query
    try {
        let apiUrl = 'https://api.themoviedb.org/3/discover/tv';
        let params: any = {
            api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9',
            page,
            sort_by: sort.toString() // popularity.desc, first_air_date.desc, vote_average.desc, vote_count.desc
        };

        // Use search API if search query is provided
        if (search && search.toString().trim()) {
            apiUrl = 'https://api.themoviedb.org/3/search/tv';
            params = {
                api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9',
                page,
                query: search.toString().trim()
            };
        }

        const response = await axios.get(apiUrl, {
            params,
            headers: {
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIyOTFkZjMzNGQ2NDc3YmZkYTg3M2YyMmE0MWE2ZjFjOSIsIm5iZiI6MTczMTk1NTMxNC4yODQxNTI3LCJzdWIiOiI2NzNiOGExMjYyNzIyZTc5YTIxNTVhMTEiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.Luf3z_s74-3sqetUzBI1HKvQ95Qkh1zDn71jODiQLQg'
            }
        })

        // Get genre names (cache this for better performance)
        const genreResponse = await axios.get('https://api.themoviedb.org/3/genre/tv/list', {
            params: { api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9' }
        });
        const genreMap = genreResponse.data.genres.reduce((acc: any, genre: any) => {
            acc[genre.id] = genre.name;
            return acc;
        }, {});

        // Transform and store TV series data
        const transformedSeries = await Promise.all(
            response.data.results.map(async (series: any) => {
                // Check if series already exists in database
                let existingMedia = await prisma.media.findFirst({
                    where: { apiId: series.id }
                });

                if (!existingMedia) {
                    // Create new media entry
                    existingMedia = await prisma.media.create({
                        data: {
                            apiId: series.id,
                            title: series.name || series.original_name || 'Unknown Title',
                            description: series.overview || 'No description available',
                            genres: series.genre_ids?.map((id: number) => genreMap[id]).filter(Boolean) || [],
                            image: series.poster_path ? `https://image.tmdb.org/t/p/w500${series.poster_path}` : '',
                            type: 'SHOW',
                            meta: {
                                vote_average: series.vote_average,
                                vote_count: series.vote_count,
                                first_air_date: series.first_air_date,
                                popularity: series.popularity,
                                origin_country: series.origin_country
                            }
                        }
                    });
                }

                return existingMedia;
            })
        );

        res.json(SuccessResponse('Series fetched successfully', {
            data: transformedSeries,
            pagination: {
                currentPage: response.data.page,
                totalPages: response.data.total_pages,
                totalResults: response.data.total_results,
                hasNextPage: response.data.page < response.data.total_pages,
                hasPrevPage: response.data.page > 1
            }
        }))
    } catch (error) {
        console.error('Error fetching series:', error);
        res.status(500).json({ error: 'Error fetching series data' })
    }
}

const fetchMovieById = async (req: Request, res: Response) => {
    const { id } = req.params
    try {
        const response = await axios.get(`https://api.themoviedb.org/3/movie/${id}`, {
            params: {
                api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9'
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
                api_key: process.env.TMDB_API_KEY || '291df334d6477bfda873f22a41a6f1c9'
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

export {fetchAnime, fetchMovies,fetchSeries,fetchAnimeById,fetchMovieById,fetchSeriesById}