import moment from 'moment';
import uuidv4 from 'uuid/v4';
import db from '../db';
import Helper from './Helper';

const User = {
  async create(req, res) {
    if (!req.body.email || !req.body.password) {
      return res.status(400).send({'message': 'Some values are missing.'});
    }
    if (!Helper.isValidEmail(req.body.email)) {
      return res.status(400).send({'message': 'Please enter a valid email address.'});
    }
    const hashPassword = Helper.hashPassword(req.body.password);

    const createQuery = `INSERT INTO
      users(id, email, password, created_at, updated_at)
      VALUES($1, $2, $3, $4, $5)
      returning *`;
    const values = [
      uuidv4(),
      req.body.email,
      hashPassword,
      moment(new Date()),
      moment(new Date())
    ];

    try {
      const { rows } = await db.query(createQuery, values);
      const token = Helper.generateToken(rows[0].id);
      return res.status(201).send({ 
        token,
        isAdmin: rows[0].admin 
      });
    } catch(error) {
      if(error.routine === '_bt_check_unique') {
        return res.status(400).send({ 'message': 'User with that email already exists.'});
      }
      return res.status(400).send(error);
    }
  },
  async login(req, res) {
    if(!req.body.email || !req.body.password) {
      return res.status(400).send({'message': 'Some values are missing.'});
    }
    if(!Helper.isValidEmail(req.body.email)) {
      return res.status(400).send({'message': 'Please enter a valid email address.'});
    }
    const text = 'SELECT * FROM users WHERE email = $1';
    try {
      const { rows } = await db.query(text, [req.body.email]);
      if(!rows[0]) {
        return res.status(400).send({'message': 'The credentials provided are invalid.'});
      }
      const token = Helper.generateToken(rows[0].id);
      return res.status(200).send({ 
        token,
        isAdmin: rows[0].admin  
      });
    } catch(error) {
      return res.status(400).send(error);
    }
  }
}

export default User;