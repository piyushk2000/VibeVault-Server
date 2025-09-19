import {Router} from "express"
import userRouter from "./user.routes"
import mediaRouter from "./media.routes"
import userMediaRouter from './userMedia.routes'
import matchRouter from './match.routes'
import profileRouter from './profile.routes'
import swipeRouter from './swipe.routes'
import connectionRouter from './connection.routes'

const router = Router()

router.get('/', (req, res) => {
    res.send('Hey World!')
})

router.use('/users' ,userRouter )
router.use('/media', mediaRouter )
router.use('/myMedia', userMediaRouter)
router.use('/matches', matchRouter)
router.use('/profile', profileRouter)
router.use('/swipes', swipeRouter)
router.use('/connections', connectionRouter)

export default router