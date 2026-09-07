import * as adminUserService from '../services/adminUser.service.js'

export async function list(req, res, next) {
  try {
    const data = await adminUserService.listUsers(req.query)
    res.json({ success: true, data })
  } catch (e) {
    next(e)
  }
}

export async function getOne(req, res, next) {
  try {
    const user = await adminUserService.getUserById(req.params.id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    res.json({ success: true, data: user })
  } catch (e) {
    next(e)
  }
}

export async function wishlist(req, res, next) {
  try {
    const items = await adminUserService.listWishlistForUser(req.params.id)
    res.json({ success: true, data: { items } })
  } catch (e) {
    next(e)
  }
}
