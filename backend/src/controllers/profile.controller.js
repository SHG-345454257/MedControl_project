import {
  getPrimaryProfile,
  updatePrimaryProfile,
  getNotificationSettings,
  updateNotificationSettings,
  updatePrimaryAvatar
} from "../services/profile.service.js";

export async function getProfile(req, res, next) {
  try {
    const profile = await getPrimaryProfile(req.userId);

    if (!profile) {
      return res.status(404).json({
        status: "fail",
        message: "Медицинский профиль не найден"
      });
    }

    res.status(200).json({
      status: "success",
      profile
    });

  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, phone, birthDate, gender } = req.body;

    const profile = await updatePrimaryProfile(req.userId, {
      name,
      phone,
      birthDate,
      gender
    });

    if (!profile) {
      return res.status(404).json({
        status: "fail",
        message: "Медицинский профиль не найден"
      });
    }

    res.status(200).json({
      status: "success",
      message: "Данные профиля успешно обновлены",
      profile
    });
  } catch (error) {
    next(error);
  }
}


 // Получение настроек уведомлений
export async function getNotifications(req, res, next) {
  try {
    const settings = await getNotificationSettings(req.userId);

    if (!settings) {
      return res.status(404).json({
        status: "fail",
        message: "Настройки уведомлений не найдены"
      });
    }

    res.status(200).json({
      status: "success",
      settings
    });
  } catch (error) {
    next(error);
  }
}

// Обновление настроек уведомлений
export async function updateNotifications(req, res, next) {
  try {
    const { pushEnabled, soundEnabled, emailReports } = req.body;

    const settings = await updateNotificationSettings(req.userId, {
      pushEnabled,
      soundEnabled,
      emailReports
    });

    res.status(200).json({
      status: "success",
      message: "Настройки уведомлений обновлены",
      settings
    });
  } catch (error) {
    next(error);
  }
}


export async function updateAvatar(req, res, next) {
  try {
    const { avatarUrl } = req.body ?? {};

    if (
      typeof avatarUrl !== "string" ||
      avatarUrl.length > 60000 ||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(avatarUrl)
    ) {
      return res.status(400).json({
        message: "Не удалось обработать изображение аватара"
      });
    }

    const image = Buffer.from(avatarUrl.slice("data:image/jpeg;base64,".length), "base64");

    if (
      image.length < 4 ||
      image[0] !== 0xff ||
      image[1] !== 0xd8 ||
      image[image.length - 2] !== 0xff ||
      image[image.length - 1] !== 0xd9
    ) {
      return res.status(400).json({
        message: "Получен некорректный файл изображения"
      });
    }

    const profile = await updatePrimaryAvatar(req.userId, avatarUrl);

    if (!profile) {
      return res.status(404).json({
        message: "Медицинский профиль не найден"
      });
    }

    return res.json({
      status: "success",
      avatarUrl: profile.avatarUrl
    });
  } catch (error) {
    next(error);
  }
}