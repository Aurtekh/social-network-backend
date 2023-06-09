import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import UserModel from '../models/User.js';

export const login = async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return res.status(400).json({
        message: 'Неверный логин или пароль',
      });
    }

    const isValidPass = await bcrypt.compare(req.body.password, user._doc.passwordHash);

    if (!isValidPass) {
      return res.status(400).json({
        message: 'Неверный логин или пароль',
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      'secret',
      {
        expiresIn: '30d',
      },
    );

    const { passwordHash, ...userData } = user._doc;

    res.json({ ...userData, token });
  } catch (err) {
    res.status(500).json({
      message: 'Не удалось авторизоваться',
    });
  }
};

export const register = async (req, res) => {
  try {
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const doc = new UserModel({
      email: req.body.email,
      fullName: req.body.fullName,
      avatarUrl: req.body.avatarUrl,
      passwordHash: hash,
    });

    const user = await doc.save();

    const token = jwt.sign(
      {
        _id: user._id,
      },
      'secret',
      {
        expiresIn: '30d',
      },
    );

    const { passwordHash, ...userData } = user._doc;

    res.json({ ...userData, token });
  } catch (err) {
    res.status(500).json({
      message: 'Не удалось зарегистрироваться',
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await UserModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: 'Пользователь не найден',
      });
    }

    const { passwordHash, ...userData } = user._doc;

    res.json(userData);
  } catch (err) {
    res.status(500).json({
      message: 'Нет доступа',
    });
  }
};

export const updateMe = async (req, res) => {
  try {
    const userId = req.params.id;

    await UserModel.updateOne(
      {
        _id: userId,
      },
      {
        fullName: req.body.fullName,
        status: req.body.status,
        birthday: req.body.birthday,
        city: req.body.city,
        language: req.body.language,
        university: req.body.university,
        avatarUrl: req.body.avatarUrl,
      },
    );
    res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось обновить информацию о себе',
    });
  }
};

export const getSearchUsers = async (req, res) => {
  try {
    const name = req.params.id;
    const users = await UserModel.find({ fullName: { $regex: name, $options: 'i' } }).exec();

    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось найти пользователя',
    });
  }
};

export const getUserOne = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findById({ _id: userId });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(404).json({
      message: 'Нет такого пользователя',
    });
  }
};

export const getUserFriends = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await UserModel.findById(userId);
    const arrFriend = user.friends;
    const friends = await UserModel.find({ _id: { $in: arrFriend } }).exec();

    res.json(friends);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось получить список друзей',
    });
  }
};

export const deleteFriend = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded._id;

    const friendId = req.params.id;

    const doc = await UserModel.findOneAndUpdate(
      {
        _id: req.userId,
      },
      {
        $pull: { friends: friendId },
      },
    );

    if (!doc) {
      return res.status(404).json({
        message: 'Пользователь не найден',
      });
    }

    res.json(doc);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось удалить друга',
    });
  }
};

export const addFriend = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded._id;

    const friendId = req.params.id;

    const doc = await UserModel.findOneAndUpdate(
      {
        _id: req.userId,
      },
      {
        $push: { friends: friendId },
      },
    );

    if (!doc) {
      return res.status(404).json({
        message: 'Пользователь не найден',
      });
    }

    res.json(doc);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось добавить друга',
    });
  }
};
