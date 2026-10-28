export default function noIndexApi(req, res, next) {
  console.log("noIndexApi вызван:", req.originalUrl);
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
}