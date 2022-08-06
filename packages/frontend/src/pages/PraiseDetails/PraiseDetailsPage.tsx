import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { BreadCrumb } from '@/components/ui/BreadCrumb';
import { SinglePeriodByDate } from '@/model/periods';
import {
  PraisePageParams,
  useLoadSinglePraiseDetails,
  SinglePraise,
} from '@/model/praise';
import { Praise } from '@/components/praise/Praise';
import { BackLink } from '@/navigation/BackLink';
import { PraiseBox } from '@/components/ui/PraiseBox';
import { PraisePage } from '@/components/ui/PraisePage';
import { PraiseDetailTable } from './components/PraiseDetailTable';

const PraiseDetailsPage = (): JSX.Element | null => {
  const { praiseId } = useParams<PraisePageParams>();
  useLoadSinglePraiseDetails(praiseId); // Load additional details for praise
  const praise = useRecoilValue(SinglePraise(praiseId));
  const period = useRecoilValue(SinglePeriodByDate(praise?.createdAt));
  const backLinkUrl =
    period?._id && praise?.receiver._id
      ? `/periods/${period?._id}/receiver/${praise?.receiver._id}`
      : '/';

  if (!praise) return null;

  return (
    <PraisePage>
      <BreadCrumb name={'Praise details'} icon={faCalendarAlt} />
      <BackLink to={backLinkUrl} />

      <React.Suspense fallback={null}>
        <PraiseBox classes="mb-5">
          <Praise praise={praise} />
        </PraiseBox>
      </React.Suspense>

      <PraiseBox>
        <React.Suspense fallback={null}>
          <PraiseDetailTable />
        </React.Suspense>
      </PraiseBox>
    </PraisePage>
  );
};

// eslint-disable-next-line import/no-default-export
export default PraiseDetailsPage;
