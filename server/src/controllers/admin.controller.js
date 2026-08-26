import * as adminService from '../services/admin.service.js'

export async function dashboard(_req, res, next) {
  try {
    const data = await adminService.getDashboardSummary()
    res.status(200).json({ success: true, data, message: 'Dashboard summary' })
  } catch (err) {
    next(err)
  }
}