import './shared/jest';
import request from 'supertest';
import { Wallet } from 'ethers';
import {
  authorizedGetRequest,
  authorizedPatchRequest,
  loginUser,
} from './shared/request';
import { AuthRole } from '../src/auth/enums/auth-role.enum';
import { User } from '../src/users/schemas/users.schema';
import { Setting } from '../src/settings/schemas/settings.schema';

import {
  app,
  testingModule,
  server,
  usersService,
  usersSeeder,
  settingsSeeder,
  settingsService,
} from './shared/nest';

class LoggedInUser {
  accessToken: string;
  user: User;
  wallet: Wallet;
}

describe('Period Settings (E2E)', () => {
  const users: LoggedInUser[] = [];

  beforeAll(async () => {
    // Clear the database
    await settingsService.getSettingsModel().deleteMany({});
    await usersService.getModel().deleteMany({});

    // Seed and login 2 users
    for (let i = 0; i < 2; i++) {
      const wallet = Wallet.createRandom();
      const user = await usersSeeder.seedUser({
        identityEthAddress: wallet.address,
        rewardsAddress: wallet.address,
        roles: [AuthRole.USER, AuthRole.QUANTIFIER],
      });
      const response = await loginUser(app, testingModule, wallet);
      users.push({
        accessToken: response.accessToken,
        user,
        wallet,
      });
    }

    // SEED the admin user
    const wallet = Wallet.createRandom();
    const user = await usersSeeder.seedUser({
      identityEthAddress: wallet.address,
      rewardsAddress: wallet.address,
      roles: [AuthRole.ADMIN],
    });
    const response = await loginUser(app, testingModule, wallet);
    users.push({
      accessToken: response.accessToken,
      user,
      wallet,
    });
  });

  describe('GET /api/settings', () => {
    let setting: Setting;

    beforeEach(async () => {
      await settingsService.getSettingsModel().deleteMany({});
      setting = await settingsSeeder.seedSettings({
        key: 'PRAISE_SUCCESS_MESSAGE',
        value: '✅ Praise {@receivers} {reason}',
        type: 'String',
        group: 1,
        subgroup: 1,
      });
      await settingsSeeder.seedSettings({
        key: 'ANOTHER_SETTING',
        value: '32',
        type: 'Integer',
        group: 1,
        subgroup: 2,
      });
    });

    test('401 when not authenticated', async () => {
      return request(server).get(`/settings`).send().expect(401);
    });

    test('200 and correct body', async () => {
      const response = await authorizedGetRequest(
        `/settings`,
        app,
        users[0].accessToken,
      ).expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.length).toBe(2);

      const s = response.body[0];
      expect(s).toBeDefined();
      expect(s._id).toBe(setting._id.toString());
      expect(s.value).toBe(setting.value);
      expect(s).toBeProperlySerialized();
      expect(s).toBeValidClass(Setting);
    });

    test('200 and correct body when filtering on key', async () => {
      const response = await authorizedGetRequest(
        `/settings?key=PRAISE_SUCCESS_MESSAGE`,
        app,
        users[0].accessToken,
      ).expect(200);

      const s = response.body[0];
      expect(s).toBeValidClass(Setting);
      expect(s).toBeProperlySerialized();
      expect(s._id).toBe(setting._id.toString());
    });

    test('200 and correct body when filtering on type', async () => {
      const response = await authorizedGetRequest(
        `/settings?type=String`,
        app,
        users[0].accessToken,
      ).expect(200);

      const s = response.body[0];
      expect(s).toBeValidClass(Setting);
      expect(s).toBeProperlySerialized();
      expect(s._id).toBe(setting._id.toString());
    });

    test('200 and correct body when filtering on group', async () => {
      const response = await authorizedGetRequest(
        `/settings?group=1`,
        app,
        users[0].accessToken,
      ).expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.length).toBe(2);
    });

    test('200 and correct body when filtering on subgroup', async () => {
      const response = await authorizedGetRequest(
        `/settings?subgroup=2`,
        app,
        users[0].accessToken,
      ).expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.length).toBe(1);
      const s = response.body[0];
      expect(s).toBeValidClass(Setting);
      expect(s).toBeProperlySerialized();
      expect(s.key).toBe('ANOTHER_SETTING');
    });
  });

  describe('GET /api/settings/{id}', () => {
    let setting: Setting;

    beforeEach(async () => {
      await settingsService.getSettingsModel().deleteMany({});
      setting = await settingsSeeder.seedSettings({
        key: 'PRAISE_SUCCESS_MESSAGE',
        value: '✅ Praise {@receivers} {reason}',
        type: 'String',
      });
    });

    test('401 when not authenticated', async () => {
      return request(server).get(`/settings/${setting._id}`).send().expect(401);
    });

    test('200 when correct data is sent', async () => {
      const response = await authorizedGetRequest(
        `/settings/${setting._id}`,
        app,
        users[0].accessToken,
      );

      expect(response.status).toBe(200);

      const s = response.body;
      expect(s).toBeDefined();
      expect(s).toBeDefined();
      expect(s._id).toBe(setting._id.toString());
      expect(s.value).toBe(setting.value);
      expect(s).toBeProperlySerialized();
      expect(s).toBeValidClass(Setting);
    });
  });

  describe('PATCH /api/settings/{id}', () => {
    let setting: Setting;

    beforeEach(async () => {
      await settingsService.getSettingsModel().deleteMany({});
      setting = await settingsSeeder.seedSettings({
        key: 'PRAISE_SUCCESS_MESSAGE',
        value: '✅ Praise {@receivers} {reason}',
        type: 'String',
      });
    });

    test('401 when not authenticated', async () => {
      return request(server)
        .patch(`/settings/${setting._id}`)
        .send()
        .expect(401);
    });

    test('403 when user has no permission to edit', async () => {
      const response = await authorizedPatchRequest(
        `/settings/${setting._id}`,
        app,
        users[0].accessToken,
        {},
      );

      expect(response.status).toBe(403);
    });

    test('Invalid periodSettings parameters - no parameters', async () => {
      const response = await authorizedPatchRequest(
        `/settings/${setting._id}`,
        app,
        users[2].accessToken, // admin
        {},
      );

      expect(response.status).toBe(400);
    });

    test('Invalid settings value - Integer', async () => {
      const value = '99';
      const s = await settingsSeeder.seedSettings({
        key: 'INT_SETTING',
        value,
        type: 'Integer',
      });

      const newValue = 'not an integer'; // invalid value
      const response = await authorizedPatchRequest(
        `/settings/${s._id}`,
        app,
        users[2].accessToken,
        {
          value: newValue,
        },
      );

      expect(response.status).toBe(400);
    });

    test('Valid settings value - Integer', async () => {
      const value = 99;
      const testSetting = await settingsSeeder.seedSettings({
        key: 'INT_SETTING',
        value,
        type: 'Integer',
      });

      const newValue = 100; // valid value
      const response = await authorizedPatchRequest(
        `/settings/${testSetting._id}`,
        app,
        users[2].accessToken,
        {
          value: newValue.toString(),
        },
      );

      expect(response.status).toBe(200);

      const s = response.body;
      expect(s).toBeDefined();
      expect(s.value).toBe(newValue.toString());
      expect(s).toBeProperlySerialized();
      expect(s).toBeValidClass(Setting);
    });

    test('Invalid settings value - Float', async () => {
      const value = '99.99';
      const s = await settingsSeeder.seedSettings({
        key: 'FLOAT_SETTING',
        value,
        type: 'Float',
      });

      const newValue = 'not a float'; // invalid value
      const response = await authorizedPatchRequest(
        `/settings/${s._id}`,
        app,
        users[2].accessToken,
        {
          value: newValue,
        },
      );

      expect(response.status).toBe(400);
    });
    test('Valid settings value - Float', async () => {
      const value = '99.99';
      const testSetting = await settingsSeeder.seedSettings({
        key: 'FLOAT_SETTING',
        value,
        type: 'Float',
      });

      const newValue = 100.99; // valid value
      const response = await authorizedPatchRequest(
        `/settings/${testSetting._id}`,
        app,
        users[2].accessToken,
        {
          value: newValue.toString(),
        },
      );

      expect(response.status).toBe(200);

      const s = response.body;
      expect(s).toBeDefined();
      expect(s.value).toBe(newValue.toString());
      expect(s).toBeProperlySerialized();
      expect(s).toBeValidClass(Setting);
    });

    test('Invalid settings value - Boolean', async () => {
      const value = true;
      const s = await settingsSeeder.seedSettings({
        key: 'BOOL_SETTING',
        value,
        type: 'Boolean',
      });

      const newValue = 'not a boolean'; // invalid value
      const response = await authorizedPatchRequest(
        `/settings/${s._id}`,
        app,
        users[2].accessToken,
        {
          value: newValue,
        },
      );

      expect(response.status).toBe(400);
    });
    test('Valid settings value - Boolean', async () => {
      const value = true;
      const testSetting = await settingsSeeder.seedSettings({
        key: 'BOOL_SETTING',
        value,
        type: 'Boolean',
      });

      const newValue = false; // valid value
      const response = await authorizedPatchRequest(
        `/settings/${testSetting._id}`,
        app,
        users[2].accessToken,
        {
          value: newValue.toString(),
        },
      );

      expect(response.status).toBe(200);

      const s = response.body;
      expect(s).toBeDefined();
      expect(s.value).toBe(newValue.toString());
      expect(s).toBeProperlySerialized();
      expect(s).toBeValidClass(Setting);
    });

    test('Invalid settings value - IntegerList', async () => {
      const value = '1, 2, 3';
      const s = await settingsSeeder.seedSettings({
        key: 'INT_LIST_SETTING',
        value,
        type: 'IntegerList',
      });

      const newValue = 'not an integer list'; // invalid value
      const response = await authorizedPatchRequest(
        `/settings/${s._id}`,
        app,
        users[2].accessToken,
        {
          value: newValue,
        },
      );

      expect(response.status).toBe(400);
    });

    test('Valid settings value - IntegerList', async () => {
      const value = '1, 2, 3';
      const testSetting = await settingsSeeder.seedSettings({
        key: 'INT_LIST_SETTING',
        value,
        type: 'IntegerList',
      });

      const newValue = '4, 5, 6'; // valid value
      const response = await authorizedPatchRequest(
        `/settings/${testSetting._id}`,
        app,
        users[2].accessToken,
        {
          value: newValue,
        },
      );

      expect(response.status).toBe(200);

      const s = response.body;
      expect(s).toBeDefined();
      expect(s.value).toBe('4,5,6');
      expect(s).toBeProperlySerialized();
      expect(s).toBeValidClass(Setting);
    });

    test('Invalid settings value - JSON', async () => {
      const value = '{"key": "value"}';
      const s = await settingsSeeder.seedSettings({
        key: 'JSON_SETTING',
        value,
        type: 'JSON',
      });

      const newValue = 'not a JSON'; // invalid value
      const response = await authorizedPatchRequest(
        `/settings/${s._id}`,
        app,
        users[2].accessToken,
        {
          value: newValue,
        },
      );

      expect(response.status).toBe(400);
    });

    test('Valid settings value - JSON', async () => {
      const value = '{"key": "value"}';
      const s = await settingsSeeder.seedSettings({
        key: 'JSON_SETTING',
        value,
        type: 'JSON',
      });

      const newValue = '{"key": "new value"}'; // valid value
      const response = await authorizedPatchRequest(
        `/settings/${s._id}`,
        app,
        users[2].accessToken,
        {
          value: newValue,
        },
      );

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      const newValueObj = JSON.parse(newValue);
      const responseValueObj = JSON.parse(response.body.value);
      expect(responseValueObj).toMatchObject(newValueObj);

      const e = response.body;
      expect(e).toBeProperlySerialized();
      expect(e).toBeValidClass(Setting);
    });
  });
});
