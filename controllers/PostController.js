import PostModel from '../models/Post.js';
import jwt from 'jsonwebtoken';
import UserModel from '../models/User.js';
import mongoose from 'mongoose';

export const getAll = async (req, res) => {
  try {
    const posts = await PostModel.find()
      .sort({ createdAt: -1, updatedAt: -1 })
      .populate('user')
      .exec();

    res.json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось получить статью',
    });
  }
};

export const getLikeOne = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded._id;

    const postId = req.params.id;

    const doc = await PostModel.findOneAndUpdate(
      {
        _id: postId,
      },
      {
        $inc: { viewsCount: 1 },
        $addToSet: { like: req.userId },
      },
    ).populate('user');

    if (!doc) {
      return res.status(404).json({
        message: 'Статья не найдена',
      });
    }

    res.json(doc);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось получить статью',
    });
  }
};

export const getSortPosts = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded._id;
    const userInfo = await UserModel.findById({ _id: req.userId });

    const howSortPosts = req.params.id;

    const posts = await PostModel.aggregate([
      {
        $match:
          howSortPosts[0] === '0'
            ? {}
            : {
                user: {
                  $in: userInfo.friends.map(function (id) {
                    return new mongoose.Types.ObjectId(id);
                  }),
                },
              },
      },
      { $addFields: { likesCount: { $size: '$like' } } },
      { $sort: howSortPosts[1] === '0' ? { createdAt: -1, updatedAt: -1 } : { likesCount: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
    ]).exec();

    res.json(posts);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось получить статью',
    });
  }
};

export const remove = async (req, res) => {
  try {
    const postId = req.params.id;

    const doc = await PostModel.findOneAndDelete({
      _id: postId,
    });

    if (!doc) {
      console.log(err);
      return res.status(404).json({
        message: 'Статья не найдена',
      });
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось удалить статью',
    });
  }
};

export const create = async (req, res) => {
  try {
    const doc = new PostModel({
      text: req.body.text,
      imageUrl: req.body.imageUrl,
      user: req.userId,
    });

    const post = await doc.save();

    res.json(post);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось создать статью',
    });
  }
};
