import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import { registerValidation, loginValidation, postCreateValidation } from './validations.js';

import { checkAuth, handleValidationErrors } from './utils/index.js';
import { UserController, PostController, DialogController } from './controllers/index.js';

mongoose.set('strictQuery', false);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('DB ok'))
  .catch(() => console.log('DB error'));

const app = express();

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    cb(null, 'uploads');
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.post('/auth/login', loginValidation, handleValidationErrors, UserController.login);
app.post('/auth/register', registerValidation, handleValidationErrors, UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe);
app.patch('/me/:id', checkAuth, UserController.updateMe);
app.get('/users/:id', UserController.getSearchUsers);
app.get('/user/:id', UserController.getUserOne);
app.get('/friends/:id', UserController.getUserFriends);
app.get('/friends/delete/:id', UserController.deleteFriend);
app.get('/friends/add/:id', UserController.addFriend);

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});

app.get('/posts', PostController.getAll);
app.get('/posts/:id', PostController.getLikeOne);
app.get('/posts/sort/:id', PostController.getSortPosts);
app.post('/posts', checkAuth, postCreateValidation, handleValidationErrors, PostController.create);
app.delete('/posts/:id', checkAuth, PostController.remove);

app.post('/dialogs/:id', checkAuth, handleValidationErrors, DialogController.sendMessage);
app.get('/dialogs/:id', DialogController.getMessage);
app.get('/dialogs/new/:id', DialogController.getNewMessage);
app.get('/dialogs', DialogController.getDialogs);

app.listen(process.env.PORT || 4444, (err) => {
  if (err) {
    return console.log(err);
  }

  console.log('server OK');
});
