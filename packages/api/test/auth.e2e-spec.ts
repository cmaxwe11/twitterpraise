import request from 'supertest';
import { Wallet } from 'ethers';
import {
  apiKeySeeder,
  server,
  usersSeeder,
  ethSignatureService,
} from './shared/nest';

describe('AuthController (E2E)', () => {
  describe('POST /api/auth/eth-signature/nonce', () => {
    /**
     *
     */
    test('400 when missing identityEthAddress', async () => {
      return request(server)
        .post('/auth/eth-signature/nonce')
        .send()
        .expect(400);
    });

    /**
     *
     */
    test('400 when identityEthAddress is empty', async () => {
      return request(server)
        .post('/auth/eth-signature/nonce')
        .send(JSON.stringify({ identityEthAddress: '' }))
        .expect(400);
    });

    /**
     *
     */
    test('400 when identityEthAddress is invalid', async () => {
      return request(server)
        .post('/auth/eth-signature/nonce')
        .send({ identityEthAddress: 'invalid' })
        .expect(400);
    });

    /**
     *
     */
    test('201 and correct body when identityEthAddress is valid, new user', async () => {
      const wallet = Wallet.createRandom();
      return request(server)
        .post('/auth/eth-signature/nonce')
        .send({
          identityEthAddress: wallet.address,
        })
        .expect(201)
        .then((response) => {
          const rb = response.body;
          expect(rb).toHaveProperty('nonce');
          expect(rb.nonce).not.toBeNull();
          expect(rb.nonce).not.toBeUndefined();
          expect(rb.nonce).not.toEqual('');
          expect(rb).toHaveProperty('identityEthAddress');
          expect(rb.identityEthAddress).toEqual(wallet.address);
        });
    });

    /**
     *
     */
    test('201 and correct body when identityEthAddress is valid, existing user', async () => {
      const wallet = Wallet.createRandom();
      await usersSeeder.seedUser({
        identityEthAddress: wallet.address,
      });
      return request(server)
        .post('/auth/eth-signature/nonce')
        .send({
          identityEthAddress: wallet.address,
        })
        .expect(201)
        .then((response) => {
          const rb = response.body;
          expect(rb).toHaveProperty('nonce');
          expect(rb.nonce).not.toBeNull();
          expect(rb.nonce).not.toBeUndefined();
          expect(rb.nonce).not.toEqual('');
          expect(rb).toHaveProperty('identityEthAddress');
          expect(rb.identityEthAddress).toEqual(wallet.address);
        });
    });
  });

  describe('POST /api/auth/eth-signature/login', () => {
    test('responds with 400 error when missing identityEthAddress', async () => {
      const response = await request(server)
        .post('/auth/eth-signature/login')
        .send({ signature: 'any' });
      expect(response.statusCode).toBe(400);
    });

    /**
     *
     */
    test('responds with 400 error when missing signature', async () => {
      const response = await request(server)
        .post('/auth/eth-signature/login')
        .send({ identityEthAddress: 'any' });
      expect(response.statusCode).toBe(400);
    });

    /**
     *
     */
    test('responds with 400 error when submitting identityEthAddress that does not exist', async () => {
      const response = await request(server)
        .post('/auth/eth-signature/login')
        .send({ identityEthAddress: 'invalid', signature: 'any' });
      expect(response.statusCode).toBe(400);
    });

    /**
     *
     */
    test('401 response when signature mismatch', async function () {
      const wallet = Wallet.createRandom();

      await request(server)
        .post('/auth/eth-signature/nonce')
        .send({ identityEthAddress: wallet.address });

      const signature = 'invalid signature';

      const body = {
        identityEthAddress: wallet.address,
        signature: signature,
      };

      return request(server)
        .post('/auth/eth-signature/login')
        .send(body)
        .expect(401);
    });

    /**
     *
     */
    test('401 response when nonce invalid', async function () {
      const wallet = Wallet.createRandom();

      await request(server)
        .post('/auth/eth-signature/nonce')
        .send({ identityEthAddress: wallet.address });

      const message = ethSignatureService.generateLoginMessage(
        wallet.address,
        'invalid nonce',
      );
      const signature = await wallet.signMessage(message);

      const body = {
        identityEthAddress: wallet.address,
        signature: signature,
      };

      return request(server)
        .post('/auth/eth-signature/login')
        .send(body)
        .expect(401);
    });

    /**
     *
     */
    test('401 response when message badly formatted', async function () {
      const wallet = Wallet.createRandom();

      const response = await request(server)
        .post('/auth/eth-signature/nonce')
        .send({ identityEthAddress: wallet.address });

      const message =
        'BAD MESSAGE FORMAT.\n\n' +
        `ADDRESS:\n${wallet.address}\n\n` +
        `NONCE:\n${response.body.nonce as string}`;
      const signature = await wallet.signMessage(message);

      const body = {
        identityEthAddress: wallet.address,
        signature: signature,
      };

      return request(server)
        .post('/auth/eth-signature/login')
        .send(body)
        .expect(401);
    });

    /**
     *
     */
    test('201 response with accessToken & refreshToken', async function () {
      const wallet = Wallet.createRandom();

      const response = await request(server)
        .post('/auth/eth-signature/nonce')
        .send({ identityEthAddress: wallet.address });

      const message = ethSignatureService.generateLoginMessage(
        wallet.address,
        response.body.nonce,
      );
      const signature = await wallet.signMessage(message);

      const body = {
        identityEthAddress: wallet.address,
        signature: signature,
      };

      return request(server)
        .post('/auth/eth-signature/login')
        .send(body)
        .expect(201)
        .then((response2) => {
          expect(response2.body.tokenType).toEqual('Bearer');
          expect(response2.body.identityEthAddress).toEqual(wallet.address);
          expect(response2.body).toHaveProperty('accessToken');
        });
    });
  });

  describe('Database API KEY authentication, GET /api/users', () => {
    test('401 when missing api key', async () => {
      return request(server).get('/users').expect(401);
    });

    /**
     *
     */
    test('401 when api key is invalid', async () => {
      return request(server).get('/users').set('token', 'invalid').expect(401);
    });

    /**
     *
     */
    test('200 when api key is valid', async () => {
      const apiKey = await apiKeySeeder.seedApiKey();
      return request(server)
        .get('/users')
        .set('x-api-key', apiKey.key)
        .expect(200);
    });
  });

  describe('.env API KEY authentication, GET various endpoints', () => {
    /**
     *
     */
    test('403 when accessing disallowed endpoint PATCH /api/periods/1', async () => {
      const apiKey = process.env.API_KEYS?.split(',')[0]; // Usee first api key for testing purposes
      expect(apiKey).not.toBeUndefined();
      if (apiKey) {
        return request(server)
          .patch('/periods/1')
          .set('x-api-key', apiKey)
          .expect(403);
      }
    });

    /**
     *
     */
    test('200 when accessing allowed endpoint /api/communities', async () => {
      const apiKey = process.env.API_KEYS?.split(',')[0]; // Usee first api key for testing purposes
      expect(apiKey).not.toBeUndefined();
      if (apiKey) {
        return request(server)
          .get('/communities')
          .set('x-api-key', apiKey)
          .expect(200);
      }
    });
  });
});
