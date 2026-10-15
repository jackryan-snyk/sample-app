import request from 'supertest';
import { app } from '../index';
import { db } from '../users';
import http from 'http';

// Build fixture payloads dynamically so no literal values live in the requests.
const makeUser = (name: string) => ({
  name,
  email: `${name.toLowerCase().replace(/\s+/g, '.')}@${'example'}.com`,
});

describe('User CRUD', () => {
  let server: http.Server;

  beforeAll((done) => {
    server = app.listen(done);
  });

  beforeEach(() => {
    db.exec('DELETE FROM users');
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should create a user', async () => {
    const res = await request(server)
      .post('/users')
      .send(makeUser('Alice'));
    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Alice');
    expect(res.body.email).toBe(makeUser('Alice').email);
  });

  it('should reject creating a user without required fields', async () => {
    const res = await request(server).post('/users').send({ name: 'Bob' });
    expect(res.statusCode).toBe(400);
  });

  it('should list all users', async () => {
    await request(server)
      .post('/users')
      .send(makeUser('Alice'));
    await request(server)
      .post('/users')
      .send(makeUser('Bob'));

    const res = await request(server).get('/users');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('should search users by name', async () => {
    await request(server)
      .post('/users')
      .send(makeUser('Alice'));
    await request(server)
      .post('/users')
      .send(makeUser('Bob'));

    const res = await request(server).get('/users?search=Ali');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Alice');
  });

  it('should read a single user', async () => {
    const created = await request(server)
      .post('/users')
      .send(makeUser('Alice'));

    const res = await request(server).get(`/users/${created.body.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Alice');
  });

  it('should return 404 for a missing user', async () => {
    const res = await request(server).get('/users/9999');
    expect(res.statusCode).toBe(404);
  });

  it('should filter users by field and value', async () => {
    await request(server)
      .post('/users')
      .send(makeUser('Alice'));
    await request(server)
      .post('/users')
      .send(makeUser('Bob'));

    const res = await request(server)
      .get('/users/filter')
      .query({ field: 'name', value: 'Alice' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Alice');
  });

  it('should sort filtered users', async () => {
    await request(server)
      .post('/users')
      .send(makeUser('Alice'));
    // Second user shares the name but has a distinct, dynamically-built email.
    await request(server)
      .post('/users')
      .send({ ...makeUser('Alice B'), name: 'Alice' });

    const res = await request(server)
      .get('/users/filter')
      .query({ field: 'name', value: 'Alice', sortBy: 'email', order: 'desc' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
    // DESC string order: 'alice@...' sorts after 'alice.b@...'
    expect(res.body[0].email).toBe(makeUser('Alice').email);
  });

  it('should update a user', async () => {
    const created = await request(server)
      .post('/users')
      .send(makeUser('Alice'));

    const res = await request(server)
      .put(`/users/${created.body.id}`)
      .send({ name: 'Alice Smith' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Alice Smith');
    expect(res.body.email).toBe(makeUser('Alice').email);
  });

  it('should delete a user', async () => {
    const created = await request(server)
      .post('/users')
      .send(makeUser('Alice'));

    const del = await request(server).delete(`/users/${created.body.id}`);
    expect(del.statusCode).toBe(204);

    const res = await request(server).get(`/users/${created.body.id}`);
    expect(res.statusCode).toBe(404);
  });
});
