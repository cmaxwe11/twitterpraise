import BreadCrumb from '@/components/BreadCrumb';
import { HasRole, ROLE_ADMIN } from '@/model/auth';
import {
  PeriodPageParams,
  SinglePeriod,
  useSinglePeriodQuery,
} from '@/model/periods';
import BackLink from '@/navigation/BackLink';
import PeriodDetailsComponent from '@/pages/Periods/Details/components/Details';
import { classNames } from '@/utils/index';
import { PeriodStatusType } from 'api/dist/period/types';
import {
  faBalanceScaleLeft,
  faHeartbeat,
  faCalendarAlt,
  faCog,
} from '@fortawesome/free-solid-svg-icons';
import React, { Suspense } from 'react';
import {
  useHistory,
  useParams,
  useRouteMatch,
  Switch,
  Route,
  Redirect,
} from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import PeriodNameForm from './components/PeriodNameForm';
import { QuantifierMessage } from './components/QuantifierMessage';
import NavItem from '../../../navigation/NavItem';
import QuantifierTable from './components/QuantifierTable';
import ReceiverTable from './components/ReceiverTable';
import PeriodSettingsForm from './components/PeriodSettingsForm';

const PeriodDetailHead = (): JSX.Element => {
  const { periodId } = useParams<PeriodPageParams>();
  const isAdmin = useRecoilValue(HasRole(ROLE_ADMIN));
  const period = useRecoilValue(SinglePeriod(periodId));
  return (
    <>
      {' '}
      <div
        className={classNames(
          period?.status === 'OPEN'
            ? 'bg-green-300'
            : period?.status === 'QUANTIFY'
            ? 'bg-pink-300'
            : 'bg-gray-300',
          'float-right px-2 py-1 text-xs text-white rounded-full'
        )}
      >
        {period
          ? period.status === 'QUANTIFY'
            ? 'QUANTIFYING'
            : period.status
          : null}
      </div>
      {isAdmin ? <PeriodNameForm /> : <h2>{period?.name}</h2>}
      <PeriodDetailsComponent />
    </>
  );
};

const PeriodDetailPage = (): JSX.Element | null => {
  const { periodId } = useParams<PeriodPageParams>();
  const period = useRecoilValue(SinglePeriod(periodId));
  const isAdmin = useRecoilValue(HasRole(ROLE_ADMIN));
  const { path, url } = useRouteMatch();
  const { location } = useHistory();

  useSinglePeriodQuery(periodId, location.key);

  if (!period || !period.receivers) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <BreadCrumb name="Quantification periods" icon={faCalendarAlt} />
      <BackLink to="/periods" />

      <div className="max-w-4xl praise-box">
        <React.Suspense fallback="Loading…">
          <PeriodDetailHead />
        </React.Suspense>
      </div>

      <React.Suspense fallback="Loading…">
        <QuantifierMessage />
      </React.Suspense>

      <div className="flex space-x-4">
        <div>
          <div className="w-40 py-5 mb-5 break-words border rounded-lg shadow-sm bg-gray-50">
            <nav>
              <NavItem
                to={`${url}/receivers`}
                description="Receivers"
                icon={faHeartbeat}
              />
              <NavItem
                to={`${url}/quantifiers`}
                description="Quantifiers"
                icon={faBalanceScaleLeft}
              />
              <NavItem
                to={`${url}/settings`}
                description="Settings"
                icon={faCog}
              />
            </nav>
          </div>
        </div>

        <div className="w-full max-w-3xl praise-box">
          <Suspense fallback="Loading…">
            <Switch>
              <Route path={`${path}/receivers`}>
                <ReceiverTable />
              </Route>
              <Route path={`${path}/quantifiers`}>
                <QuantifierTable />
              </Route>
              <Route path={`${path}/settings`}>
                <PeriodSettingsForm
                  periodId={periodId}
                  disabled={period.status !== PeriodStatusType.OPEN || !isAdmin}
                />
              </Route>
              <Route path={`${path}`}>
                <Redirect to={`${url}/receivers`} />
              </Route>
            </Switch>
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default PeriodDetailPage;
