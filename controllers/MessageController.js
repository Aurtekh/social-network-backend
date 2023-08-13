import MessageModel from '../models/Message.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const sendMessage = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded._id; //мой id

    const time = new Date()
      .toLocaleString('en-US', {
        timeZone: 'Europe/Moscow',
        hour12: false,
      })
      .replace('24:', '00:');

    const anotherInterlocutorId = req.params.id; //id собеседника
    const participants = [anotherInterlocutorId, req.userId];
    const participantsReverb = [req.userId, anotherInterlocutorId];

    const isDialogCreate = await MessageModel.find({
      $or: [{ dialogParticipants: participantsReverb }, { dialogParticipants: participants }],
    });

    const doc = new MessageModel({
      text: req.body.text,
      sender: req.userId,
      recipient: anotherInterlocutorId,
      date: time,
    });

    const dialog = await doc.save();

    res.json(dialog);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось отправить сообщение',
    });
  }
};

export const getMessage = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded._id; //мой id
    const anotherInterlocutorId = req.params.id; //id собеседника

    const doc = await MessageModel.find({
      $or: [
        { sender: req.userId, recipient: anotherInterlocutorId },
        { recipient: req.userId, sender: anotherInterlocutorId },
      ],
    })
      .sort({ date: 1 })
      .populate('sender')
      .populate('recipient')
      .exec();

    if (!doc) {
      return res.status(404).json({
        message: 'Не удалось получить сообщения',
      });
    }

    res.json(doc);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось получить сообщения',
    });
  }
};

export const getNewMessage = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded._id; //мой id
    const anotherInterlocutorId = req.params.id; //id собеседника

    const doc = await MessageModel.find({
      $or: [
        { sender: req.userId, recipient: anotherInterlocutorId },
        { recipient: req.userId, sender: anotherInterlocutorId },
      ],
    })
      .sort({ date: 1 })
      .populate('sender')
      .populate('recipient')
      .exec();

    if (!doc) {
      return res.status(404).json({
        message: 'Не удалось получить сообщения',
      });
    }

    res.json(doc);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось получить сообщения',
    });
  }
};

export const getDialogs = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    const decoded = jwt.verify(token, 'secret');
    req.userId = decoded._id; //мой id

    const doc = await MessageModel.aggregate([
      {
        $match: {
          $or: [
            {
              recipient: new mongoose.Types.ObjectId(req.userId),
            },
            {
              sender: new mongoose.Types.ObjectId(req.userId),
            },
          ],
        },
      },
      {
        $project: {
          recipient: 1,
          sender: 1,
          text: 1,
          date: 1,
          fromToUser: ['$sender', '$recipient'],
        },
      },
      {
        $unwind: '$fromToUser',
      },
      {
        $sort: {
          fromToUser: 1,
        },
      },
      {
        $group: {
          _id: '$_id',
          fromToUser: {
            $push: '$fromToUser',
          },
          sender: {
            $first: '$sender',
          },
          recipient: {
            $first: '$recipient',
          },
          text: {
            $first: '$text',
          },
          date: {
            $first: '$date',
          },
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
      {
        $group: {
          _id: '$fromToUser',
          sender: {
            $first: '$sender',
          },
          recipient: {
            $first: '$recipient',
          },
          text: {
            $first: '$text',
          },
          date: {
            $first: '$date',
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'sender',
          foreignField: '_id',
          as: 'sender',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'recipient',
          foreignField: '_id',
          as: 'recipient',
        },
      },
    ]);

    if (!doc) {
      return res.status(404).json({
        message: 'Не удалось получить сообщения',
      });
    }

    res.json(doc);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось получить сообщения',
    });
  }
};
