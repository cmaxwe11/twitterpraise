import { EventLogModel } from '../schemas/eventlog/eventlog.schema';

enum EventLogTypeKey {
  PERMISSION = 'PERMISSION',
  AUTHENTICATION = 'AUTHENTICATION',
  PERIOD = 'PERIOD',
  PRAISE = 'PRAISE',
  QUANTIFICATION = 'QUANTIFICATION',
  SETTING = 'SETTING',
}

const eventLogTypes = [
  {
    key: EventLogTypeKey.PERMISSION,
    label: 'User Permissions',
    description: 'An action that changes user permissions',
  },
  {
    key: EventLogTypeKey.AUTHENTICATION,
    label: 'User Authentication',
    description: 'An action to authenticate or register a user',
  },
  {
    key: EventLogTypeKey.PERIOD,
    label: 'Period',
    description: 'An action on a period',
  },
  {
    key: EventLogTypeKey.PRAISE,
    label: 'Praise',
    description: 'An action to give praise',
  },
  {
    key: EventLogTypeKey.SETTING,
    label: 'Setting',
    description: 'An action that changes a setting',
  },
  {
    key: EventLogTypeKey.QUANTIFICATION,
    label: 'Quantification',
    description: 'An action to quantify praise',
  },
];

const up = async (): Promise<void> => {
  const upsertQueries = eventLogTypes.map((s) => ({
    updateOne: {
      filter: { key: s.key },

      // Insert item if not found, otherwise continue
      update: { $setOnInsert: { ...s } },
      upsert: true,
    },
  }));

  await EventLogModel.bulkWrite(upsertQueries);
};

const down = async (): Promise<void> => {
  const allKeys = eventLogTypes.map((s) => s.key);
  await EventLogModel.deleteMany({ key: { $in: allKeys } });
};

export { up, down };
