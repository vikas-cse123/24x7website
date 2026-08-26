export function health(_req, res) {
  res.status(200).json({
    success: true,
    message: 'API is running',
  })
}
