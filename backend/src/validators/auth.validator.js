function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateRegister(req, res, next) {
  const { name, email, password, repeatPassword } = req.body ?? {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof repeatPassword !== "string"
  ) {
    return res.status(400).json({
      status: "fail",
      message: "Заполните все поля"
    });
  }

  if (name.trim().length < 2 || name.trim().length > 60) {
    return res.status(400).json({
      status: "fail",
      message: "Имя должно содержать от 2 до 60 символов"
    });
  }

  if (
    email.trim().length > 254 ||
    !validateEmail(email.trim())
  ) {
    return res.status(400).json({
      status: "fail",
      message: "Введите корректный email"
    });
  }

  if (
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    return res.status(400).json({
      status: "fail",
      message: "Пароль должен содержать не менее 8 символов"
    });
  }

  if (password !== repeatPassword) {
    return res.status(400).json({
      status: "fail",
      message: "Пароли не совпадают"
    });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      status: "fail",
      message: "Введите email и пароль"
    });
  }

  if (email.trim().length > 254 || !validateEmail(email.trim())) {
    return res.status(400).json({
      status: "fail",
      message: "Введите корректный email"
    });
  }

  next();
}