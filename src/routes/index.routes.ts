import {Router} from "express"
import userRouter from "./user.routes"
import mediaRouter from "./media.routes"
import userMediaRouter from './userMedia.routes'

const router = Router()

router.get('/', (req, res) => {
    res.send('Hey World!')
})

router.use('/users' ,userRouter )
router.use('/media', mediaRouter )
router.use('/myMedia', userMediaRouter)

export default router