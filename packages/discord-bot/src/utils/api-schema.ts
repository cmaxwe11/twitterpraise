import { components } from 'api-types';

export type CreateUserAccountInputDto =
  components['schemas']['CreateUserAccountInputDto'];
export type CreateUserAccountResponseDto =
  components['schemas']['CreateUserAccountResponseDto'];

export type UpdateUserAccountInputDto =
  components['schemas']['UpdateUserAccountInputDto'];
export type UpdateUserAccountResponseDto =
  components['schemas']['UpdateUserAccountResponseDto'];

export type UserAccount = components['schemas']['UserAccount'];

export type User = components['schemas']['User'];
export type UserWithStatsDto = components['schemas']['UserWithStatsDto'];

export type Praise = components['schemas']['Praise'];
export type PraisePaginatedResponseDto =
  components['schemas']['PraisePaginatedResponseDto'];

export type PraiseForwardInputDto =
  components['schemas']['PraiseForwardInputDto'];

export type Setting = components['schemas']['Setting'];

export type CommunityPaginatedResponseDto =
  components['schemas']['CommunityPaginatedResponseDto'];
export type Community = components['schemas']['Community'];

export type PeriodPaginatedResponseDto =
  components['schemas']['PeriodPaginatedResponseDto'];

export type Period = components['schemas']['Period'];
export type PeriodDetailsDto = components['schemas']['PeriodDetailsDto'];
export type PeriodDetailsQuantifierDto =
  components['schemas']['PeriodDetailsQuantifierDto'];
