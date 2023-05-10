import express from 'express';
import mongoose from 'mongoose';
import { registerValidation } from './validations/auth.js';

import checkAuth from './utils/checkAuth.js';

import * as UserController from './controllers/UserController.js';

mongoose
  .connect(
    'mongodb+srv://admin:ReactBlog007@cluster0.bmhpdht.mongodb.net/socialNetwork?retryWrites=true&w=majority',
  )
  .then(() => console.log('DB ok'))
  .catch(() => console.log('DB error'));

const app = express();

app.use(express.json());

app.post('/auth/login', UserController.login);

app.post('/auth/register', registerValidation, UserController.register);

app.get('/auth/me', checkAuth, UserController.getMe);

app.listen(4444, (err) => {
  if (err) {
    return console.log(err);
  }

  console.log('server OK');
});
