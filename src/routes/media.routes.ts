import express, {Router} from "express"
import { fetchAnime, fetchMovies, fetchSeries, fetchAnimeById, fetchMovieById, fetchSeriesById } from "../controller/media"

const router = Router()

router.get('/anime', fetchAnime)
router.get('/movies', fetchMovies)
router.get('/series', fetchSeries)
router.get('/anime/:id', fetchAnimeById)
router.get('/movies/:id', fetchMovieById)
router.get('/series/:id', fetchSeriesById)

export default router